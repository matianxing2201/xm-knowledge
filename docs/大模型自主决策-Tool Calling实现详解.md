# 大模型自主决策：Tool Calling 实现详解

> 让大模型自己判断"什么时候需要搜索"，而不是在代码里写死。
> 这是 AI Agent 的核心能力之一。

***

## 目录

1. [什么是 Tool Calling](#1-什么是-tool-calling)
2. [整体流程](#2-整体流程)
3. [工具定义：tavily_search](#3-工具定义tavily_search)
4. [模型初始化 + 绑定工具](#4-模型初始化--绑定工具)
5. [核心流程：三个决策节点](#5-核心流程三个决策节点)
6. [完整代码](#6-完整代码)
7. [路由入口](#7-路由入口)
8. [SSE 事件对应关系](#8-sse-事件对应关系)
9. [从日志看决策过程](#9-从日志看决策过程)

***

## 1. 什么是 Tool Calling

传统写法：代码硬编码"每次先搜索再回答"。

```
用户提问 → 强制搜索 → 用搜索结果拼 prompt → 调模型 → 返回
                                                   ↑
                                             不管用不用得上都搜
```

Tool Calling：把工具（搜索）交给模型，让它自己判断。

```
用户提问 → 调模型（带上工具描述）
            ↓
      模型自主决策
      ├─ 需要搜 → 返回 tool_call → 后端执行搜索 → 结果送回模型 → 模型生成回答
      └─ 不需要 → 直接生成回答
```

**关键区别**：决策权从代码转移到了模型。

***

## 2. 整体流程

```
用户上传图片 + 文本
       │
       ▼
  构建 messages（SystemMessage + HumanMessage）
       │
       ▼
  llm_with_tools.invoke(messages)
       │
       ├─ 返回 tool_calls → 执行搜索 → 结果追加到历史
       │                          → llm_with_tools.stream() 生成最终回答
       │
       └─ 无 tool_calls → 直接 llm_with_tools.stream() 流式输出
                            │
                            ▼
                       客户端收到 SSE 流
```

***

## 3. 工具定义：tavily_search

用 LangChain 的 `@tool` 装饰器定义一个搜索工具。**工具的 docstring 会被模型看到**，影响它的决策。

```python
# app/services/analyze_service.py

@tool
def tavily_search(query: str) -> str:
    """搜索实时联网信息。当你需要最新资料、流行病动态、药材百科等信息时使用。"""
    if not tavily_key:
        return "搜索功能未配置（TAVILY_API_KEY 缺失）"
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)
        result = client.search(query=query, max_results=3)
        snippets = [
            f"- {r.get('title', '')}: {r.get('content', '')}"
            for r in result.get('results', [])
        ]
        return "\n".join(snippets) if snippets else "未找到相关结果"
    except Exception as e:
        logger.error(f"Tavily 搜索失败: {e}")
        return f"搜索出错: {e}"
```

| 要素 | 说明 |
|---|---|
| `@tool` | LangChain 装饰器，把函数变成可被 LLM 调用的工具 |
| `query: str` | 参数和类型会被 LangChain 自动提取成 JSON Schema 发给模型 |
| docstring | 模型的"使用说明书"——写得越清楚，模型决策越准确 |
| `tavily_search.invoke(args)` | 在代码中手动执行搜索（不是模型调，是后端代码调） |

***

## 4. 模型初始化 + 绑定工具

```python
# app/services/analyze_service.py

def _get_llm():
    """创建 LangChain ChatOpenAI 实例，指向 MiMo 官方 API"""
    config = current_app.config
    return ChatOpenAI(
        model=config.get('OPENAI_MODEL', 'mimo-v2.5'),
        api_key=config.get('MIMO_API_KEY', ''),
        base_url=config.get('MIMO_BASE_URL', 'https://api.xiaomimimo.com/v1'),
        timeout=config.get('OPENAI_TIMEOUT', 60),
        temperature=1.0,
        max_tokens=config.get('OPENAI_MAX_TOKENS', 4096),
    )

llm = _get_llm()
llm_with_tools = llm.bind_tools([tavily_search])
```

`bind_tools` 把工具的函数名、参数签名、docstring 自动转为 OpenAI tools 格式，拼到 API 请求里。模型据此知道有哪些工具可用、每个工具要传什么参数。

***

## 5. 核心流程：三个决策节点

### 决策点①：要不要搜？

```
llm_with_tools.invoke(messages)
            │
            ▼
    模型返回两种可能：
    ├─ response.tool_calls 非空 → 决定搜索
    └─ response.tool_calls 为空 → 决定直接回答
```

```python
response = llm_with_tools.invoke(messages)

if response.tool_calls:
    # → 模型决定搜索，进入决策点②
else:
    # → 模型决定直接回答，跳到决策点④
```

### 决策点②：搜什么？

模型自主生成搜索词，后端只负责执行。

```python
for tc in response.tool_calls:
    query = tc['args'].get('query', '')   # ← 模型自主生成的搜索词

    result = tavily_search.invoke(tc['args'])  # ← 后端执行搜索
```

```
用户说"搜索最近的健康新闻"

模型生成的搜索词：
  "最近的健康新闻"

→ 后端用这个词调 Tavily API
```

### 决策点④：最终回答（流式输出）

模型在两种情况下进入流式输出：
- 看完搜索结果后
- 或者一开始就决定不搜索

```python
for chunk in llm_with_tools.stream(messages):
    c = chunk.content or ""
    if c:
        yield {"type": "content", "content": c}
```

使用 `llm_with_tools.stream()` 而非 `llm.stream()`，确保模型能理解消息历史中的 `ToolMessage`。

***

## 6. 完整代码

```python
# app/services/analyze_service.py —— analyze() 函数

def analyze(image_base64: str, prompt: str = ""):
    config = current_app.config
    tavily_key = config.get('TAVILY_API_KEY', '')

    # 定义工具
    @tool
    def tavily_search(query: str) -> str:
        """搜索实时联网信息。当你需要最新资料、流行病动态、药材百科等信息时使用。"""
        if not tavily_key:
            return "搜索功能未配置（TAVILY_API_KEY 缺失）"
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=tavily_key)
            result = client.search(query=query, max_results=3)
            snippets = [
                f"- {r.get('title', '')}: {r.get('content', '')}"
                for r in result.get('results', [])
            ]
            return "\n".join(snippets) if snippets else "未找到相关结果"
        except Exception as e:
            logger.error(f"Tavily 搜索失败: {e}")
            return f"搜索出错: {e}"

    # 初始化模型 + 绑定工具
    llm = _get_llm()
    llm_with_tools = llm.bind_tools([tavily_search])

    # 构建消息（多模态：图片 base64 + 文本）
    messages = [
        SystemMessage(content=ANALYZE_PROMPT),
        HumanMessage(content=[
            {"type": "image_url", "image_url": {"url": image_base64}},
            {"type": "text", "text": prompt or "请分析我的舌苔"},
        ]),
    ]

    # ================================================================
    # 决策点①：模型自主决定「调工具」还是「直接回答」
    # ================================================================
    response = llm_with_tools.invoke(messages)

    if response.tool_calls:
        # ============================================================
        # 决策点②：模型决定调工具，并自主生成了搜索词
        # ============================================================
        for tc in response.tool_calls:
            query = tc['args'].get('query', '')
            yield {"type": "tool_call", "tool": "tavily_search", "query": query}

            result = tavily_search.invoke(tc['args'])
            yield {"type": "tool_result", "tool": "tavily_search", "content": result[:500]}

            # 将工具调用和结果追加到消息历史
            messages.append(AIMessage(content=response.content, tool_calls=[tc]))
            messages.append(ToolMessage(content=result, tool_call_id=tc['id']))

    # ================================================================
    # 决策点④：流式输出最终回答
    # ================================================================
    for chunk in llm_with_tools.stream(messages):
        c = chunk.content or ""
        if c:
            yield {"type": "content", "content": c}
```

***

## 7. 路由入口

```python
# app/routes/chat.py

@chat_bp.route('/chat/analyze', methods=['POST'])
def chat_analyze():
    """POST /api/chat/analyze — multipart/form-data 接收图片"""
    if 'image' not in request.files:
        return fail("BAD_REQUEST", "缺少 image 文件")

    file = request.files['image']
    prompt = request.form.get('prompt', '')

    # 图片 → base64
    image_base64 = file_to_base64(file.read())

    # 调用 Service，生成 SSE 流
    def generate():
        try:
            for event in analyze_agent(image_base64, prompt):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_event = {"type": "error", "content": f"分析失败: {type(e).__name__}"}
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')
```

***

## 8. SSE 事件对应关系

```
后端                                           前端
 │                                              │
 │  llm_with_tools.invoke(messages)             │
 │  ├─ 模型思考中（不可见，在模型内部）            │
 │  │                                            │
 │  ├─ 决策：要搜索                              │
 │  │    → yield type: tool_call                │ ← 前端看到"AI 正在搜索..."
 │  │                                            │
 │  ├─ 后端执行 Tavily 搜索                      │
 │  │    → yield type: tool_result              │ ← 前端看到搜索来源
 │  │                                            │
 │  └─ llm_with_tools.stream(messages)           │
 │       → yield type: content（逐 token）       │ ← 前端看到打字效果
 │                                            │
 └─ data: [DONE]
```

**注意**：LangChain 的 `ChatOpenAI` 无法透传 MiMo 的 `reasoning_content` 字段，所以没有 `type: reasoning` 事件。模型的思考过程会直接混在 `type: content` 的文本中（如"先思考一下……"）。

***

## 9. 从日志看决策过程

### 场景 1：需要搜索（用户要求最新信息）

```
# 用户请求：搜索最近的健康新闻

→ type: tool_call
    tool: "tavily_search"
    query: "最近的健康新闻"
    ← 模型自主决策：需要搜索，生成了搜索词

→ type: tool_result
    tool: "tavily_search"
    content: "2024年度卫生健康十大新闻发布..."
    ← 后端执行搜索，返回真实结果

→ type: content（逐 token）
    content: "根据搜索到的最新信息..."
    ← 模型生成最终回答

→ [DONE]
```

### 场景 2：不需要搜索（模型用自己的知识）

```
# 用户请求：分析这个图片

→ type: content（逐 token）
    content: "这是一张纯红色的图片，没有舌苔的特征..."
    ← 模型直接回答，没有 tool_call

→ [DONE]
```

***

## 文件清单

| 文件 | 作用 |
|---|---|
| `app/services/analyze_service.py` | 核心逻辑：Tool Calling + 流式输出 |
| `app/prompts/analyze.py` | system prompt，告诉模型什么时候该搜索 |
| `app/utils/image.py` | 图片格式检测 + base64 转换 |
| `app/routes/chat.py` | `POST /api/chat/analyze` 端点 |
| `app/config/config.py` | `MIMO_API_KEY` / `MIMO_BASE_URL` / `TAVILY_API_KEY` |
