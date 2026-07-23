---
date: 2026-07-22
title: Chat API
tags:
  - AI
  - AI Agent
  - Flask
  - SSE
---

# Chat API：非流式与流式对话实现

## 1. 两种模式的核心区别

### 从用户感知看

```
非流式（POST /api/chat）：
  发请求 → 等待 2-3 秒 → 一次性看到全部回复
  就像：给对方发微信，等了一会儿收到一大段文字

流式（POST /api/chat/stream）：
  发请求 → AI "打字"出来，逐字显示
  就像：看对方现场打字，一个字一个字地出现
```

### 从实现机制看

```
非流式：
  客户端 → HTTP 请求 → 后端 → HTTP 调 MiMo（stream=False）
                                            ↓
                                      MiMo 算完所有 token
                                            ↓
  客户端 ← HTTP 响应 ← 后端 ← 一次性返回全部结果

流式：
  客户端 → HTTP 请求 → 后端 → HTTP 调 MiMo（stream=True）
                                            ↓
                                      MiMo 每算出一个 token 就返回
                                            ↓
               ← SSE chunk 1 ←  后端逐块转发
               ← SSE chunk 2 ←
               ← SSE chunk 3 ←
               ← [DONE]      ←  结束标记
```

### 共同点

```
两种模式共享同一套：
  - 请求参数格式（messages 数组）
  - System prompt（后端自动拼接）
  - Model（mimo-v2.5）
  - temperature / max_tokens（后端写死）
  - API Key / Base URL

区别只有一处：stream=True / stream=False
```

## 2. 非流式实现：请求→等待→响应

### 三层调用链路

```
Route（routes/chat.py）
  ↓ chat(messages)
Service（services/mimo_service.py）
  ↓ client.chat.completions.create(stream=False)
MiMo API
  ↓ 一次性返回
完整响应 JSON
```

### Route 层代码

```python
@chat_bp.route('/chat', methods=['POST'])
def chat():
    # 1. 取参数
    data = request.get_json(silent=True)
    messages = data.get('messages')

    # 2. 校验
    if not messages:
        return jsonify({"success": False, "error": {...}}), 400

    # 3. 调 Service（阻塞等待）
    result = mimo_service.chat(messages)

    # 4. 返回
    return jsonify({"success": True, "data": result})
```

关键点：`chat()` 函数内部是一个**同步阻塞调用**——调 MiMo API 之后线程挂起，等 MiMo 算完所有 token 后才继续往下走。

### Service 层代码

```python
def chat(messages):
    # 1. 拼接 system prompt
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *messages,
    ]

    # 2. 创建 Client
    client = OpenAI(api_key=..., base_url=...)

    # 3. 调 API（阻塞在这里，等全部结果）
    response = client.chat.completions.create(
        model='mimo-v2.5',
        messages=full_messages,
        stream=False,  # ← 非流式标记
    )

    # 4. 提取结果
    choice = response.choices[0]
    content = choice.message.content or ""
    reasoning_content = getattr(choice.message, 'reasoning_content', None) or ""

    return {"content": content, "reasoning_content": reasoning_content}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "content": "失眠在中医上称为'不寐'，多与心脾两虚有关...",
    "reasoning_content": "用户主诉失眠，需从心脾两虚角度辨证..."
  }
}
```

一次性、完整、不需要前端做额外处理。

## 3. 流式实现：请求→逐块推送→结束

### 三层调用链路

```
Route（routes/chat.py）
  ↓ chat_stream(messages) → 返回一个生成器
Service（services/mimo_service.py）
  ↓ client.chat.completions.create(stream=True) → 返回迭代器
MiMo API
  ↓ 每算出一个 token 就返回一个 chunk
chunk → chunk → chunk → ...
  ↓ 逐块 yield
Route 的 generate() → SSE 格式 → Response
```

### Route 层代码

```python
@chat_bp.route('/chat/stream', methods=['POST'])
def chat_stream():
    data = request.get_json(silent=True)
    messages = data.get('messages')

    if not messages:
        return jsonify({"success": False, "error": {...}}), 400

    # 生成器：逐块产出 SSE 格式字符串
    def generate():
        try:
            # Service 返回一个生成器，每次 yield 一个 dict
            for chunk in mimo_service.chat_stream(messages):
                # dict → SSE 格式
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            # 结束标记
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"流式失败: {e}")
            yield f"data: {json.dumps({'error': {...}})}\n\n"

    # 返回 SSE 响应
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream'
    )
```

