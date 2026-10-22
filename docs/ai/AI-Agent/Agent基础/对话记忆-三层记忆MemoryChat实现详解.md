---
date: 2026-08-04
title: 对话记忆：从 Redis 单层历史到三层记忆（Memory Chat）
tags:
  - AI
  - AI Agent
  - LangChain
  - Redis
---

# 对话记忆：从 Redis 单层历史到三层记忆（Memory Chat）

> 上一篇 [对话记忆-从内存dict到Redis持久化.md](./对话记忆-从内存dict到Redis持久化.md) 讲了老接口用 Redis 存**单层会话历史**（`chat:session:{sid}`）。
> 本文是记忆系列的第三阶段：新增 `/api/chat/memory` 记忆版流式接口，把"一份历史"升级成**三层记忆**——短期对话窗口 + 中期滚动摘要 + 长期用户画像。

## 1. 为什么需要三层记忆

### 单层历史的三个痛点

老接口 `/api/chat/stream` 只存"一份消息数组"，聊得越多数组越长：

```
痛点 1：历史无限增长
  聊 100 轮 → 200 条消息全塞给模型 → 撑爆 context window / 烧 token

痛点 2：没有"记多久"的区分
  昨天聊的病历和 3 个月前的个人信息，对回答的重要性完全不同，
  却一样占着窗口

痛点 3：跨会话没有用户级记忆
  历史挂在 session_id 下，换个会话就忘了用户是谁、有什么禁忌
```

### 三层记忆的答案

| 层 | 名称 | 记什么 | 生命周期 | 类比 |
|---|---|---|---|---|
| L1 | 对话窗口 | 最近 10 轮完整对话 | 7 天滑动 | 聊天记录 |
| L2 | 滚动摘要 | 窗口外旧对话的浓缩 | 7 天滑动 | 会议纪要 |
| L3 | 用户画像 | 用户长期事实条目 | **永久** | 客户档案 |

```
L1 每次对话直接看（上下文）
  │ 太长了，溢出
  ▼
L2 浓缩成摘要，注入 system prompt（长期上下文）
  │ 从对话中提炼
  ▼
L3 用户画像，注入 system prompt（跨会话记忆）
```

***

## 2. 架构总览

```
POST /api/chat/memory  (SSE 流式)
└─ routes/chat.py: chat_memory()
   ├─ MemoryChatRequest (Pydantic 校验)
   └─ memory_chat_service.py
      ├─ 读三层记忆（history / summary / profile / meta）
      ├─ ChatPromptTemplate 组装（profile + summary + 历史 + 本轮）
      ├─ ChatOpenAI → opencode 网关（deepseek-v4-flash）
      ├─ 流式 yield {"content": ...}
      └─ 流结束：窗口压缩（L2）+ 惰性合并（L3）→ 写回 Redis
```

与老接口的关系：**完全不修改老接口**，Redis key 用 `mem:session:` 前缀与 `chat:session:` 隔离，两套并存。

***

## 3. Redis 数据结构：4 个 Key

一次会话占用 4 个 key（`app/services/memory_chat_service.py` 的 `_memory_keys()`）：

| Key | 存什么 | 格式 | TTL |
|---|---|---|---|
| `mem:session:{sid}:history` | L1 对话历史 | JSON 数组 | 7 天滑动 |
| `mem:session:{sid}:summary` | L2 滚动摘要 | 纯文本字符串 | 7 天滑动 |
| `mem:session:{sid}:profile` | L3 用户画像 | JSON 数组 | **永久** |
| `mem:session:{sid}:meta` | 惰性合并计时元数据 | JSON 对象 | 7 天滑动 |

```python
# _memory_keys() 返回的字典
{
  'history': 'mem:session:abc123:history',
  'summary': 'mem:session:abc123:summary',
  'profile': 'mem:session:abc123:profile',
  'meta':    'mem:session:abc123:meta',
}
```

`meta` 内容（惰性合并的"闹钟"）：

