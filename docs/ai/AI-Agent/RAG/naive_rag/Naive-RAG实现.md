---
date: 2026-08-17
title: Naive RAG 实现
tags:
  - AI
  - AI Agent
  - RAG
  - Milvus
  - LLM
---

# Naive RAG 实现

最基础的 RAG 实现，思路就是：用户问问题 → 去知识库搜相关的内容 → 把搜到的内容喂给 LLM → 让 LLM 基于这些内容回答。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/naive_rag)

## 模块结构

```
naive_rag/
├── controllers.py      # 路由，就一个接口
├── services.py         # 编排检索和生成
├── retrieval.py        # 检索逻辑
└── generation.py       # 生成逻辑
```

## 整体流程

```
用户提问 → 向量化 → Milvus 搜相似 → 拼 prompt → LLM 生成 → 流式返回
```

入口在 `services.py`：

```python
def answer_question_stream(query: str):
    retrieved_docs = retrieval.retrieve(query)

    # 先把搜到的结果发给前端，让用户看到参考来源
    sources = [{"text": doc["text"], "score": doc["score"]} for doc in retrieved_docs]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources}, ensure_ascii=False)}\n\n"

    # 再流式生成回答
    yield from generation.generate_answer_stream(query, retrieved_docs)
```

这样前端可以先展示"参考了哪些资料"，再展示回答，用户体验好一点。

## 检索部分

`retrieval.py` 就做三件事：

```python
def retrieve(query: str) -> list[dict]:
    top_k = current_app.config["TOP_K"]

    # 1. 把用户问题转成向量
    query_vector = kb_services.embed_text(query)

    # 2. 去 Milvus 搜最相似的 top_k 条
    store = MilvusStore(current_app.config["RAG_SCHEMES"]["naive_rag"]["COLLECTION_NAME"])
    store.ensure_collection()

    results = store.client.search(
        collection_name=store.collection_name,
        data=[query_vector],
        limit=top_k,
        output_fields=["text"],
    )

    # 3. 整理成 {"text": "...", "score": 0.xx} 的格式
    retrieved = []
    for result in results[0]:
        retrieved.append({
            "text": result["entity"]["text"],
            "score": result["distance"],
        })

    return retrieved
```

注意：embedding 模型必须和入库时用的一致，不然向量空间对不上，搜出来的结果就是乱的。

搜出来的结果长这样：

```
用户问题："感冒了，恶寒发热无汗"
        ↓ 向量化
[0.12, -0.45, ..., 0.87]  # 2048维
        ↓ Milvus 余弦检索
[
  {"text": "病例记录 1：感冒・风寒束表证...", "score": 0.85},
  {"text": "病例记录 2：感冒・风热犯表证...", "score": 0.72},
  {"text": "病例记录 3：感冒・暑湿伤表证...", "score": 0.68}
]
```

## 生成部分

`generation.py` 负责把检索结果拼成 prompt，然后调 LLM 生成。

### 拼 prompt

```python
def _build_messages(query: str, retrieved_docs: list[dict]) -> list[dict]:
    system_prompt = """你是一个中医医师，你需要根据患者的症状与中医病例记录作出中医诊断。
    请只依据提供的资料回答，不要编造信息。如果资料中没有相关信息，请明确说明。"""

    # 把搜到的病例拼起来
    context_parts = []
    for i, doc in enumerate(retrieved_docs, 1):
        context_parts.append(f"病例记录 {i}:\n{doc['text']}")
    context = "\n\n".join(context_parts)

    user_prompt = f"""----用户输入的症状信息----
    {query}
    ----中医病例记录----
    {context}
    """
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
```

system prompt 里强调"只依据提供的资料回答"，这是 RAG 减少幻觉的关键。

### 流式生成

```python
def generate_answer_stream(query: str, retrieved_docs: list[dict]):
    messages = _build_messages(query, retrieved_docs)
    client = _openai_client()

    stream = client.chat.completions.create(
        model=current_app.config["CHAT_MODEL"],
        messages=messages,
        temperature=0.7,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield f"data: {json.dumps({'type': 'delta', 'content': chunk.choices[0].delta.content}, ensure_ascii=False)}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
```

### SSE 格式

前端收到的数据长这样：

```
# 先收到检索结果
data: {"type": "sources", "sources": [{"text": "...", "score": 0.85}]}

# 再收到生成的内容（一个字一个字蹦）
data: {"type": "delta", "content": "根据"}
data: {"type": "delta", "content": "您"}
data: {"type": "delta", "content": "的"}
data: {"type": "delta", "content": "症状"}
...

# 最后收到完成信号
data: {"type": "done"}
```

## 接口

就一个 POST 接口：

```python
@bp.route("/naive/query", methods=["POST"])
def query():
    data = request.get_json(silent=True) or {}
    query_text = data.get("query", "").strip()

    if not query_text:
        return {"error": "query 不能为空"}, 400

    return Response(
        stream_with_context(services.answer_question_stream(query_text)),
        mimetype="text/event-stream",
    )
```

![Naive RAG 查询结果](/images/rag/naive-rag-query.png)

## 和 knowledge_base 模块的关系

```
knowledge_base 模块           naive_rag 模块
      │                           │
      │  管数据写入                │  管数据使用
      │                           │
POST /rag/knowledge/*       POST /rag/naive/query
      │                           │
      ▼                           ▼
  services.py                 retrieval.py
      │                           │
      ▼                           ▼
  Milvus Store                generation.py
```

简单说就是：`knowledge_base` 负责往 Milvus 里塞数据，`naive_rag` 负责从 Milvus 里搜数据然后用。两个模块各干各的，互不干扰。

## 小结

Naive RAG 就这么点东西：

- 检索和生成分开写，改一个不影响另一个
- 先发检索结果再发生成内容，前端体验好
- system prompt 里要强调"只依据资料回答"，不然 LLM 还是会瞎编
- 和知识库模块解耦，只管用不管存