### 关键区别：生成器

非流式用 `return` 返回一次结果，流式用 `yield`**多次返回**：

```python
# 非流式：一次返回
def chat():
    result = service.chat(messages)
    return jsonify({"success": True, "data": result})

# 流式：多次 yield
def chat_stream():
    def generate():
        for chunk in service.chat_stream(messages):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    return Response(generate(), mimetype='text/event-stream')
```

`return` 像坐电梯到顶楼直接出来。`yield` 像走楼梯，每层停下来看一眼再继续。

### Service 层代码

```python
def chat_stream(messages):
    full_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *messages,
    ]

    client = OpenAI(api_key=..., base_url=...)

    # stream=True → 返回一个迭代器
    response = client.chat.completions.create(
        model='mimo-v2.5',
        messages=full_messages,
        stream=True,  # ← 流式标记
    )

    # 逐块遍历
    for chunk in response:
        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta
        content = delta.content or ""
        reasoning_content = getattr(delta, 'reasoning_content', None) or ""

        yield {
            "content": content,
            "reasoning_content": reasoning_content,
        }
```

### 响应格式（SSE 流）

客户端收到的不是一次 JSON，而是一串 SSE 消息：

```
data: {"content": "", "reasoning_content": "用户主诉失眠，需从心脾两虚角度辨证论治"}
data: {"content": "失眠", "reasoning_content": ""}
data: {"content": "在", "reasoning_content": ""}
data: {"content": "中医", "reasoning_content": ""}
data: {"content": "上", "reasoning_content": ""}
data: {"content": "称为", "reasoning_content": ""}
data: {"content": "'不寐'", "reasoning_content": ""}
data: {"content": "，多与心脾两虚有关...", "reasoning_content": ""}
data: [DONE]
```

前端收到一条 `data: [DONE]` 就知道流结束了。

## 4. Service 层的差异

### 一字之差

```python
# 非流式
response = client.chat.completions.create(
    messages=full_messages,
    stream=False,  # ← 就差在这里
)

# 流式
response = client.chat.completions.create(
    messages=full_messages,
    stream=True,   # ← 就差在这里
)
```

`stream=False` 和 `stream=True` 是 OpenAI SDK 的一个参数。但就是这个参数，改变了整个响应的处理方式。

### response 的类型

```python
# stream=False → response 是一个完整的对象
response = client.chat.completions.create(stream=False)
type(response)  # <class 'openai.types.chat.ChatCompletion'>
# 可以直接 .choices[0].message.content 拿到全部内容

# stream=True → response 是一个迭代器
response = client.chat.completions.create(stream=True)
type(response)  # <class 'openai.Stream'>
# 只能用 for chunk in response: 逐块遍历
```

### 提取字段的方式

| 步骤            | 非流式                                         | 流式                                  |
| --------------- | ---------------------------------------------- | ------------------------------------- |
| 取内容          | `choice.message.content`                       | `delta.content`                       |
| 取思考过程      | `getattr(choice.message, 'reasoning_content')` | `getattr(delta, 'reasoning_content')` |
| 空 choices 判断 | 不需要（总是有）                               | 需要（流式结束可能返回空 choices）    |
| 返回方式        | `return` 一次                                  | `yield` 多次                          |

### 流式特有的空 choices 保护

```python
for chunk in response:
    if not chunk.choices:
        # ↑ 流式结束时，MiMo 可能发一个空 choices 的 chunk
        # 不加这个判断，chunk.choices[0] 会 IndexError
        continue
```

### 抽象层

相同的参数（model、messages、temperature）在两份代码里出现了重复。如果有需要，可以抽一个公共函数：

```python
def _build_args(messages):
    return {
        "model": current_app.config.get('OPENAI_MODEL', 'mimo-v2.5'),
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
        "max_completion_tokens": current_app.config.get('OPENAI_MAX_TOKENS', 4096),
        "temperature": 0.7,
    }
```

但当前只有两个调用点，**重复比抽象更简单**——不需要为了消除两行重复引入一个新函数。

## 5. SSE 协议：流式的传输载体

### 什么是 SSE

```
SSE = Server-Sent Events（服务器推送事件）

是 HTTP 协议的一部分，不是 WebSocket 那种新协议。
普通的 HTTP 响应是"请求→响应→关闭连接"。
SSE 的响应是"请求→响应→保持连接→持续推送→关闭连接"。
```

### SSE 的格式