```json
{"last_consolidate_at": 1753200000.0, "last_saved_turn": 10}
// 上次提炼时间戳       // 上次提炼时的轮数
```

***

## 4. 核心流程：一次完整的记忆对话

`memory_chat_stream(session_id, message)` 的完整生命周期：

```
① 读三层记忆 + meta                ← Redis → 内存对象
② 惰性合并触发判定（空闲>4h 或新增>20 轮）
③ 追加本轮用户消息 HumanMessage
④ 组装 prompt（画像 + 摘要 + 历史 + 本轮）
⑤ llm.stream 流式调用 → 逐 chunk yield 给前端
⑥ 流结束：助手回复 AIMessage 追加进历史
⑦ 窗口压缩：超阈值 → 旧对话压成滚动摘要
⑧ 历史 + 摘要写回 Redis（L1 / L2）
⑨ 惰性合并：触发则提炼画像（L3）+ 重置 meta
```

代码骨架（`memory_chat_service.py`）：

```python
def memory_chat_stream(session_id: str, message: str):
    r = _get_redis()
    keys = _memory_keys(session_id)

    # ① 读三层记忆
    history = deserialize_history(r.get(keys['history'])) if r.get(keys['history']) else []
    summary = r.get(keys['summary']) or ""
    profile = json.loads(r.get(keys['profile'])) if r.get(keys['profile']) else []
    meta    = json.loads(r.get(keys['meta']))    if r.get(keys['meta'])    else None

    # ② 惰性合并判定
    now = time.time()
    turn_count = len(history) // 2          # 1 轮 = 用户 + 助手 2 条
    consolidate_pending = should_consolidate(meta, now, turn_count, idle_hours=4, consolidate_turns=20)

    # ③ 追加用户消息
    history.append(HumanMessage(content=message))

    # ④ 组装 prompt
    messages = _build_chat_prompt().format_messages(
        profile=_format_profile(profile),
        summary=summary or "（暂无）",
        history=history[-window_turns * 2:],   # 窗口内最后 20 条
        input=message,
    )

    # ⑤ 流式调用
    collected = ""
    for chunk in llm.stream(messages):
        content = chunk.content if isinstance(chunk.content, str) else ""
        if content:
            collected += content
            yield {"content": content}

    # ⑥ 助手回复进历史
    history.append(AIMessage(content=collected))

    # ⑦⑧ 窗口压缩 + 写回 Redis
    if should_compress(history, 20, 4000):
        old, recent = split_window(history, window_turns)
        if old:
            summary = _refresh_summary(llm, old, summary)
        history = recent
    r.set(keys['history'], serialize_history(history))

    # ⑨ 惰性合并（提炼画像）
    if consolidate_pending:
        new_profile = _consolidate_profile(llm, profile, history, max_items=20)
        ...
        meta = {"last_consolidate_at": now, "last_saved_turn": len(history) // 2}
        r.set(keys['meta'], json.dumps(meta))
```

***

## 5. L1 短期：对话窗口

- 保留最近 **10 轮**（`MEMORY_WINDOW_TURNS`），1 轮 = 用户 + 助手 2 条。
- 组装 prompt 时只取 `history[-20:]`，模型每次对话看到的是**最近的完整对话**。

```
history = [h1, h2, ..., h40, h41, ..., h60]
                          └────┬────┘
                        history[-20:]  ← 只发这 20 条给模型
```

窗口外的旧消息交给 L2 处理。

***

## 6. L2 中期：滚动摘要（窗口压缩）

### 触发条件（`should_compress`）

```
消息条数 > 20 条       （len(history) > MEMORY_TRIGGER_MESSAGES）
或 总 token 估算 > 4000  （sum(字符数//4) > MEMORY_TRIGGER_TOKENS）
```

### 执行过程

```
should_compress → True
        │
        ▼
split_window(history, 10)
   old    = 前 n-20 条（窗口外旧消息）
   recent = 最后 20 条（窗口内保留）
        │
        ▼
_refresh_summary(llm, old, old_summary)
   「旧摘要 + 窗口外对话」→ 模型生成新摘要（覆盖旧摘要，不追加）
        │
        ▼
history = recent（历史只留窗口）
```

