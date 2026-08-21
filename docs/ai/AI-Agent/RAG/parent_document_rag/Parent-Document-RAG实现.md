---
date: 2026-08-20
title: Parent-Document RAG 实现
tags:
  - AI
  - AI Agent
  - RAG
  - LangChain
  - Milvus
---

# Parent-Document RAG 实现

前几篇（Naive / Hybrid / Agentic）都用的是**单层分块**：把文档切成同一种大小的块，向量化后入库。这篇换了个方式，解决单层分块天生的两难——切大块检索不准，切小块语义残缺。解法是**父子两级分块**：子块（小）存向量库负责「检索」，父块（大）存 KV 负责「上下文」，命中子块后回取父块全文交给 LLM。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/parent_document_rag)

## 为什么需要父子分块

单层分块的两难：

| 切法                | 问题                                       |
| ------------------- | ------------------------------------------ |
| 切大块（如 800 字） | 一个块里混多个主题，向量被平均化，检索不准 |
| 切小块（如 300 字） | 语义被切碎，召回片段残缺，LLM 拿到半句话   |

父子分块的回答是**双层表示**：

```
整篇文档
   │  切大块
   ▼
父块 (800字) ─────────────► 存 JSON 文件（KV，按 id 精确取全文）
   │  再切小块
   ▼
子块 (300字) ─────────────► 存 Milvus（向量检索，找"哪段最像问题"）
```

检索时命中子块 → 拿到 `parent_id` → 回取整个父块全文 → 拼给 LLM。**小块找得准，大块读得全。**

## 目录结构

```
parent_document_rag/
├── controllers.py      # 路由：/parent/upload + /parent/query
├── services.py         # 编排：入库 create_vector_data / 查询 answer_question
├── splitter.py         # 父子两级切分（本篇核心）
├── store.py            # 双层存储：子块→Milvus，父块→JSON 文件
└── prompts.py          # 系统提示词（和 naive/hybrid 同一中医医师人设）
```

## 配置参数 — config.py

所有 RAG 方案配置统一收在 `RAG_SCHEMES`，本方案的子块向量库用独立 collection（schema 多了 `parent_id` 字段，不与单层 knowledge_base 混用）：

```python
"parent_document_rag": {
    # 子块向量库（独立 schema：多 parent_id 字段，与单层 knowledge_base 隔离）
    "COLLECTION_NAME": "tcm_medical_record_pd",
    "PARENT_CHUNK_SIZE": 800,   # 父块：大块，保留完整语义，存 JSON 文件
    "PARENT_CHUNK_OVERLAP": 100,
    "CHILD_CHUNK_SIZE": 300,    # 子块：小块，向量检索精确，存 Milvus
    "CHILD_CHUNK_OVERLAP": 50,
    "TOP_K": 3,  # 子块召回数（命中后回取父块全文）
},
```

## P1 入库流程 — /parent/upload

上传 `.txt` → 父子两级切分 → 父块写 JSON 文件 + 子块（带父 id 指针）写 Milvus，返回块数统计：

```
上传 txt → split_parent_child 两级切分
          ├─ 父块 → ParentStore.save_many  → JSON 文件
          └─ 子块 → ChildStore.insert_children → Milvus
```

### 切分 — splitter.py

`RecursiveCharacterTextSplitter` 按「段落 → 句子 → 标点」递归切分，`separators` 里的中文标点（，。、）专为中文长文档（合同/标书/政策）设计：

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 中文场景的分隔符顺序：段落 → 换行 → 中文逗号句号顿号 → 空格 → 兜底
_SEPARATORS = ["\n\n", "\n", "，", "。", "、", " ", ""]


def split_parent_child(
    doc_content: str,
    parent_size: int,
    parent_overlap: int,
    child_size: int,
    child_overlap: int,
) -> list[tuple[str, list[str]]]:
    """整篇文档 -> [(父块文本, [子块文本, ...]), ...]"""
    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=parent_size,
        chunk_overlap=parent_overlap,
        separators=_SEPARATORS,
        keep_separator=True,  # ==保留分隔符，避免切断后语义丢失==
    )
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=child_size,
        chunk_overlap=child_overlap,
        separators=_SEPARATORS,
        keep_separator=True,
    )
    return [
        (p_chunk, child_splitter.split_text(p_chunk))
        for p_chunk in parent_splitter.split_text(doc_content)
    ]
