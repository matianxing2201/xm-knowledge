---
date: 2026-08-25
title: Self-RAG 实现
tags:
  - AI
  - AI Agent
  - RAG
  - LangChain
  - LangGraph
  - Milvus
---

# Self-RAG 实现

前几篇（Naive / Hybrid / Agentic / Parent-Document）都是**固定的「检索 → 生成」链路**：不管问题需不需要外部资料、检索到的内容对不对、够不够，都硬着头皮让 LLM 生成。这篇引入**自省（Self-Reflection）**——LLM 不仅要回答问题，还要先对自己「**要不要查、查得对不对、够不够用**」做判断，判断结果交给 LangGraph 的状态机驱动流程分支。

> 📁 [项目源码](https://github.com/matianxing2201/agent_practice/tree/main/app/blueprints/rag/self_rag)

## 为什么需要自省

普通 RAG 的三个「无脑」假设，正是 Self-RAG 要打破的：

| 环节         | 普通 RAG | Self-RAG                            |
| ------------ | -------- | ----------------------------------- |
| 要不要检索   | 一律检索 | LLM 判断：闲聊直接答，不走检索      |
| 检索结果质量 | 全盘接受 | 逐块自省过滤，只留与症状相关的      |
| 资料够不够用 | 不关心   | LLM 判断：不够就清空重检索          |
| 重试次数     | 无       | `MAX_RETRIEVE_ROUND` 兜底，防死循环 |

一句话：**普通 RAG 把检索当固定步骤，Self-RAG 把检索也变成需要「思考」的决策。**

## 目录结构

```
self_rag/
├── controllers.py      # 路由：/self/query
├── services.py         # 编排：answer_question 运行工作流
├── builder.py          # 工作流组装：LangGraph StateGraph 状态机
├── nodes.py            # 五个自省节点 + 两个条件路由（本篇核心）
├── state.py            # 状态定义：节点间传递的 TypedDict
└── prompts.py          # 四个自省提示词（RETRIEVE/DIRECT/YES/NO/ENOUGH/LACK）
```

## 配置参数 — config.py

本方案**复用共享知识库** `tcm_medical_record`（和 naive/hybrid 同库，不新建 collection），多出的是「自省重检索轮数」这个流程参数：

```python
"self_rag": {
    "COLLECTION_NAME": "tcm_medical_record",  # 复用共享知识库（与 naive/hybrid 同库）
    "TOP_K": 3,             # 检索备选病例块数
    "MAX_RETRIEVE_ROUND": 3,  # ==自省最大重检索轮数：防死循环的终止阀==
},
```

## 状态定义 — state.py

工作流在节点间传递的是一张**状态快照**（`TypedDict`，运行时就是普通 dict，LangGraph 按字段增量合并）：

```python
from typing import TypedDict


class SelfRAGState(TypedDict):
    patient_msg: str                      # 患者描述，全程不变
    medical_record_list: list[str]        # 备选病例块（检索原始结果）
    valid_medical_record_list: list[str]  # 有效病例块（自省过滤后）
    final_result: str | None              # 最终诊断（或提示语）
    retrieve_round: int                   # ==自省轮数：配合 MAX_RETRIEVE_ROUND 防死循环==
```

> ==节点只返回自己改动的字段，LangGraph 把它们合并进状态；没动的字段（如 `patient_msg`）自动保留。==

## 五个自省节点 — nodes.py

流程的骨架（`route_judge` / `route_sufficiency` 是条件路由，决定边怎么走）：

```
START
  │
  ▼
judge_retrieve 自省「要不要检索？」 ──route_judge──► 闲聊(final_result 已置)→ END
  │ RETRIEVE
  ▼
retrieve ──► filter_docs ──► check_sufficiency 自省「够不够？」
  ▲  ┌───────────────┘  │ route_sufficiency
  │  │ LACK(列表被清空)   │ ENOUGH / 到上限
  └──┘                   ▼
                      generate ──► END
```

### 公共工具

```python
def _invoke(template, **variables) -> str:
    """用 prompt 调 LLM，返回纯文本结果（管道：ChatPromptTemplate → LLM → StrOutputParser）。"""
    return (template | _llm() | StrOutputParser()).invoke(variables)
```

> ==`StrOutputParser` 把 `AIMessage` 转成纯字符串，才能直接和 `"RETRIEVE"`、`"YES"`、`"ENOUGH"` 比较。==

### 节点 1 — judge_retrieve：自省「要不要检索」

```python
def node_judge_retrieve(state: SelfRAGState) -> SelfRAGState:
    result = _invoke(prompts.judge_retrieve_template, patient_msg=state["patient_msg"])
    if result == "DIRECT":
        # 闲聊/无关：不检索，直接给提示（置 final_result 即触发路由结束）
        state["final_result"] = "请输入与中西医相关的描述，便于我给出中医诊断与治疗方案"
    return state


def route_judge(state: SelfRAGState) -> str:
    """已有最终结果（闲聊）则结束，否则进入检索。"""
    return "end" if state.get("final_result") is not None else "retrieve"
```

> ==关键：节点负责「改状态产生信号」（置 `final_result`），路由负责「读状态选方向」。闲聊时检索路径完全不会被执行。==

### 节点 2 — retrieve：向量检索备选病例

```python
def node_retrieve(state: SelfRAGState) -> SelfRAGState:
    state["medical_record_list"] = _retrieve(state["patient_msg"])
    state["valid_medical_record_list"] = []
    state["retrieve_round"] += 1  # ==每次检索轮数 +1，配合上限防死循环==
    return state
```

`_retrieve` 复用 `knowledge_base` 的 `MilvusStore` 和 `embed_text` 向量化组件，和 naive 检索代码同源：

```python
def _retrieve(patient_msg: str) -> list[str]:
    """向量检索共享知识库，返回 top_k 个备选病例块文本。"""
    scheme = current_app.config["RAG_SCHEMES"]["self_rag"]
    store = MilvusStore(scheme["COLLECTION_NAME"])
    store.ensure_collection()
    results = store.client.search(
        collection_name=store.collection_name,
        data=[kb_services.embed_text(patient_msg)],
        limit=scheme["TOP_K"],
        output_fields=["text"],
    )
    return [r["entity"]["text"] for r in results[0]]
```

### 节点 3 — filter_docs：逐块自省过滤

```python
def node_filter_docs(state: SelfRAGState) -> SelfRAGState:
    for chunk in state["medical_record_list"]:
        result = _invoke(
            prompts.filter_docs_template,
            patient_msg=state["patient_msg"],
            doc_chunk=chunk[:1500],  # ==截断到 1500 字，控制单次 LLM 调用成本==
        ).strip()
        if result == "YES":
            state["valid_medical_record_list"].append(chunk)
    return state
```

> ==检索结果不是照单全收：每个备选病例块单独过一遍 LLM，判断「跟这个患者的症状是否具备参考价值」。==

### 节点 4 — check_sufficiency：自省「够不够」

```python
def node_check_sufficiency(state: SelfRAGState) -> SelfRAGState:
    if not state["valid_medical_record_list"]:
        return state  # 没有有效数据，交给路由决定
    result = _invoke(
        prompts.check_sufficiency_template,
        patient_msg=state["patient_msg"],
        valid_medical_record_list=state["valid_medical_record_list"],
    ).strip()
    scheme = current_app.config["RAG_SCHEMES"]["self_rag"]
    if result == "LACK" and state["retrieve_round"] < scheme["MAX_RETRIEVE_ROUND"]:
        # ==资料不够且还有重试机会：清空备选/有效，回到 retrieve 再来一轮==
        state["medical_record_list"] = []
        state["valid_medical_record_list"] = []
    return state


def route_sufficiency(state: SelfRAGState) -> str:
    """列表被清空（要重检索）则回到 retrieve，否则生成。"""
    if not state["medical_record_list"] and state["retrieve_round"] < current_app.config["RAG_SCHEMES"]["self_rag"]["MAX_RETRIEVE_ROUND"]:
        return "retrieve"
    return "generate"
```

> ==自省循环的完整闭环：LLM 说「不够」→ 清空列表（信号）→ 路由看到空列表 → 回 retrieve 换一批病例再查。`MAX_RETRIEVE_ROUND` 是唯一能打断这个循环的终止阀。==

### 节点 5 — generate：生成最终诊断

```python
def node_generate(state: SelfRAGState) -> SelfRAGState:
    if not state["valid_medical_record_list"]:
        # 过滤后没有可用资料：直接给提示，不调生成 LLM
        state["final_result"] = "暂无可参考的病例资料，无法做出辩证论治方案"
        return state
    result = _invoke(
        prompts.generate_template,
        patient_msg=state["patient_msg"],
        medical_record="".join(state["valid_medical_record_list"]),
    )
    state["final_result"] = result
    return state
```

## 工作流组装 — builder.py

节点是普通函数，靠 `StateGraph` 把它们织成图：

```python
from langgraph.constants import END, START
from langgraph.graph import StateGraph


def build_workflow():
    graph = StateGraph(SelfRAGState)

    graph.add_node("judge_retrieve", node_judge_retrieve)
    graph.add_node("retrieve", node_retrieve)
    graph.add_node("filter_docs", node_filter_docs)
    graph.add_node("check_sufficiency", node_check_sufficiency)
    graph.add_node("generate", node_generate)

    graph.add_edge(START, "judge_retrieve")
    graph.add_conditional_edges(            # ==条件边：路由函数返回哪个名字，就走哪条边==
        source="judge_retrieve",
        path=route_judge,
        path_map={"end": END, "retrieve": "retrieve"},
    )
    graph.add_edge("retrieve", "filter_docs")
    graph.add_edge("filter_docs", "check_sufficiency")
    graph.add_conditional_edges(
        source="check_sufficiency",
        path=route_sufficiency,
        path_map={"retrieve": "retrieve", "generate": "generate"},
    )
    graph.add_edge("generate", END)

    return graph.compile()
```

> ==两条**条件边**是自省的落点：`path_map` 把路由函数返回的字符串（`end`/`retrieve`/`generate`）映射到图的节点或 `END`。这是 LangGraph 与普通顺序代码最大的不同——流程方向由 LLM 的判断结果在运行时决定。==

## 编排 — services.py

```python
def answer_question(query: str) -> dict:
    """运行 Self-RAG 工作流，返回 {answer, sources, retrieve_round}。

    answer          最终诊断（或提示语）
    sources         自省过滤后实际使用的有效病例块
    retrieve_round  自省轮数（>1 说明发生了「资料不足→重检索」）
    """
    workflow = build_workflow()
    state = workflow.invoke(
        {
            "patient_msg": query,
            "medical_record_list": [],
            "valid_medical_record_list": [],
            "final_result": None,
            "retrieve_round": 0,
        }
    )
    return {
        "answer": state["final_result"],
        "sources": state["valid_medical_record_list"],
        "retrieve_round": state["retrieve_round"],
    }
```

> ==`workflow.invoke(初始状态)` 一次跑完整张图：LangGraph 依次执行节点、把返回值合并进状态、按条件路由选边，最终返回终态快照。不需要手写 `while` 循环。==

## 接口 — controllers.py

```python
@bp.route("/self/query", methods=["POST"])
def self_query():
    data = request.get_json(silent=True) or {}
    query_text = data.get("query", "").strip()

    if not query_text:
        return {"error": "query 不能为空"}, 400

    return jsonify(services.answer_question(query_text))
```

返回示例（Json）：

```json
{
  "answer": "辨证论治诊断结果...",
  "sources": ["有效病例片段..."],
  "retrieve_round": 1
}
```

> ==`retrieve_round > 1` 是自省循环真正跑起来过的证据：发生过「资料不足 → 清空 → 重检索」。==

## 小结

**Self-RAG 的特点**

- 用 LangGraph `StateGraph` 把「检索」从固定步骤升级为**带判断的决策**
- 三层自省：要不要查（judge）→ 查得对不对（filter）→ 够不够用（check）
- 节点改状态产生信号，路由读状态选方向，流程走向由 LLM 判断在运行时决定
- `MAX_RETRIEVE_ROUND` 作为终止阀，防止自省循环无限打转
- 复用共享知识库与 `knowledge_base` 的检索/向量化组件，不新建 collection

**适合**

- 问题多样、需要区分「闲聊 / 缺资料 / 资料充足」的问答场景
- 检索结果噪音大、希望过滤后再交给 LLM 的场景
- 想用图状态机替代手写 if/else 编排流程的学习场景

**知识点总结**

| 知识点                  | 说明                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `TypedDict` 状态        | 节点间传递的状态快照，运行时是 dict，LangGraph 按字段增量合并  |
| `StrOutputParser`       | 把 AIMessage 转纯字符串，才能和 `RETRIEVE`/`YES`/`ENOUGH` 比较 |
| `add_conditional_edges` | 条件边：路由函数返回名字 → `path_map` 映射到节点或 END         |
| 节点改状态 / 路由选边   | 节点产生信号（清空列表/置 final_result），路由消费信号选方向   |
| `MAX_RETRIEVE_ROUND`    | 重检索轮数上限，防死循环的终止阀                               |
| `chunk[:1500]`          | 逐块过滤时截断文本，控制单次 LLM 调用的 token 成本             |