```
data: 这是第一条消息\n\n
data: 这是第二条消息\n\n
data: 这是最后一条消息\n\n
data: [DONE]\n\n
```

每一条消息以 `data:` 开头，以两个换行符 `\n\n` 结束。

### 实现要点

```python
# 在 Flask 中返回 SSE 响应
return Response(
    stream_with_context(generate()),
    mimetype='text/event-stream'  # ← 告诉浏览器：这是 SSE
)
```

`mimetype='text/event-stream'` 是关键。浏览器（或 axios 等 HTTP 客户端）看到这个 Content-Type，就知道不要等待响应结束，而是**逐行读取**推送过来的数据。

### 为什么用 SSE 不用 WebSocket

```
问题：前后端实时通信，WebSocket 不是更常用吗？

回答：
  SSE：服务器 → 客户端（单向），基于 HTTP，简单
  WebSocket：双向通信，需要握手协议，复杂

  我们的场景：只需要 AI 回复推送给前端
             前端不需要往同一个连接里推数据
             所以 SSE 够用，不需要 WebSocket

  类比：
    SSE = 收音机（只收不发）
    WebSocket = 对讲机（能收能发）

  项目里用收音机就够了，不需要对讲机。
```

## 6. reasoning_content 的处理

### 这个字段是什么

`reasoning_content` 是 MiMo API 独有的字段，表示**模型的思考过程**。

```
一般的大模型 API 返回：
  { "content": "失眠在中医上称为'不寐'..." }

MiMo API 额外返回：
  {
    "content": "失眠在中医上称为'不寐'...",
    "reasoning_content": "用户主诉失眠，需要从心脾两虚角度辨证论治..."
  }
```

类比：一个学生在考试时写的**草稿**（reasoning_content）和**正式答案**（content）。

### 非流式怎么取

```python
choice = response.choices[0]

# content 是标准字段，直接取
content = choice.message.content or ""

# reasoning_content 是扩展字段，用 getattr 安全读取
reasoning_content = getattr(choice.message, 'reasoning_content', None) or ""
```

如果模型这次没有输出思考过程，`getattr` 返回 `None`，最终取值为空字符串。

### 流式怎么取

```python
for chunk in response:
    delta = chunk.choices[0].delta

    # content 可能为空（有的 chunk 只有 reasoning 没有 content）
    content = delta.content or ""
    # 同理，reasoning_content 可能为空
    reasoning_content = getattr(delta, 'reasoning_content', None) or ""
```

流式模式下，reasoning_content 和 content 是**交替出现**的：

```
chunk 1: reasoning_content="用户主诉失眠"  content=""
chunk 2: reasoning_content="需从心脾两虚"   content=""
chunk 3: reasoning_content="角度辨证论治"   content=""
chunk 4: reasoning_content=""              content="失眠"
chunk 5: reasoning_content=""              content="在中医"
chunk 6: reasoning_content=""              content="上称为'不寐'"
```

模型先"思考"（输出 reasoning_content），再"回答"（输出 content）。前端可以据此做不同展示——思考过程用灰色字体，回答用正常字体。

## 7. 错误处理差异

### 非流式的错误处理

```python
try:
    result = mimo_service.chat(messages)
    return jsonify({"success": True, "data": result})
except Exception as e:
    return jsonify({
        "success": False,
        "error": {
            "code": "MIMO_API_ERROR",
            "message": f"AI 服务调用失败: {type(e).__name__}",
        }
    }), 500
```

非流式的错误处理很简单——try/except 包住整个调用，出错了返回一个 JSON 错误。

### 流式的错误处理

```python
def generate():
    try:
        for chunk in mimo_service.chat_stream(messages):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        # 错误作为 SSE 消息推给前端
        error_chunk = json.dumps({
            "error": {"code": "MIMO_API_ERROR", "message": "..."}
        })
        yield f"data: {error_chunk}\n\n"
```

流式的特殊之处：**错误也走 SSE 通道**。

```
为什么不能像非流式那样 return JSON 错误？
  因为 Response 已经发出去了，
  mimetype='text/event-stream' 也设置好了，
  此时无法"切换"到一个普通 JSON 响应。

  只能继续用 SSE 格式把错误推给前端。
  前端通过判断 data.error 是否有值来区分是正常 chunk 还是错误。
```

### 前端处理的区别