```

> ==`keep_separator=True` 让分隔符留在块尾，避免「你好，世界」被切成「你好」「世界」丢逗号。==

### 双层存储 — store.py

两种存储对应两种查询（教学核心）：

- **子块存向量库** —— 回答「哪个片段跟问题最像？」用向量相似度找；
- **父块存 KV** —— 回答「这个 id 的全文是什么？」按 `parent_id` 精确取。

生产环境父块 这里用 JSON 文件 + dict 演示。

**子块 → Milvus：**

```python
class ChildStore:
    """子块向量库（Milvus）：schema 比单层知识库多一个 parent_id 指针字段。"""

    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.client = MilvusClient(
            uri=f"http://{current_app.config['MILVUS_HOST']}:{current_app.config['MILVUS_PORT']}"
        )

    def ensure_collection(self) -> None:
        if self.client.has_collection(self.collection_name):
            return
        schema = self.client.create_schema(auto_id=True, enable_dynamic_field=False)
        schema.add_field("id", DataType.INT64, is_primary=True)
        schema.add_field("vector", DataType.FLOAT_VECTOR, dim=current_app.config["EMBEDDING_DIM"])
        schema.add_field("text", DataType.VARCHAR, max_length=65535)
        schema.add_field("parent_id", DataType.VARCHAR, max_length=100)  # ==关键：子块指向父块的指针==
        index_params = self.client.prepare_index_params()
        index_params.add_index(
            field_name="vector",
            metric_type=current_app.config["METRIC_TYPE"],
            index_type="AUTOINDEX",
        )
        self.client.create_collection(
            self.collection_name, schema=schema, index_params=index_params
        )

    def insert_children(self, rows: list[dict]) -> int:
        """批量写入子块（id 由 Milvus 自动分配），flush 保证立即可查。"""
        self.ensure_collection()
        self.client.insert(self.collection_name, data=rows)
        self.client.flush(self.collection_name)
        return len(rows)
