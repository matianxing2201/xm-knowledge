---
date: 2026-10-29
title: Ollama RAG 实战
tags:
  - AI
  - AI Agent
  - Ollama
  - RAG
  - ChromaDB
---

# Ollama RAG 实战

RAG（Retrieval-Augmented Generation，检索增强生成）先从知识库中找到与问题相关的资料，再把资料和问题一起交给模型生成回答。项目使用本地 `证型.txt` 作为知识库，使用 Ollama 生成文本向量，Chroma 保存向量，最后由聊天模型组织答案。

## 一、整体流程

```text
证型.txt
   ↓ 读取、切分
文本片段
   ↓ OllamaEmbeddings 向量化
Chroma 向量库
   ↓ 相似度检索 top_k 片段
相关资料 + 用户问题
   ↓ Ollama generate
回答 + 引用来源
```

对应关系：

| 步骤 | 项目实现 |
| --- | --- |
| 知识文件 | `app/blueprints/ollama/rag/data/证型.txt` |
| 文本切分 | `RecursiveCharacterTextSplitter`，片段长度 300，重叠 50 |
| 向量化 | `OllamaEmbeddings`，模型由 `Conf.EMBEDDING_MODEL` 指定 |
| 向量存储 | `Chroma`，持久化目录为 `rag/chroma_db/` |
| 检索 | `similarity_search(query, k=3)` |
| 生成 | Ollama SDK 的 `generate()`，模型由 `Conf.CHAT_MODEL` 指定 |

## 二、切分知识文件

服务层通过 `TextLoader` 读取 UTF-8 文本，再由 `RecursiveCharacterTextSplitter` 切分：

```python
documents = TextLoader(str(DATA_PATH), encoding="utf-8").load()
splitter = RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=50,
)
chunks = splitter.split_documents(documents)
```

`chunk_size` 控制单个片段的目标长度；`chunk_overlap` 让相邻片段保留一部分重复内容，降低重要信息刚好落在切分边界而丢失上下文的概率。`split_documents()` 返回的片段仍然是 `Document` 对象，因此文本内容和来源等 metadata 可以一起保留。

## 三、向量化并保存到 Chroma

项目使用配置中的嵌入模型将文本转换为向量，并使用本地持久化目录保存：

```python
embeddings = OllamaEmbeddings(
    model=Conf.EMBEDDING_MODEL,
    base_url=Conf.HOST,
)
vector_store = Chroma(
    collection_name="tcm_syndrome",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_PATH),
)
```

向量库第一次为空时，程序读取并切分知识文件，再调用 `add_documents()` 写入片段。之后再次请求时会复用已建立的向量库；当前进程还会缓存 Chroma 实例，避免每次请求都重新初始化。

```python
if not vector_store.get()["ids"]:
    documents = TextLoader(str(DATA_PATH), encoding="utf-8").load()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=50,
    )
    chunks = splitter.split_documents(documents)
    vector_store.add_documents(chunks)
```

向量数据保存在 `app/blueprints/ollama/rag/chroma_db/`，服务重启后仍可加载。知识文件有变更时，现有实现不会自动重新索引；需要清理该持久化目录后再发起查询，才能用新文件重建索引。

## 四、检索相关资料

收到问题后，向量库会返回相似度较高的 3 个片段：

```python
related_docs = vector_store.similarity_search(query, k=3)
context = "\n\n".join(document.page_content for document in related_docs)
```

检索结果是 `Document` 列表。`page_content` 是片段正文，`metadata` 会保留来源文件等信息。服务把片段正文拼成上下文用于回答，并把命中的正文和 metadata 一起放进 `sources` 返回，便于查看回答所依据的知识。

## 五、将检索结果交给 Ollama 生成

提示词把知识库内容和用户问题放在一起，并要求模型依据资料整理回答：

```python
prompt = f"""根据患者自述和中医证型知识库中的相关内容,整理可能相关的证型与治法。
请说明回答依据来自以下资料,仅供学习参考,不能替代医生诊断。

中医证型知识库内容:
{context}

患者自述:
{query}
"""
response = get_client().generate(
    model=Conf.CHAT_MODEL,
    prompt=prompt,
    options={"num_predict": 256},
)
```

这里使用 `generate()`，因为服务已经将检索资料和问题组装成一段完整提示词。`num_predict` 将本次回答限制在最多 256 个 token，避免本地模型生成过长内容。模型生成的文本位于 `response.response`。

## 六、调用项目接口

```text
POST http://127.0.0.1:5000/ollama/rag/query
Content-Type: application/json
```

请求示例：

```json
{
  "query": "发烧，头痛，流鼻涕"
}
```

接口返回 `answer` 和 `sources`。下图是通过 Chroma 向量库实际检索到的片段：

![Ollama RAG 查询的实际检索片段](/images/ai/ollama/ollama-rag-query.png)

本机以“发烧、头痛、流鼻涕”检索时，当前 `all-minilm` 嵌入模型召回的片段与感冒问题相关性不高。这说明检索结果不仅取决于 `top_k`，也受嵌入模型的语言能力和文本切分影响；中文知识库应选择适合中文的嵌入模型，并在更换模型后重新建立向量索引。

这次本机 `qwen2.5:7b` 生成请求超过等待时间并返回 502，因此截图仅记录真实检索结果，不把未生成的回答写成实际输出。模型生成结果取决于本地推理设备和 Ollama 服务状态。

## 七、小结

1. 知识文件先由 `TextLoader` 读取，再切分成较小的文本片段。
2. `OllamaEmbeddings` 将片段转换成向量，Chroma 负责保存并在后续请求中复用。
3. 用户提问时，Chroma 按相似度取回 3 个片段，服务把它们和问题一起交给 Ollama。
4. 接口返回模型回答及对应的 `sources`，可以据此查看回答参考了哪些内容。
5. 本次中文查询的召回结果不够贴合问题。后续可尝试更适合中文的嵌入模型，并重新建立向量库比较效果。
