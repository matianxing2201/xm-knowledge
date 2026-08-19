---
date: 2026-08-19
title: Hybrid RAG 实现
tags:
  - AI
  - AI Agent
  - RAG
  - Milvus
  - BM25
---

# Hybrid RAG 实现

在 Naive RAG 基础上加了一层 BM25 重排序，先用向量语义召回一堆候选，再用关键词匹配过滤掉"语义近但字面无关"的噪声。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/hybrid_rag)

## 目录结构

```
hybrid_rag/
├── controllers.py      # 路由，还是一个接口
├── services.py         # 编排
├── retrieval.py        # 核心：向量召回 + BM25 重排序
└── generation.py       # 生成，和 naive_rag 一样
```

## 和 Naive RAG 的区别

|      | Naive RAG                  | Hybrid RAG                 |
| ---- | -------------------------- | -------------------------- |
| 检索 | 只用向量相似度             | 向量召回 + BM25 重排序     |
| 噪声 | 可能召回语义近但无关的内容 | BM25 过滤掉关键词不匹配的  |
| 依赖 | 只要 Milvus                | Milvus + jieba + rank_bm25 |

## 检索流程

这是和 naive_rag 唯一不一样的地方：

```python
# retrieval.py — retrieve
def retrieve(query: str) -> list[dict]:
    candidates = _vector_recall(query)      # 阶段1：向量召回一堆候选
    return _bm25_rerank(query, candidates)  # 阶段2：BM25 重排序，取最终 top_k
```

### 阶段1：向量召回

```python
def _vector_recall(query: str) -> list[dict]:
    candidate_k = current_app.config["RAG_SCHEMES"]["hybrid_rag"]["CANDIDATE_K"]

    query_vector = kb_services.embed_text(query)

    store = MilvusStore(current_app.config["RAG_SCHEMES"]["hybrid_rag"]["COLLECTION_NAME"])
    store.ensure_collection()

    results = store.client.search(
        collection_name=store.collection_name,
        data=[query_vector],
        limit=candidate_k,  # 召回数 > 最终返回数，比如召回20条，最终只取5条
        output_fields=["text"],
    )

    return [{"text": r["entity"]["text"], "vector_score": r["distance"]} for r in results[0]]
```

**为什么召回数要大于最终返回数**：给 BM25 留筛选空间，捞多一点，再用关键词过滤掉不相关的。

### 阶段2：BM25 重排序

```python
def _bm25_rerank(query: str, candidates: list[dict]) -> list[dict]:
    top_k = current_app.config["TOP_K"]

    if not candidates:
        return []

    # 对候选文本分词，构建 BM25 索引
    token_corpus = [jieba.lcut(c["text"]) for c in candidates]
    bm25 = BM25Okapi(token_corpus)

    # 用户输入也分词，算各候选的 BM25 分数
    query_tokens = jieba.lcut(query)
    scores = bm25.get_scores(query_tokens)

    # 按分数降序取 top_k
    idxes = scores.argsort()[-top_k:][::-1]
    return [
        {"text": candidates[idx]["text"], "score": float(scores[idx])}
        for idx in idxes
    ]
```

**为什么要加 BM25**：

向量检索衡量的是"语义相似度"，但语义近不代表字面相关。比如问"恶寒头痛"，可能和"咳嗽痰多"的病历在向量空间里很近，但关键词完全不一样，对回答没帮助。

BM25 是词频统计模型，看的是"用户说的词有没有真的出现在文本里"。所以：

- 向量召回（宽）：保证语义相关的都捞进来，宁多勿漏
- BM25 重排（窄）：只留字面真正相关的，过滤语义噪声

## 接口

和 naive_rag 一样，一个 POST 接口：

```python
@bp.route("/hybrid/query", methods=["POST"])
def hybrid_query():
    data = request.get_json(silent=True) or {}
    query_text = data.get("query", "").strip()

    if not query_text:
        return {"error": "query 不能为空"}, 400

    return Response(
        stream_with_context(services.answer_question_stream(query_text)),
        mimetype="text/event-stream",
    )
```

## 生成部分

和 naive_rag 完全一样，拼 prompt → 流式调 LLM，没啥好说的。

## 小结

**Hybrid RAG 的特点**

- 两阶段检索：先向量召回（宽），再 BM25 重排（窄），兼顾语义相关性和字面相关性
- 用关键词匹配过滤"语义近但字面无关"的噪声，提升最终返回结果的精准度
- 只比 naive_rag 多一个 `retrieval.py` 的重排环节，接入成本低

**适合**

- 知识库内容"语义相近但内容不同"的场景，比如中医病例、客服问答这种相似表述多、但对字面词敏感的数据
- 向量召回噪声多、需要精准关键词匹配的场景
- 对结果精度要求高，愿意多花一点检索开销换取更准的答案

**不适合**

- 知识库内容规整、表述统一的场景，直接向量检索就够用，加 BM25 是多余开销
- 对召回精度要求不高、追求最快响应的场景
- 文本以同义词/近义词为主、缺少字面匹配的场景——BM25 只认字面词，换表述就失效