```javascript
// 非流式
const res = await fetch('/api/chat', {...});
const data = await res.json();
if (!data.success) {
    showError(data.error.message);
    return;
}
render(data.data.content);

// 流式
const res = await fetch('/api/chat/stream', {...});
const reader = res.body.getReader();
// 逐行读取 SSE 数据
while (true) {
    const { done, value } = await reader.read();
    const text = new TextDecoder().decode(value);
    const lines = text.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
        const data = JSON.parse(line.slice(6)); // 去掉 'data: '
        if (data.error) {
            showError(data.error.message);
            return;
        }
        if (data === '[DONE]') return;
        render(data.content); // 逐字追加
    }
}
```

## 8. 完整代码对照

### 非流式 `POST /api/chat`

```python
# app/routes/chat.py
@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "请求体必须是一个 JSON 对象"}}), 400

    messages = data.get('messages')
    if not messages or not isinstance(messages, list):
        return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "缺少 messages 参数或格式错误"}}), 400

    try:
        result = mimo_service.chat(messages)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        logger.error(f"Chat 失败: {e}")
        return jsonify({"success": False, "error": {"code": "MIMO_API_ERROR", "message": "AI 服务调用失败"}}), 500
```

```python
# app/services/mimo_service.py
def chat(messages):
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]
    client = _get_client()
    config = current_app.config

    response = client.chat.completions.create(
        model=config.get('OPENAI_MODEL', 'mimo-v2.5'),
        messages=full_messages,
        max_completion_tokens=config.get('OPENAI_MAX_TOKENS', 4096),
        temperature=0.7,
        stream=False,
    )

    choice = response.choices[0]
    content = choice.message.content or ""
    reasoning_content = getattr(choice.message, 'reasoning_content', None) or ""

    return {"content": content, "reasoning_content": reasoning_content}
```

### 流式 `POST /api/chat/stream`

```python
# app/routes/chat.py
@chat_bp.route('/chat/stream', methods=['POST'])
def chat_stream():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "..."}}), 400

    messages = data.get('messages')
    if not messages or not isinstance(messages, list):
        return jsonify({"success": False, "error": {"code": "BAD_REQUEST", "message": "..."}}), 400

    def generate():
        try:
            for chunk in mimo_service.chat_stream(messages):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Chat 流式失败: {e}")
            yield f"data: {json.dumps({'error': {'code': 'MIMO_API_ERROR', 'message': '...'}})}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')
```

```python
# app/services/mimo_service.py
def chat_stream(messages):
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}, *messages]
    client = _get_client()
    config = current_app.config

    response = client.chat.completions.create(
        model=config.get('OPENAI_MODEL', 'mimo-v2.5'),
        messages=full_messages,
        max_completion_tokens=config.get('OPENAI_MAX_TOKENS', 4096),
        temperature=0.7,
        stream=True,
    )

    for chunk in response:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        content = delta.content or ""
        reasoning_content = getattr(delta, 'reasoning_content', None) or ""
        yield {"content": content, "reasoning_content": reasoning_content}
```

### 调用方视角看差异

| 层面         | 非流式                         | 流式                           |
| ------------ | ------------------------------ | ------------------------------ |
| Route 返回值 | `jsonify()` — 一次 JSON 响应   | `Response(generator)` — SSE 流 |
| Service 返回 | `return` — 一次性              | `yield` — 逐块产出             |
| 耗时         | 从请求到响应，连接一直保持挂起 | 立即响应，连接保持打开持续推送 |
| 用户等待时间 | ~3 秒（全程等待）              | ~0.3 秒（看到正在输出）        |
| 错误处理     | 直接返回 JSON 错误             | 错误作为 SSE 消息推送          |
| 前端展示     | 文字突然全部出现               | 文字逐字出现                   |

## 总结

把两种方式放在一起对比，核心就几件事：

1. **代码层面**，非流式和流式只差一个参数 `stream=True/False`，但整个数据流向完全不一样
2. **非流式**是传统的请求-响应模式，简单直接，适合对实时性要求不高的场景
3. **流式**基于生成器（yield）和 SSE 协议，让用户能即时看到 AI 输出，体验好但实现复杂一些
4. **reasoning_content** 是 MiMo 特有的思考过程字段，流式和非流式的取法不同——流式取的是 `delta`，非流式取的是 `message`
5. **错误处理**上，流式不能像非流式那样直接返回 JSON，错误信息只能走 SSE 通道推给前端

实际开发中，大多数 AI 应用都会选择流式，因为等待 3 秒才能看到回复的体验确实不太好。
