---
date: 2026-07-30
title: 企业级助手 Agent RAG检索增强与三层记忆实现
tags:
  - AI
  - AI Agent
  - RAG
  - Milvus
  - Redis
---

# 企业级助手 Agent：RAG 检索增强 + 三层记忆

## 1. Agent 是什么：一条消息走完全程

### 从用户感知看

```
用户发一句："我感冒了，恶寒发热无汗，吃什么药"

普通聊天（/api/chat）：
  模型凭训练知识回答 → 可能记得不准确，也可能瞎编

企业级助手（/api/agent/chat）：
  ① 先从知识库里检索相关方剂/中药   ← RAG
  ② 结合用户的体质记忆             ← 三层记忆
  ③ 再让模型回答                    ← 有据可依
```

### 一条消息的完整旅程

```
POST /api/agent/chat
   │
   ▼
Route 层（routes/agent.py）      ← 只做：取参数、生成 session_id、转 SSE
   │  agent_chat_stream(session_id, message, category)
   ▼
Service 层（agent_chat_service.py）
   │
   ├─ ① 读三层记忆（Redis）      ← "这个用户是谁、说过什么"
   ├─ ② RAG 检索（Milvus）       ← "知识库里有什么相关"
   ├─ ③ 组装 prompt               ← 知识 + 记忆 + 系统提示
   ├─ ④ mimo-v2.5 流式调用        ← 逐 token 生成
   └─ ⑤ 流结束：保存消息 → 压缩 → 提炼画像
   │
   ▼
SSE 流逐 chunk 返回前端
```

## 2. 知识库底座：文件 → 向量 → Milvus

### 2.1 知识从哪来：一个文件是唯一真相源

所有知识存在一个文件里：`app/static/knowledge_base.md`（260 条：126 方剂 + 134 中药）。

```
## 方剂库
方剂名称：麻黄汤
中药组成：麻黄、桂枝、杏仁、炙甘草
功用：发汗解表，宣肺平喘
主治：外感风寒表实证...
## 中药库
中药名称：麻黄
中药性味：辛、微苦，温
...
```

### 2.2 解析器：文件 → 结构化记录

```python
# knowledge_service.py — parse_knowledge_file
def parse_knowledge_file(text: str) -> List[Dict[str, str]]:
    records = []
    current = None
    current_lines = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        # 情况 1：遇到"方剂名称：/中药名称：" → 新记录开始
        start_prefix = next((p for p in RECORD_START_PREFIXES if line.startswith(p)), None)
        if start_prefix is not None:
            if current is not None:  # 收尾上一条
                current["content"] = "\n".join(current_lines)
                records.append(current)
            name = line[len(start_prefix):].strip()
            category = _CATEGORY_BY_PREFIX[start_prefix]
            current = {"id": _make_id(category, name), "category": category,
                       "name": name, "content": "", "source": ""}
            current_lines = [line]
            continue
        # 情况 2：已知字段行 → 追加到当前记录
        if current is not None and line.startswith(FIELD_PREFIXES):
            current_lines.append(line)
            continue
        # 情况 3：无关行（章节标题）→ 跳过
        continue
    ...
```

**关键节点**：
- `RECORD_START_PREFIXES = ("方剂名称：", "中药名称：")` —— 看到这两行就是一条新记录
- `FIELD_PREFIXES` —— 已知字段（功用/主治/性味…），追加进 content
- 其他行（"第一单元 解表剂"）—— 跳过

**输出**（每条记录长这样）：

```python
{
    "id": "a44a6573-c4b2-57fb-9a40-7e159c82d9c0",   # 确定性 UUID5
    "category": "方剂",
    "name": "麻黄汤",
    "content": "方剂名称：麻黄汤\n中药组成：麻黄...",   # 完整记录，不拆字段
    "source": "",
}
```

### 2.3 确定性 id：为什么用 uuid5 不用 uuid4

```python
# knowledge_service.py — _make_id
_ID_NAMESPACE = uuid.UUID('5c7d4e8a-1b2f-4c3d-9e8a-0f1e2d3c4b5a')  # 固定盐值

def _make_id(category: str, name: str) -> str:
    return str(uuid.uuid5(_ID_NAMESPACE, f"{category}:{name}"))
```

```
uuid5(固定盐值, "方剂:麻黄汤")  → 'a44a6573-...'   # 永远是这个
uuid5(固定盐值, "中药:麻黄")    → 'd8f2...'        # 名称变，id 变

对比 uuid4：每次随机 → 全量重建后同一条记录 id 全变
```

