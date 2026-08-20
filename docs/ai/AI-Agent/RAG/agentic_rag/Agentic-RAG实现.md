---
date: 2026-08-20
title: Agentic RAG 实现
tags:
  - AI
  - AI Agent
  - RAG
  - LangChain
  - Milvus
  - Tavily
---

# Agentic RAG 实现

前两篇（Naive / Hybrid）的检索流程是固定的「先检索再生成」管线。Agentic RAG 换了个思路：把「检索」本身封装成工具，交给 LLM 自主决策——要不要查本地、要不要联网、查几次（子查询），直到信息足够再回答。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/agentic_rag)

## 目录结构

```
agentic_rag/
├── controllers.py      # 路由，就一个接口
├── services.py         # 编排：跑 Agent 循环，返回 trace/sources/answer
├── tools.py            # @tool 工具对象：本地检索 + 联网搜索
├── prompts.py          # 系统提示词，规定工具使用工作流
└── __init__.py         # 导入即注册路由
```

## 和 Naive / Hybrid 的区别

|        | Naive / Hybrid RAG      | Agentic RAG                            |
| ------ | ----------------------- | -------------------------------------- |
| 检索   | 固定管线「检索 → 生成」 | 检索封装成工具，LLM 自主决定是否调用   |
| 决策   | 代码写死怎么检索        | LLM 决定调哪个工具、传什么参数、调几次 |
| 数据源 | 只查本地知识库          | 本地知识库 + 联网搜索（Tavily）        |
| 返回   | 流式 SSE                | 一次性 JSON（含决策过程 trace）        |
| 依赖   | Milvus / +BM25          | LangChain Agent + Milvus + Tavily      |

核心变化：检索从「代码逻辑」变成「LLM 可调用的工具」，多轮 ReAct 循环由 LangChain Agent 框架管理。

## 工具层：tools.py

用 `@tool` 装饰器定义工具，函数签名 + docstring 会自动生成工具 schema（名称/描述/参数），Agent 据此让 LLM 自主决定如何调用。

```python
@tool("search_local_tool")
def search_local(query: str) -> str:
    """搜索本地中医病历知识库,检索与给定症状描述相似的病历记录。返回 JSON 数组字符串。"""
    scheme = current_app.config["RAG_SCHEMES"]["agentic_rag"]
    top_k = scheme["TOP_K"]

    query_vector = kb_services.embed_text(query)
    store = MilvusStore(scheme["COLLECTION_NAME"])
    store.ensure_collection()

    results = store.client.search(
        collection_name=store.collection_name,
        data=[query_vector],
        limit=top_k,
        output_fields=["text"],
    )
    docs = [
        {"text": r["entity"]["text"], "score": r["distance"]}
        for r in results[0]
    ]
    return json.dumps(docs, ensure_ascii=False)


@tool("search_online_tool")
def search_online(query: str) -> str:
    """联网搜索相关知识,获取本地知识库之外的最新信息。返回 JSON 数组字符串。"""
    from tavily import TavilyClient

    client = TavilyClient(api_key=current_app.config["TAVILY_API_KEY"])
    resp = client.search(query=query, search_depth="advanced", max_results=5)
    return json.dumps(resp.get("results", []), ensure_ascii=False)
```

两个工具都返回 JSON 字符串，LLM 能直接读懂工具执行结果，再决定下一步。

## 系统提示词：prompts.py

提示词规定了工具使用的工作流，让 LLM 明确：先查本地、不够再联网、最后综合诊断。

```python
SYSTEM_PROMPT = """你是一个中医医师。你需要根据患者的症状描述，结合本地中医病历记录与联网搜索到的中医知识做出中医诊断。

请遵循以下工作流程：
1. 先调用 search_local_tool 检索本地病历库，寻找相似病例；
2. 若本地信息不足，再调用 search_online_tool 联网搜索补充；
3. 综合所有信息给出诊断，并说明诊断依据。

不要编造信息。工具返回的是检索结果，回答必须基于它们。
"""
```

## 编排层：services.py

用 `create_agent` 组装 LLM + 工具，`agent.invoke()` 一次跑完整个 ReAct 循环，然后遍历消息列表，把「决策 → 观察」过程映射成返回结构。