**关键设计：重写而非追加。** 新摘要必须覆盖"旧摘要 + 新压缩的对话"，避免摘要无限膨胀，也解决时态过期（prompt 规则见 `app/prompts/memory.py` 的 `ROLLING_SUMMARY_PROMPT`）。

***

## 7. L3 长期：用户画像（惰性合并）

### 画像是什么

JSON 数组，每条 = 一句话事实：

```json
["用户睡眠不好，失眠约两周", "对牛奶过敏", "近期服用酸枣仁汤"]
```

上限 ≤20 条，每条 ≤100 字。注入 system prompt 的「用户画像」段。

### 为什么叫"惰性"（Lazy）

不是每轮都提炼画像（太费 token），而是**攒够条件才做**。触发判定（`should_consolidate`）：

```
首次对话（无 meta）           → 触发
距上次提炼超过 4 小时          → 触发
自上次提炼后新增超过 20 轮     → 触发
否则                          → 不触发
```

### 提炼过程（流结束后同步执行）

```
_profile_consolidate(profile, history)
        │
        ▼
PROFILE_EXTRACTION_PROMPT（既有画像 + 本轮对话）
        │
        ▼
模型输出严格 JSON：
{
  "add": ["新事实1"],
  "update": [{"before": "旧事实", "after": "新事实"}],
  "remove": ["过时事实"],
  "final_profile": ["重写后的完整条目列表"]
}
        │
        ▼
parse_consolidation_output() 容错解析（截取 { } 提取 JSON）
        │
        ▼
profile = final_profile → 写回 Redis → 重置 meta
```

**容错设计**：模型输出可能带 Markdown 代码块或多余文字，`parse_consolidation_output` 用 `text.find('{')` / `text.rfind('}')` 截取 JSON 段；解析失败返回空操作，沿用旧画像，不让一次坏输出清空记忆。

***

## 8. 序列化：消息对象 ⇄ JSON 字符串

Redis 只能存字符串，LangChain 消息是对象，所以需要一对转换函数：

```
存：serialize_history(对象列表) → JSON 字符串 → Redis
读：deserialize_history(JSON 字符串) → 对象列表
```

```python
# 存（只保留 type 和 content 两个字段）
def serialize_history(messages):
    return json.dumps(
        [{"type": m.type, "content": m.content} for m in messages],
        ensure_ascii=False,
    )

# 读（按 type 还原成对应对象）
def deserialize_history(raw):
    data = json.loads(raw)
    return [
        HumanMessage(content=m["content"]) if m["type"] == "human"
        else AIMessage(content=m["content"])
        for m in data
    ]
```

为什么只存两个字段？LangChain 对象内部字段很多，全存浪费空间；`type`（human/ai）+ `content` 足够还原对话。

***

## 9. Prompt 组装

`_build_chat_prompt()` 用 `ChatPromptTemplate` 组装（模板可复用，`format_messages` 填值）：

```
┌──────────────────────────────────────────────────┐
│ system：「你是一名资深的中医健康顾问...」          │
│        + 【用户画像】{profile}                     │  ← L3 注入
│        + 【会话摘要】{summary}                     │  ← L2 注入
│ MessagesPlaceholder("history")                    │  ← L1 展开成消息列表
│ human：{input}                                    │  ← 本轮问题
└──────────────────────────────────────────────────┘
```

填值后发给模型的是完整消息列表：

```
[SystemMessage(定位+画像+摘要), HumanMessage(历史1), AIMessage(历史2), ..., HumanMessage(本轮)]
```

***

## 10. 配置项

全部从 `.env` 读取、含默认值，集中在 `app/config/config.py` 的 `MEMORY_*` 前缀：