**为什么固定命名空间**：任何环境、任何时间，同一条记录算出的 id 都一样 → 全量重建幂等、单条 CRUD 引用稳定。类比：**uuid5 = 名字的哈希，uuid4 = 随机身份证号**。

### 2.4 建集合：Milvus 的 Schema

```python
# knowledge_service.py — ensure_collection
schema = CollectionSchema(
    fields=[
        FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=128, is_primary=True),
        FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=16),   # "方剂"/"中药"
        FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=64),
        FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=2048),  # 完整记录
        FieldSchema(name="source", dtype=DataType.VARCHAR, max_length=128),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dim),      # 1024 维
    ],
    ...
)
index_params = IndexParams()
index_params.add_index(field_name="vector", index_type="HNSW",
                       metric_type="COSINE", M=16, efConstruction=200)
client.create_collection(...)
client.load_collection(...)   # ← 不 load 不能搜
```

**关键字段**：
- `id` 主键 —— 系统自动建索引，不用手动建
- `vector` 1024 维 —— 必须显式建 HNSW 索引，否则搜索慢
- `category` —— 单库 + 分类过滤的关键（一个集合装两种知识）

### 2.5 向量化 + 入库：文本 → 数字 → Milvus

```python
# knowledge_service.py — upsert_records
vectors = embed_texts([r["content"] for r in records])   # ① 提取所有 content → 向量

data = [                                                   # ② 记录 + 向量 配对
    {"id": r["id"], "category": r["category"], "content": r["content"], "vector": vec}
    for r, vec in zip(records, vectors)                    # zip 拉链式配对
]

client.upsert(collection_name=collection, data=data)
client.flush(collection_name=collection)                   # ← 不 flush 搜不到
```

**embed_texts 内部**：

```python
def embed_texts(texts):
    batch_size = 64                                        # ← 智谱单次 ≤64 条
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        resp = client.embeddings.create(model='embedding-3', input=batch, dimensions=1024)
        results.extend(item.embedding for item in resp.data)
    return results
```

```
["content1", "content2", ..., "content260"]   ← 260 个文本
        ↓ 智谱 embedding-3（每批 64 条，5 批）
[[0.12, -0.45, ...], [0.87, 0.03, ...], ...]   ← 260 个 1024 维向量
```

## 3. RAG 检索：用户问题怎么找到知识

### 3.1 检索流程（agent_chat_service.py 的 _retrieve_knowledge）

```python
def _retrieve_knowledge(query_text: str, category: str = None) -> List[dict]:
    config = current_app.config
    try:
        hits = knowledge_service.search_records(
            query_text,
            top_k=config.get('RAG_TOP_K', 3),      # top-3
            category=category,                       # 可选过滤，默认不过滤
        )
    except Exception as e:                           # 故障降级（Ticket 06）
        logger.warning(f"RAG 检索降级...: {e}")
        return []                                    # 返回空 → 纯 LLM 回答

    min_score = config.get('RAG_MIN_SCORE', 0.3)     # 相似度阈值
    relevant = [h for h in hits if h['distance'] >= min_score]  # 低分不注入
    return relevant
```

### 3.2 search_records 内部（knowledge_service.py）

```python
def search_records(query_text, top_k=3, category=None):
    query_vector = embed_texts([query_text])[0]      # ① 用户问题 → 向量
    filter_expr = f'category == "{category}"' if category else None  # ② 可选过滤

    results = client.search(
        collection_name=collection,
        data=[query_vector],
        limit=top_k,
        filter=filter_expr,
        output_fields=["id", "category", "name", "content"],
        search_params={"metric_type": "COSINE", "params": {}},
    )
    hits = [{"name": h["entity"]["name"], "content": h["entity"]["content"],
             "distance": h["distance"]} for h in results[0]]
    return hits
```

**核心思想**：用户问题 `"我感冒了"` 先被 embedding 成向量，然后在 Milvus 里找**语义最接近**的 3 条记录（按余弦相似度排序）。

```
"我感冒了恶寒发热无汗"  → 向量
        ↓ Milvus 余弦检索
[中药] 细辛   0.5322   ← 相关
[中药] 麻黄   0.5313
[中药] 桂枝   0.5309
```

**为什么"默认不过滤"**：中医问题开放性高，问"感冒"应同时命中方剂库和中药库——语义相关度自然排序，不强制按 category 切。

### 3.3 相似度阈值：防噪音