```python
def answer_question(user_input: str) -> dict:
    """Agent 跑完整个 ReAct 循环,返回 {trace, sources, answer}。"""
    scheme = current_app.config["RAG_SCHEMES"]["agentic_rag"]
    agent = create_agent(
        _llm(),
        [tools.search_local, tools.search_online],
        system_prompt=prompts.SYSTEM_PROMPT,
    )
    # 每次 ReAct 迭代 = model 节点 + tools 节点两步,再加 2 步余量
    recursion_limit = scheme["MAX_ITERATIONS"] * 2 + 2

    trace_events: list[dict] = []
    local_docs: list[dict] = []
    final_content = ""
    try:
        state = agent.invoke(
            {"messages": [{"role": "user", "content": user_input}]},
            config={"recursion_limit": recursion_limit},
        )
        for message in state["messages"]:
            if isinstance(message, AIMessage) and message.tool_calls:
                # 决策:LLM 决定调用工具(可能一次多个)
                for call in message.tool_calls:
                    trace_events.append({
                        "phase": "decide",
                        "tool": call["name"],
                        "args": call.get("args", {}),
                        "message": f"决定调用 {call['name']},参数 {call.get('args', {})}",
                    })
            elif isinstance(message, ToolMessage):
                # 观察:工具执行结果
                summary = str(message.content)[:100]
                trace_events.append({
                    "phase": "observe",
                    "tool": message.name,
                    "message": f"{message.name} 返回:{summary}",
                })
                if message.name == "search_local_tool" and isinstance(message.content, str):
                    try:
                        local_docs.extend(json.loads(message.content))
                    except (json.JSONDecodeError, TypeError):
                        pass
            elif isinstance(message, AIMessage):
                # 无工具调用的 AI 消息 = 最终答案(最后一条覆盖)
                if isinstance(message.content, str):
                    final_content = message.content
    except GraphRecursionError:
        trace_events.append({
            "phase": "limit",
            "message": f"已达最大迭代次数 {scheme['MAX_ITERATIONS']},停止调用工具",
        })

    sources = [{"text": d["text"], "score": d["score"]} for d in local_docs]
    return {"trace": trace_events, "sources": sources, "answer": final_content}
```

**消息类型判断**：Agent 循环产生的消息分三类——带 `tool_calls` 的 AI 消息（决策）、`ToolMessage`（工具观察）、无工具调用的 AI 消息（最终答案）。遍历消息列表即可还原完整过程。

## 接口

```python
@bp.route("/agentic/query", methods=["POST"])
def agentic_query():
    data = request.get_json(silent=True) or {}
    query_text = data.get("query", "").strip()

    if not query_text:
        return {"error": "query 不能为空"}, 400

    return jsonify(services.answer_question(query_text))
```

因为 Agent 的 ReAct 循环是整段跑完的，结果用 `jsonify` 一次性返回，前端拿到 `trace` 可以展示决策过程，拿到 `answer` 展示最终回答。

## 运行效果

![Agentic RAG 决策过程](/images/rag/agentic-01.png)

![Agentic RAG 回答内容](/images/rag/agentic-02.png)

![Agentic RAG 完整流程](/images/rag/agentic-03.png)

## 小结

**Agentic RAG 的特点**

- 检索从「固定管线」变成「LLM 可调用的工具」，是否检索、检索什么、检索几次都由 LLM 自主决策
- 支持多工具编排：本地知识库不足时自动联网搜索补充
- 基于 LangChain Agent 框架，`@tool` 装饰器自动生成工具 schema，接入成本低

**适合**

- 问题复杂、需要多步推理，光一次向量检索不够的场景
  - 比如用户说"最近总失眠还盗汗，睡眠质量差"，第一步先查本地病历库有没有"失眠+盗汗"的相似病例；如果本地记录太少，再联网搜更全面的中医调理方案——一次提问内完成多次检索
- 需要「本地 + 联网」双数据源，甚至未来接入更多工具（API、数据库）的场景
  - 比如企业客服助手：先查内部知识库的产品手册，查不到再联网搜官方公告；后续想加个"查订单状态"的 API 工具，只需再写一个 `@tool` 注册进 Agent，不用改主流程
- 希望看到模型决策过程、做可视化展示或排查的场景
  - 比如做 Agent 教学的演示项目，前端把 `trace` 的"决定调用 search_local_tool → 工具返回 3 条病历 → 决定调用 search_online_tool → 综合回答"一步步渲染出来，用户能直观看到模型是怎么想的；线上排查时也能用 trace 定位"哪一步检索结果导致了错误回答"

**不适合**

- 简单问答，固定管线就够用，让 LLM 多轮决策反而慢、贵
  - 比如"感冒了应该注意什么"，一次本地检索就能拿到足够资料，直接拼 prompt 生成即可；让 LLM 走 Agent 循环等于把一次调用变成两三次调用，既慢又费 token
- 对响应速度敏感的场景——Agent 循环多次调 LLM，延迟和成本都更高
  - 比如实时聊天机器人的首屏回复，用户等不了好几轮工具调用的时间；固定管线一次流式输出，延迟稳定可预期
- 工具调用不稳定（模型乱调工具）的场景，需要额外的护栏和校验
  - 比如金融/医疗等强合规领域，模型偶尔会传错参数或调错工具（比如把"查病历"写成"查在线资料"），出错的代价高；这类场景宁可用固定管线 + 人工确认，也不要让 LLM 自由决策