```

**父块 → JSON 文件：**

```python
class ParentStore:
    """父块 KV 存储：JSON 文件 + dict(parent_id -> 全文)。"""

    def __init__(self, collection_name: str):
        self._file = os.path.join(
            current_app.config["KNOWLEDGE_BASE_DIR"],
            f"parent_chunks_{collection_name}.json",  # ==父块私有数据区，gitignored==
        )

    def _load(self) -> dict:
        if not os.path.exists(self._file):
            return {}
        with open(self._file, encoding="utf-8") as f:
            return json.load(f)

    def save_many(self, parents: dict[str, str]) -> None:
        """追加父块（与 knowledge_base 的累积式导入语义一致）。"""
        data = self._load()
        data.update(parents)
        os.makedirs(os.path.dirname(self._file), exist_ok=True)
        with open(self._file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
```

> ==父块文件结构：`{"parent_id": "全文", ...}`，按 id 精确取，不需要向量。==

### 入库编排 — services.py

`create_vector_data` 把「切分 → 向量化 → 双写」串起来：

```python
def create_vector_data(doc_content: str) -> dict:
    """入库：父块写 JSON 文件，子块（带父 id 指针）写 Milvus。返回块数统计。"""
    scheme = _scheme()
    pairs = split_parent_child(
        doc_content,
        scheme["PARENT_CHUNK_SIZE"],
        scheme["PARENT_CHUNK_OVERLAP"],
        scheme["CHILD_CHUNK_SIZE"],
        scheme["CHILD_CHUNK_OVERLAP"],
    )

    parents: dict[str, str] = {}
    child_rows: list[dict] = []
    for p_text, child_texts in pairs:
        parent_id = str(uuid.uuid4())  # ==每个父块一个 uuid，作为子块的指针==
        parents[parent_id] = p_text
        for child_text in child_texts:
            child_rows.append(
                {
                    "text": child_text,
                    "vector": kb_services.embed_text(child_text),  # ==复用 knowledge_base 的向量化组件==
                    "parent_id": parent_id,
                }
            )

    ParentStore(scheme["COLLECTION_NAME"]).save_many(parents)
    child_count = ChildStore(scheme["COLLECTION_NAME"]).insert_children(child_rows)
    return {"parent_count": len(parents), "child_count": child_count}
```

> ==入库只复用 `kb_services.embed_text`（向量化组件），父子索引 schema 自包含在本方案内，knowledge_base 保持「单层 CRUD」的纯粹。==
>
> 子块的 `parent_id` 是「指针」：子块负责被向量检索命中，父块负责提供完整上下文，两者通过这个 uuid 关联。

### 上传接口 — controllers.py

```python
@bp.route("/parent/upload", methods=["POST"])
def parent_upload():
    file = request.files.get("file")
    if file is None or not file.filename.lower().endswith(".txt"):
        return {"error": "只支持 .txt 文件"}, 400

    content = file.read().decode("utf-8")
    if not content.strip():
        return {"error": "文件内容为空"}, 400

    return jsonify(services.create_vector_data(content))
```

返回示例（Json）：

```json
{ "parent_count": 2, "child_count": 15 }
```

![Parent-Document RAG 整体流程](/images/rag/parent-doc-rag-1.png)

![Parent-Document RAG 入库结果](/images/rag/parent-doc-rag-2.png)

## P2 查询流程 — /parent/query

查询链「**小块找得准、大块读得全**」：命中的是小块的向量，回传的是大块的全文：

```
用户提问 → 子块向量检索(TOP_K) → parent_id 去重 → 回取父块全文 → 拼 prompt → SSE 流式回答
```

### 检索双子 — store.py

P1 入库时说了两种存储对应两种查询，查询侧的方法现在补全。**子块检索**只取 `text + parent_id`，小块负责「定位」：

```python
class ChildStore:
    def search(self, query_vector: list[float], top_k: int) -> list[dict]:
        """向量检索子块，返回命中的 {text, parent_id, score}。"""
        self.ensure_collection()
        results = self.client.search(
            collection_name=self.collection_name,
            data=[query_vector],
            limit=top_k,
            output_fields=["text", "parent_id"],  # ==命中只取 text + parent_id，够拼接父块即可==
        )
        return [
            {
                "text": r["entity"]["text"],
                "parent_id": r["entity"]["parent_id"],
                "score": r["distance"],
            }
            for r in results[0]
        ]
```

**父块取全文**按 `parent_id` 精确取 KV，跳过不存在的 id：

```python
class ParentStore:
    def get_many(self, parent_ids: list[str]) -> list[dict]:
        """按入参顺序取父块全文（跳过不存在的 id），供拼接上下文。"""
        data = self._load()
        return [
            {"parent_id": pid, "text": data[pid]}
            for pid in parent_ids
            if pid in data
        ]
```

> ==`output_fields` 控制命中返回哪些字段：只要 `text` 和 `parent_id`。父块全文是 LLM 的上下文。==

### 查询编排 — services.py

`answer_question_stream` 串起「检索 → 去重 → 取父块 → 流式生成」，全程 SSE：

```python
def answer_question_stream(query: str):
    """流式回答：先发 sources（命中的父块全文），再逐块流式生成答案（SSE）。"""
    scheme = _scheme()

    hits = ChildStore(scheme["COLLECTION_NAME"]).search(
        kb_services.embed_text(query), scheme["TOP_K"]
    )
    # 多个子块可能命中同一父块，按父 id 去重且保持命中顺序
    parent_ids = list(dict.fromkeys(h["parent_id"] for h in hits))
    sources = ParentStore(scheme["COLLECTION_NAME"]).get_many(parent_ids)

    yield _sse({"type": "sources", "sources": sources})

    medical_record = "\n\n".join(s["text"] for s in sources)
    messages = [
        {"role": "system", "content": prompts.SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"----用户症状----\n{query}\n\n----中医病例记录----\n{medical_record}",
        },
    ]
    for chunk in _llm().stream(messages):
        if getattr(chunk, "content", None):
            yield _sse({"type": "delta", "content": chunk.content})
    yield _sse({"type": "done"})
```

**核心要点：**

| 代码/概念                       | 说明                                           |
| ------------------------------- | ---------------------------------------------- |
| `ChildStore.search` + `TOP_K=3` | 子块向量检索，小块负责「定位」哪段最像         |
| `dict.fromkeys`                 | 多个子块命中同一父块时去重，且保留首次命中顺序 |
| `ParentStore.get_many`          | 按父 id 精确取大块全文，大块负责「上下文」     |
| `_sse()`                        | 把事件包装成 `data: {json}\n\n` 的 SSE 帧      |
| `_llm().stream()`               | ChatOpenAI 流式生成，逐 chunk 发 delta         |

> 向量库里查到的是 300 字子块，拼给 LLM 的是 800 字父块全文——检索粒度与上下文粒度解耦。

### SSE 流式接口 — controllers.py

```python
@bp.route("/parent/query", methods=["POST"])
def parent_query():
    data = request.get_json(silent=True) or {}
    query_text = data.get("query", "").strip()

    if not query_text:
        return {"error": "query 不能为空"}, 400

    return Response(
        stream_with_context(services.answer_question_stream(query_text)),
        mimetype="text/event-stream",
    )
```

> ==`stream_with_context` 让生成器在 Flask 请求上下文中执行；`mimetype="text/event-stream"` 声明 SSE 流。返回的不是完整 JSON，而是依次推送三类事件：==

| 事件 type | 内容               | 时机             |
| --------- | ------------------ | ---------------- |
| `sources` | 命中的父块全文列表 | 检索完成后先发   |
| `delta`   | LLM 生成的增量片段 | 生成过程中逐块发 |
| `done`    | 结束标记           | 全部生成完后发   |

![Parent-Document RAG 查询结果](/images/rag/parent-doc-rag-3.png)

## 小结

**Parent-Document RAG 的特点**

- 双层表示化解「切大块检索不准、切小块语义残缺」的两难
- 子块（小）存向量库负责检索精度，父块（大）存 KV 负责语义完整
- 子块带 `parent_id` 指针，命中后回取父块全文，解决「切片切碎语义」
- 查询侧「小块找得准、大块读得全」：向量检索命中子块 → 父 id 去重 → 取父块全文 → SSE 流式回答
- 本方案模块自包含，只复用 `knowledge_base` 的向量化组件，不入侵单层 schema

**适合**

- 单块内包含多主题的长文档（合同 / 标书 / 政策 / 病历）
- 语义粒度细、但回答需要完整上下文支撑的场景

**知识点总结**

| 知识点                           | 说明                                                    |
| -------------------------------- | ------------------------------------------------------- |
| `RecursiveCharacterTextSplitter` | LangChain 递归切分器，按段落→句子→标点逐级切            |
| `keep_separator=True`            | 分隔符保留在块尾，避免切段丢标点                        |
| `parent_id`                      | 子块指向父块的指针字段，Milvus schema 多出的一列        |
| 双重存储                         | 子块→Milvus（向量检索），父块→JSON 文件（KV 精确取）    |
| `uuid.uuid4()`                   | 生成父块主键，保证唯一且不可枚举                        |
| `output_fields`                  | Milvus 检索命中只返回 text + parent_id，够定位即可      |
| `dict.fromkeys`                  | 子块命中同一父块时去重，且保留首次命中顺序              |
| SSE 流式回答                     | sources → delta → done 三类事件逐帧推送                 |
| `stream_with_context`            | 生成器在 Flask 请求上下文中执行，配合 SSE 声明 mimetype |
| `EventSource` 限制               | 只支持 GET，POST 场景用 fetch 手动解析 SSE 流           |