```
阈值 0.3（RAG_MIN_SCORE）：
  distance >= 0.3 → 注入 prompt（相关知识）
  distance <  0.3 → 丢弃（无关，注入反而误导模型）

极端情况：全部 < 0.3 → 知识块显示"（当前知识库无相关内容）" → 纯 LLM 回答
```

## 4. 三层记忆：Agent 怎么记住用户

### 4.1 三层结构一览

| 层 | 存什么 | Redis key | TTL |
|---|---|---|---|
| L1 短期窗口 | 最近 10 轮原始消息 | `agent:session:{id}:history` | 7 天 |
| L2 长期摘要 | 窗口外对话的滚动压缩 | `agent:session:{id}:summary` | 7 天 |
| L3 用户画像 | 提炼的关键事实（≤20 条） | `agent:session:{id}:profile` | **永久** |

```
前缀隔离：agent:session:（本模块） vs mem:session:（chat/memory） vs chat:session:（老接口）
```

### 4.2 读记忆（agent_chat_stream 步骤 1）

```python
r = _get_redis()
keys = _agent_memory_keys(session_id)

history_raw = r.get(keys['history'])
history = _deserialize_history(history_raw) if history_raw else []   # 窗口
summary = r.get(keys['summary']) or ""                                # 摘要
profile_raw = r.get(keys['profile'])
profile = json.loads(profile_raw) if profile_raw else []              # 画像
meta_raw = r.get(keys['meta'])
meta = json.loads(meta_raw) if meta_raw else None                     # 合并记录
```

**序列化**：history 存成 JSON 字符串（只存 role + content，省空间）。

```python
def _serialize_history(messages):
    return json.dumps(
        [{"role": m["role"], "content": m["content"]} for m in messages],
        ensure_ascii=False,
    )
```

### 4.3 窗口压缩（L2）—— 超阈值就压成摘要

**触发判定**：

```python
def _should_compress_window(messages, trigger_messages, trigger_tokens):
    if len(messages) > trigger_messages:   # 消息 > 20 条
        return True
    total = sum(_estimate_tokens(m.get('content', '')) for m in messages)
    return total > trigger_tokens           # 或 token > 4000
```

**窗口划分**：

```python
def _split_window(messages, window_turns):
    window = window_turns * 2          # 1 轮 = 用户 + 助手 = 2 条
    if len(messages) <= window:
        return [], messages            # 没超窗口 → 全保留
    return messages[:-window], messages[-window:]   # 前边旧 → 摘要，后 10 轮保留
```

**执行压缩**（agent_chat_stream 步骤 6）：

```python
if _should_compress_window(history, 20, 4000):
    old, recent = _split_window(history, window_turns)
    if old:
        summary = _refresh_summary(old, summary)   # 旧消息 → LLM 压成摘要
        compressed = True
    history = recent
```

**类比**：窗口 = 桌上能放的便签数。放不下了，就把旧便签的内容"总结成一行"贴墙上（摘要），桌面只留最近的。

### 4.4 惰性合并（L3）—— 画像提炼

**触发判定**：

```python
def _should_consolidate(meta, now, turn_count, idle_hours, consolidate_turns):
    if not meta:                                  # 首次对话
        return True
    if now - last_at > idle_hours * 3600:          # 空闲 > 4 小时
        return True
    return (turn_count - last_turn) > consolidate_turns   # 新增 > 20 轮
```

**提炼**（模型自主 add/update/remove 重写）：

```python
def _consolidate_profile(profile, conversation, max_items):
    resp = _llm_invoke(PROFILE_EXTRACTION_PROMPT, user_prompt, temperature=0.0)
    result = _parse_consolidation(resp)
    if result["final_profile"] is None:
        return None                                # 提炼失败 → 沿用旧画像
    return result["final_profile"][:max_items]     # 截断 ≤20 条
```

模型输出：

```json
{
  "add": ["用户怕冷，手脚冰凉"],
  "update": [{"before": "7月要去新加坡", "after": "已去过新加坡"}],
  "remove": [],
  "final_profile": ["用户叫李明，35岁", "怕冷，阳虚体质倾向", "..."]
}
```

**为什么重写而非追加**：解决时态过期——"7月要去新加坡"应更新为"已去过"，而不是两条都留着。

### 4.5 关键决策：为什么不复用 memory_chat_service