| 配置项 | 默认值 | 作用 |
|---|---|---|
| `MEMORY_MODEL` | `deepseek-v4-flash` | 记忆版模型（经 opencode 网关） |
| `MEMORY_REDIS_PREFIX` | `mem:session:` | 与老接口 `chat:session:` 隔离 |
| `MEMORY_WINDOW_TURNS` | `10` | L1 窗口轮数 |
| `MEMORY_TRIGGER_MESSAGES` | `20` | L2 摘要触发消息条数 |
| `MEMORY_TRIGGER_TOKENS` | `4000` | L2 摘要触发 token 阈值 |
| `MEMORY_CONSOLIDATE_IDLE_HOURS` | `4` | L3 惰性合并空闲阈值 |
| `MEMORY_CONSOLIDATE_TURNS` | `20` | L3 惰性合并新增轮数阈值 |
| `MEMORY_PROFILE_MAX_ITEMS` | `20` | 画像条目上限 |
| `MEMORY_HISTORY_TTL` | `604800` | L1 7 天 |
| `MEMORY_SUMMARY_TTL` | `604800` | L2 7 天 |

***

## 11. 验证

### 场景 1：多轮记忆保持

```
请求 1: POST /api/chat/memory  {"message": "我最近总是失眠"}
        → 首条 SSE 返回 session_id: "abc123"
请求 2: POST /api/chat/memory  {"message": "我叫什么？", "session_id": "abc123"}
        → 上轮没提名字，但历史里有 → AI 记得（取决于上轮是否提及）
请求 3: POST /api/chat/memory  {"message": "我刚才说了什么？", "session_id": "abc123"}
        → 从 Redis 三层记忆拼回上下文，AI 记得
```

### 场景 2：重启不丢

```
停止 Python 进程 → 启动 Python 进程
再请求 → 记忆仍在（数据在 Redis，不在进程内存）
```

### 场景 3：验证 4 个 key 结构

```bash
$ redis-cli
127.0.0.1:6379> keys "mem:session:*"
1) "mem:session:abc123:history"
2) "mem:session:abc123:summary"
3) "mem:session:abc123:profile"
4) "mem:session:abc123:meta"

127.0.0.1:6379> GET "mem:session:abc123:profile"
["用户睡眠不好，失眠约两周", "对牛奶过敏"]
```

***

## 12. 与老接口对比

| 维度 | `/api/chat/stream` | `/api/chat/memory` |
|---|---|---|
| 模型 | mimo-v2.5 | deepseek-v4-flash |
| 技术栈 | OpenAI SDK | LangChain（ChatPromptTemplate + ChatOpenAI） |
| 历史存储 | `chat:session:` 单层 | `mem:session:` 三层 |
| 窗口管理 | 无（无限增长） | 10 轮窗口 + 滚动摘要 |
| 用户画像 | 无 | GPT 式记忆条目（永久） |
| reasoning_content | 有 | 无（langchain-openai 1.4.1 限制，已接受） |

***

## 13. 小结

1. **三层记忆把"一份历史"拆成三层**——L1 对话窗口（最近 10 轮完整对话）+ L2 滚动摘要（窗口外浓缩）+ L3 用户画像（永久事实），各管一段生命周期
2. **L1 解决窗口溢出**——组装 prompt 时只取 `history[-20:]`，模型看到的永远是最近的完整对话，旧的交给 L2
3. **L2 重写而非追加**——新摘要由「旧摘要 + 窗口外对话」重新生成并覆盖，避免摘要无限膨胀，也解决时态过期
4. **L3 惰性合并省 token**——画像不每轮提炼，攒够条件才做：首次对话 / 空闲超 4 小时 / 新增超 20 轮
5. **4 个 Redis key 隔离并存**——`mem:session:{sid}:history/summary/profile/meta`，与老接口 `chat:session:` 互不影响，老接口零改动
6. **容错设计兜底**——模型输出解析失败时返回空操作、沿用旧画像，不让一次坏输出清空记忆
7. **序列化只存两字段**——LangChain 消息对象转 Redis 只留 `type`（human/ai）+ `content`，足够还原对话