```
memory_chat_service：用 langchain（BaseMessage + ChatOpenAI）
agent_chat_service：  用原生 openai SDK（dict + mimo-v2.5）

两者不能直接混用（类型不同），所以：
  - 复用的：三层记忆结构、提炼 prompt（prompts/memory.py）、纯逻辑思路
  - 自写的：dict 版本的判定函数 + 序列化 + 提炼调用
```

## 5. prompt 组装：知识 + 记忆如何注入

### 组装顺序（agent_chat_stream 步骤 3）

```python
context = _format_knowledge_context(knowledge)      # RAG 结果 → 文本块
profile_text = "\n".join(f"- {item}" for item in profile) if profile else "（暂无）"
window_history = history[-window_turns * 2:]        # 最近 10 轮

system_prompt = (
    AGENT_SYSTEM_PROMPT                              # ① 系统提示（中医助手定位）
    + "\n\n【知识库参考】\n" + context               # ② RAG 检索结果
    + "\n\n【用户画像】\n" + profile_text            # ③ 画像（这个用户是谁）
    + "\n\n【会话摘要】\n" + (summary or "（暂无）")  # ④ 滚动摘要
)

messages = [{"role": "system", "content": system_prompt}]          # system
messages.extend({"role": m["role"], "content": m["content"]}        # 窗口历史
                for m in window_history if m["role"] in ("user", "assistant"))
messages.append({"role": "user", "content": message})              # 当前输入
```

### 知识库参考的格式（_format_knowledge_context）

```python
def _format_knowledge_context(knowledge):
    if not knowledge:
        return "（当前知识库无相关内容）"     # 降级/无关时
    blocks = []
    for item in knowledge:
        source = f"[来源：{item['name']}（{item['category']}）]"
        blocks.append(f"{source}\n{item['content']}")
    return "\n---\n".join(blocks)              # 每条用 --- 分隔
```

最终给模型的 system：

```
你是一名资深的中医知识库问答助手...
【知识库参考】
[来源：麻黄汤（方剂）]
方剂名称：麻黄汤
中药组成：麻黄、桂枝...
---
[来源：桂枝汤（方剂）]
...
【用户画像】
- 用户叫李明，35岁
- 怕冷，阳虚体质倾向
【会话摘要】
（暂无）
```

**类比**：系统提示 = 岗位说明书；知识库参考 = 参考资料夹；用户画像 = 客户档案；摘要 = 上次会议纪要。模型看到全部，才能"有据可依 + 记得用户"地回答。

## 6. 降级策略：挂了也不崩

### 6.1 低分过滤（防噪音）

```python
min_score = config.get('RAG_MIN_SCORE', 0.3)
relevant = [h for h in hits if h['distance'] >= min_score]
```

### 6.2 故障降级（防崩）

```python
try:
    hits = knowledge_service.search_records(...)
except Exception as e:
    logger.warning(f"RAG 检索降级...: {e}")
    return []          # ← 关键：返回空列表，不当错误抛出
```

**降级后的行为**：

```
Milvus 挂了 / embedding 超时
        ↓
_retrieve_knowledge 返回 []          ← 不是抛异常
        ↓
知识块显示"（当前知识库无相关内容）"  ← 注入 prompt 前
        ↓
模型凭训练知识 + 记忆回答             ← SSE 正常输出，用户无感
```

**原则**：知识检索是**增强项**，不是生存依赖。答得一般，但不崩。

## 7. CRUD API：运维怎么管知识库

### 7.1 六个端点（routes/knowledge.py）

```
POST   /api/knowledge/import        全量重建（清空→解析→向量化→入库）
GET    /api/knowledge/items         分页查询（category 可选）
POST   /api/knowledge/items         单条新增
GET    /api/knowledge/items/:id     单条查询
PUT    /api/knowledge/items/:id     单条更新（重新向量化）
DELETE /api/knowledge/items/:id     单条删除（幂等）
```

### 7.2 Route 层的"薄"（只看一个端点就懂全部）

```python
# routes/knowledge.py — create_item
@knowledge_bp.route('/items', methods=['POST'])
def create_item():
    data = request.get_json(silent=True)
    if not data:
        return fail("BAD_REQUEST", "请求体必须是一个 JSON 对象")

    req = KnowledgeItemRequest(**data)              # ① Pydantic 校验
    record = knowledge_service.create_record(req.model_dump())   # ② 调 Service
    return ok(record)                                # ③ 返回
```

**Route 只做三件事**：URL / 取参 / 调 Service。没有业务逻辑。

### 7.3 Pydantic 校验（schemas.py）

```python
class KnowledgeItemRequest(BaseModel):
    category: str                        # 必填
    name: str                            # 必填
    content: str                         # 必填
    source: str | None = None            # 可选

    @field_validator('category')
    def check_category(cls, v):
        if v not in ("方剂", "中药"):     # 白名单校验
            raise ValueError('category 只能是 方剂 或 中药')
        return v
```

```
请求 {"category": "西药"} → 校验失败 → 抛 ValidationError → 全局处理器 → 422
请求 {"category": "方剂"} → 校验通过 → req（Pydantic 模型）→ model_dump() → dict → Service
```

### 7.4 单条新增的 Service 实现（knowledge_service.py）

```python
def create_record(record: Dict[str, str]) -> Dict[str, str]:
    category, name, content = record["category"], record["name"], record["content"]
    new_id = _make_id(category, name)                       # 确定性 UUID5
    full_record = {
        "id": new_id, "category": category, "name": name,
        "content": content,
        "source": record.get("source") or "手动添加",       # ⚠️ or 兜底
    }
    upsert_records([full_record])                           # 幂等：同 id 覆盖
    return full_record
```

**幂等语义**：同 (category, name) 重复新增 → 同 id → upsert 覆盖，不会堆积。

## 8. 完整代码对照：agent_chat_stream 全程

这是整个 Agent 的心脏。对照 `app/services/agent_chat_service.py` 完整阅读效果最好。

```python
def agent_chat_stream(session_id: str, message: str, category: str = None):
    config = current_app.config
    r = _get_redis()
    keys = _agent_memory_keys(session_id)

    # ── 步骤 1：读三层记忆 ──
    history_raw = r.get(keys['history'])
    history = _deserialize_history(history_raw) if history_raw else []
    summary = r.get(keys['summary']) or ""
    profile_raw = r.get(keys['profile'])
    profile = json.loads(profile_raw) if profile_raw else []
    meta_raw = r.get(keys['meta'])
    meta = json.loads(meta_raw) if meta_raw else None

    now = time.time()
    turn_count = len(history) // 2
    consolidate_pending = _should_consolidate(meta, now, turn_count, 4, 20)

    history.append({"role": "user", "content": message})

    # ── 步骤 2：RAG 检索 ──
    knowledge = _retrieve_knowledge(message, category)

    # ── 步骤 3：组装 prompt（知识→画像→摘要→窗口→输入）──
    context = _format_knowledge_context(knowledge)
    profile_text = "\n".join(f"- {item}" for item in profile) if profile else "（暂无）"
    window_history = history[-10 * 2:]

    system_prompt = (
        AGENT_SYSTEM_PROMPT
        + "\n\n【知识库参考】\n" + context
        + "\n\n【用户画像】\n" + profile_text
        + "\n\n【会话摘要】\n" + (summary or "（暂无）")
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend({"role": m["role"], "content": m["content"]}
                    for m in window_history if m["role"] in ("user", "assistant"))
    messages.append({"role": "user", "content": message})

    # ── 步骤 4：mimo-v2.5 流式调用 ──
    client = _get_llm_client()
    response = client.chat.completions.create(
        model=config.get('OPENAI_MODEL', 'mimo-v2.5'),
        messages=messages,
        max_completion_tokens=config.get('OPENAI_MAX_TOKENS', 4096),
        temperature=0.7,
        stream=True,
    )

    # ── 步骤 5：逐 chunk yield（SSE 载体）──
    collected = ""
    for chunk in response:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        content = delta.content or ""
        reasoning_content = getattr(delta, 'reasoning_content', None) or ""
        collected += content
        yield {"content": content, "reasoning_content": reasoning_content}

    # ── 步骤 6：保存 + 窗口压缩（L2）──
    history.append({"role": "assistant", "content": collected})
    compressed = False
    if _should_compress_window(history, 20, 4000):
        old, recent = _split_window(history, 10)
        if old:
            summary = _refresh_summary(old, summary)
            compressed = True
        history = recent
    r.set(keys['history'], _serialize_history(history))
    r.expire(keys['history'], 604800)
    if compressed:
        r.set(keys['summary'], summary)
        r.expire(keys['summary'], 604800)

    # ── 步骤 7：惰性合并（L3）──
    if consolidate_pending:
        new_profile = _consolidate_profile(profile, history, 20)
        if new_profile is not None:
            profile = new_profile
            r.set(keys['profile'], json.dumps(profile, ensure_ascii=False))
        meta = {"last_consolidate_at": now, "last_saved_turn": len(history) // 2}
        r.set(keys['meta'], json.dumps(meta))
        r.expire(keys['meta'], 604800)

    logger.info(f"Agent 对话完成 | 回复 {len(collected)} 字 | 知识 {len(knowledge)} 条 | "
                f"压缩: {compressed} | 画像: {len(profile)} 条")
```

### 每一步对应什么

| 步骤 | 干什么 | 关键点 |
|---|---|---|
| 1 读记忆 | Redis 取三层 + meta | 无则默认空 |
| 2 检索 | 知识库 top-3 | 故障→空列表（降级） |
| 3 组装 | 知识→画像→摘要→窗口→输入 | 顺序有讲究 |
| 4 流式 | mimo-v2.5 stream=True | 与 chat 接口同款 |
| 5 yield | 逐 token 输出 | 空 choices 保护 |
| 6 压缩 | 超阈值压摘要 | 写 Redis 后落盘 |
| 7 合并 | 触发时提炼画像 | 失败沿用旧画像 |

### Route 层的 SSE 包装（routes/agent.py）

```python
@agent_bp.route('/chat', methods=['POST'])
def agent_chat():
    data = request.get_json(silent=True)
    if not data:
        return fail("BAD_REQUEST", "请求体必须是一个 JSON 对象")

    req = AgentChatRequest(**data)
    session_id = req.session_id or uuid.uuid4().hex      # session_id 可选

    def generate():
        first_chunk = True
        try:
            for chunk in agent_chat_stream(session_id, req.message, req.category):
                if first_chunk:                          # 首个 chunk 带 session_id
                    chunk["session_id"] = session_id
                    first_chunk = False
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': {...}})}\n\n"   # 错误走 SSE

    return Response(stream_with_context(generate()), mimetype='text/event-stream')
```

## 9. 踩坑记录

### Milvus 写异步 + 不自动 load（最容易忽视）

```python
# upsert 后数据不可见
client.upsert(...)           # 写入
client.search(...)           # 结果为空！！  ← row_count 还是 0
client.flush(...)            # 强制落盘后才行

# 集合不自动加载
client.create_collection(...)  # 创建
client.search(...)             # 报 "collection not loaded" (code 101)
client.load_collection(...)    # 显式加载后才能搜
```

**排查方法**：写入后查 `get_collection_stats()`，row_count=0 → 忘了 flush。

### Pydantic None 键（最隐蔽）

```python
record.get("source", "手动添加")   # ❌ 当 source 键存在但值为 None 时返回 None！
record.get("source") or "手动添加"  # ✅ or 兜底

# 背景：Pydantic model_dump() 会把未提供的可选字段输出为 None 键
# 而 Milvus VARCHAR 字段不接受 None → 报 code 1100
```

### pymilvus 3.x API 变化

```python
from pymilvus import IndexParams            # ❌ ImportError（不在顶层）
from pymilvus.milvus_client.index import IndexParams   # ✅ 正确路径

# 且 add_index 签名变了：命名参数而非 params 字典
index_params.add_index(field_name="vector", index_type="HNSW",
                       metric_type="COSINE", M=16, efConstruction=200)
```

### 智谱单次 ≤64 条

```python
# 一次传 260 条 → 400 错误（code 1214: input数组最大不得超过64条）
for i in range(0, len(texts), 64):    # 分批
    batch = texts[i:i + 64]
```

### count 聚合语法

```python
client.query(..., output_fields=["count(*) as total"])  # ❌ code 65535
client.query(..., output_fields=["count(*)"])           # ✅ 无 alias
```

## 10. 总结

这篇把前面几篇讲的 Chat API、三层记忆、知识库设计全部串到了一起，落到了一个完整的 Agent 实现里。几个关键点：

1. **RAG 的本质**是"参考资料夹"——用户问题 → 向量 → Milvus 语义检索 top-3 → 注入 prompt，不是模型的记忆
2. **三层记忆各有分工**：窗口管最近对话，摘要压扁旧对话，画像存永久关键事实。只有画像不过期
3. **幂等是设计主线**：文件即真相源 + UUID5 确定性 + upsert 覆盖，任何时刻重建结果一致
4. **降级哲学**：知识是增强项不是生存依赖——检索挂了返回空列表，模型照常答
5. **模型选了 mimo-v2.5 用原生 SDK**而不是 langchain，是为了拿到 reasoning_content
6. **踩的坑都是跑出来的**：Milvus 异步、智谱限流、Pydantic None 键，都是"文档不说、一跑就炸"
