---
date: 2026-07-25
title: LangChain ReAct Agent 实战
tags:
  - AI
  - AI Agent
  - LangChain
  - LangGraph
---

# LangChain ReAct Agent 实战

上一篇 [Function Calling 工具调用机制与实践](/xm-knowledge/ai/AI-Agent/Function-Calling-工具调用机制与实践) 用原生 OpenAI SDK 手写了"两段式工具调用"。本篇看 demo_2：用 LangChain + LangGraph 的 ReAct Agent 实现同一功能。

## 1. 上一版手写的代价

回看 demo_1 的代码量做一次盘点：

| 工作内容                              | 行数占比    | 是否"业务相关" |
| ------------------------------------- | ----------- | -------------- |
| 写工具的实际 HTTP 调用                | 约 30 行    | 是             |
| 用 JSON Schema 描述工具给模型         | 约 35 行    | 是             |
| 本地遍历 `tool_calls` 分发到 Python  | 约 15 行    | **否**         |
| 把返回结果拼成 prompt                 | 约 12 行    | **否**         |
| 第二次调用整合最终回答                | 约 10 行    | **否**         |

```
真正属于业务逻辑的：~65 行
只是用来"调度循环"的：~37 行（≈ 36%）

demo_2 的目标：把后 36% 全部交给框架。
```

## 2. ReAct 范式是什么

ReAct = **Reasoning + Acting**，"边思考边动手"。区别于 demo_1 的"两段式"：

```
demo_1 的 Function Calling：
  ┌───────────┐    ┌────────────┐    ┌──────────┐
  │ 选工具     │ →  │ 执行工具   │ →  │ 整合答案  │  两段式，不循环
  └───────────┘    └────────────┘    └──────────┘

ReAct：
  循环若干轮：
    Thought → Action → Observation
       ↑              ↓
       └──────────────┘
    Thought → Action → Observation → Thought → ...
```

| 维度       | demo_1 手写 Function Calling            | ReAct Agent                        |
| ---------- | --------------------------------------- | ---------------------------------- |
| 循环次数   | 固定 2 次（选工具 + 整合）              | 不限，看模型自己判断够不够          |
| 工具间依赖 | 一次问出来、并行调用                     | 看到上一个结果再决定下一步           |
| 调度代码   | 自己写 for/if 分发                       | 框架内置循环                       |
| 整合步骤   | 自己拼 prompt 二次调用                   | 框架结束循环直接吐出最终回答         |

### 真实例子

```
用户："做南京5天攻略"
            ↓
Thought: 需要天气和景点资料，先查天气
Action:  get_weather_info(location=南京)
Observation: [{"fxDate":"...","textDay":"多云"}...]

Thought: 天气有了，再查景点
Action:  get_city_info(query=南京旅游攻略5天)
Observation: [{"title":"夫子庙"...}, ...]

Thought: 资料齐了，可以写攻略了
Action:  (结束循环，输出最终回答)
Final Answer: Day 1：夫子庙 + 秦淮河...
```

每次"调谁"由模型在这一轮自己决定，而不是一开始就把一堆工具全调一遍。

## 3. demo_2 的代码结构

整个 demo_2 只改了两类东西：

```
① 工具的定义方式         @tool 装饰器 + Pydantic args_schema
② 调用方式               create_react_agent(...).invoke(...)
```

工具的 Python 实现一字未改。

## 4. 第一种改造：`@tool` 装饰器

demo_1 的工具函数和 JSON Schema 分开两份写，手动维护一致性。demo_2 用装饰器合一：

```python
from langchain_core.tools import tool
from pydantic import Field
from openai import BaseModel


class GetWeatherInfoArgs(BaseModel):
    location: str = Field(description="城市名")


@tool(
    "get_weather_info_tool",                  # 工具名（给模型看的）
    description="查询城市天气",               # 工具描述
    args_schema=GetWeatherInfoArgs            # 参数 schema
)
def get_weather_info(location: str):
    city_url = f"{HEFENG_BASE_URL}{CITY_PATH}?location={location}&key={HEFENG_API_KEY}"
    resp = requests.get(city_url)
    location_list = resp.json().get("location")
    if not location_list:
        return "未找到城市信息"
    city_id = location_list[0].get("id")
    weather_url = f"{HEFENG_BASE_URL}{WEATHER_PATH}?location={city_id}&key={HEFENG_API_KEY}"
    resp = requests.get(weather_url)
    return json.dumps(resp.json().get("daily"))
```

### 三块拼起来

| 部分              | 来源                          | 给谁看     |
| ----------------- | ----------------------------- | ---------- |
| 工具名            | `@tool` 第一个参数            | 模型       |
| 工具描述          | `description=...`             | 模型       |
| 参数 schema       | `args_schema=GetWeatherInfoArgs` | 模型 |
| 函数体            | 普通的 `def` 函数             | 本地执行   |

### 为什么用 Pydantic

```
demo_1 的 schema 是一个手写 dict：
  {"type": "object", "properties": {"location": {"type": "string", "description": "城市名"}}, "required": ["location"]}

demo_2 的 schema 是一个 Pydantic 模型：
  class GetWeatherInfoArgs(BaseModel):
      location: str = Field(description="城市名")

两份等价，但 Pydantic 有三个好处：
  1. 类型、描述写一行，不用专门维护 dict 结构
  2. 自动校验：传 {"location": 123} 会被 Pydantic 报错而不是放过去
  3. IDE 友好：跳转/补全/重命名都正常工作
```

`openai.BaseModel` 和 `pydantic.BaseModel` 定义相同，demo_2 用了前者。新项目推荐 `from pydantic import BaseModel` + `from pydantic import Field`。功能等价，本文沿用 demo_2 原本的写法。

## 5. 第二种改造：`ChatPromptTemplate`

demo_2 把 system / user 提示词写成模板：

```python
from langchain_core.prompts import ChatPromptTemplate

promptTemplate = ChatPromptTemplate.from_messages(
    [
        ("system", "你是一位专业旅游攻略撰写者，你需要根据用户输入的需求生成一份详细的旅游攻略"),
        ("user", "{user_input}")
    ]
)
```

```
promptTemplate 就是一个"留了占位符的提示词"：
  ┌─────────────────────┐
  │ system: 固定身份      │
  │ user:    `{user_input}`  ← 占位符
  └─────────────────────┘
  调用时：promptTemplate.format_messages(user_input="月底到南京...")
  → 产出 [{"role":"system",...}, {"role":"user", "content":"月底到南京..."}]
```

| 概念             | 含义                                                          |
| ---------------- | ------------------------------------------------------------- |
| Prompt           | 提示词本身                                                    |
| Prompt Template  | 带占位符的提示词，运行时由 `format_messages()` 注入实际值     |
| 为什么要模板     | 让"提示词"和"具体业务数据"分离，方便维护和多场景复用          |

相比 demo_1 直接拼字符串到 messages，ChatPromptTemplate 把提示词文本和业务数据分离。多轮对话或条件分支场景下收益明显；单占位符场景（如本例仅 `{user_input}`）收益有限。

> 注意：模板里的 `<code v-pre>{user_input}</code>` 是 LangChain 模板占位符的语法，**不是** Vue 模板插值的 <code v-pre>{{ }}</code>。它们是两套毫不相关的语法——LangChain 用单层花括号 `{user_input}`，Vue 用双层 <code v-pre>{{ }}</code>。本仓库 markdown 渲染时为了避免 <code v-pre>{{ }}</code> 被 VitePress 当成 Vue 模板插值二次解析，所有这种位置都用 `<code v-pre>` 包裹。

## 6. 第三种改造：`create_react_agent` + `invoke`

这是 ReAct 的核心：

```python
from langgraph.prebuilt import create_react_agent

tools = [get_weather_info, get_city_info]
agent = create_react_agent(llm_manager.model, tools)

messages = promptTemplate.format_messages(user_input=user_input)
msgs = {"messages": messages}

resp = agent.invoke(msgs)

print(resp["messages"][-1].content)
```

四行结束。之前 demo_1 花了 ~37 行做的"工具分发 + 拼资料 + 二次调用"由框架接管。

### `create_react_agent` 在背后做什么

```
agent = create_react_agent(model, tools)

等价伪代码：

def create_react_agent(model, tools):
    return 一个有界状态机（LangGraph）：
      state = { "messages": [...] }

      loop:
        1. 把当前所有 messages 发给 model，附带 tools
        2. 如果模型这次不再生成 tool_calls → break，return
        3. 否则对每个 tool_call：
             解析 arguments
             路由到对应 Python 函数
             把结果包成 {role:"tool", tool_call_id:..., content:...}
             追加到 messages
        4. 继续 loop
```

```
类比：
  demo_1：手写一遍循环、并且只循环一次（不是 ReAct，是单轮 Function Calling）
  demo_2：把循环交给 LangGraph，自己只用到入口
```

### `invoke` 之后发生了什么

```
agent.invoke({"messages": messages})
       ↓
  ┌────────────────────────────┐
  │ Round 1                    │
  │   Thought: 需要天气         │
  │   Action:  get_weather_info│
  │   Observation: ...          │
  ├────────────────────────────┤
  │ Round 2                    │
  │   Thought: 还需要景点       │
  │   Action:  get_city_info   │
  │   Observation: ...          │
  ├────────────────────────────┤
  │ Round 3                    │
  │   Thought: 资料齐全         │
  │   Action: 不调，直接答        │
  │   Output: "Day 1：夫子庙..."│
  └────────────────────────────┘
       ↓
  resp["messages"] = [原 user msg, 模型msg_round1, tool_msg1,
                      模型msg_round2, tool_msg2, 模型最终msg]
       ↓
  resp["messages"][-1].content = 最终攻略文本
```

`resp["messages"][-1]` 是模型最后一轮的输出。取之前做长度检查避免空列表索引错误。

## 7. 完整可运行代码（脱敏）

```python
# demo_2/app.py
import json
import os
from typing import Any

import requests
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from openai import BaseModel
from pydantic import Field

import llm_manager

load_dotenv()

HEFENG_API_KEY = os.getenv("HEFENG_API_KEY")           # your-hefeng-key-here
HEFENG_BASE_URL = os.getenv("HEFENG_BASE_URL")         # https://api.qweather.com
CITY_PATH = os.getenv("CITY_PATH")                    # /geo/v2/city/lookup
WEATHER_PATH = os.getenv("WEATHER_PATH")              # /v7/weather/15d
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")           # your-tavily-key-here
TAVILY_BASE_URL = os.getenv("TAVILY_BASE_URL")        # https://api.tavily.com/search
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL")

user_input = "月底到南京旅游，给我做一份5天的旅游攻略"


# ----------- 工具一：天气 -----------
class GetWeatherInfoArgs(BaseModel):
    location: str = Field(description="城市名")


@tool(
    "get_weather_info_tool",
    description="查询城市天气",
    args_schema=GetWeatherInfoArgs
)
def get_weather_info(location: str):
    city_url = f"{HEFENG_BASE_URL}{CITY_PATH}?location={location}&key={HEFENG_API_KEY}"
    resp = requests.get(city_url)
    location_list = resp.json().get("location")
    if not location_list:
        return "未找到城市信息"
    city_id = location_list[0].get("id")
    weather_url = f"{HEFENG_BASE_URL}{WEATHER_PATH}?location={city_id}&key={HEFENG_API_KEY}"
    resp = requests.get(weather_url)
    return json.dumps(resp.json().get("daily"))


# ----------- 工具二：城市旅游信息 -----------
class GetCityInfoArgs(BaseModel):
    query: str = Field(description="用户输入的问题或需求")


@tool(
    "get_city_info_tool",
    "查询城市信息",
    args_schema=GetCityInfoArgs
)
def get_city_info(query: str):
    resp = requests.post(
        TAVILY_BASE_URL,
        json={"query": query},
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
    )
    return json.dumps(resp.json().get("results"))


# ----------- Prompt 模板 -----------
promptTemplate = ChatPromptTemplate.from_messages(
    [
        ("system", "你是一位专业旅游攻略撰写者，你需要根据用户输入的需求生成一份详细的旅游攻略"),
        ("user", "{user_input}")
    ]
)

# ----------- ReAct Agent -----------
tools = [get_weather_info, get_city_info]
agent = create_react_agent(llm_manager.model, tools)

messages = promptTemplate.format_messages(user_input=user_input)
msgs: Any = {"messages": messages}

resp = agent.invoke(msgs)

print(resp["messages"][-1].content)
```

## 8. demo_1 vs demo_2 全面对比

| 维度              | demo_1 原生 SDK                                       | demo_2 LangChain ReAct                                |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| 工具定义          | dict 手写 JSON Schema                                 | `@tool` 装饰器 + Pydantic                              |
| Schema 与代码同步 | 手动维护，容易漂移                                    | Pydantic 类自动生成                                    |
| 提示词            | 直接拼字符串                                          | `ChatPromptTemplate.from_messages`                     |
| 工具调用次数控制  | 固定两段：选工具 → 整合                               | ReAct 循环，看模型自己决定                             |
| 工具间是否依赖    | 一次性全部调用，无法串行                              | 看到上一步结果再决定下一步，可串行                     |
| 结果回流机制      | 自己拼 prompt 二次调用                                |.LangGraph 自动把 tool 结果作为 `tool` 角色消息追加    |
| 整合最终答案       | 第二次显式调用模型                                    | 循环内模型不再触发工具时自然产出                        |
| 代码量            | ~144 行（含工具实现 + 调度 + 整合）                   | ~109 行（工具实现重复占大头，框架代码 ~10 行）          |
| 灵活性            | 高（想塞什么 messages 都行）                          | 中（被 `create_react_agent` 框架流程限住）             |
| 学习曲线          | 低（看得见的 if/for）                                  | 中（要读 LangGraph 状态机）                            |
| 适合场景          | 工具少、调用模式固定                                   | 工具多、调用模式复杂、需要"看一步走一步"               |

## 9. 三个值得知道的点

### 9.1 `create_react_agent` 是预设好的

来自 `langgraph.prebuilt`。需要自定义循环逻辑（如每轮插入日志步骤）时，从 `langgraph` 取底层原语自己搭状态机。

### 9.2 LangChain Tool 与原生 OpenAI Function 的关系

```
@tool 装饰器
     ↓
LangChain Tool 对象
     ↓
内部自动转成 OpenAI Function 的 JSON Schema
     ↓
 LangChain 统一处理多家模型（OpenAI、Anthropic、DeepSeek...）
```

LangChain 在底层做 schema 翻译，把工具抽象成跨模型可复用的层。

### 9.3 工具的副作用归我们管

```
LangGraph 只负责"看到 tool_call → 路由到对应函数"
        ↓
函数返回的字符串 / 列表 / 数字 → 又被塞回 messages
        ↓
异常、超时、断网、外部 API 失败 → 都得在 @tool 函数自己 try/except
```

```
框架接走的：
   决策"调谁"          ← LLM
   路由"调用名字→真函数"  ← LangGraph
   把返回值塞回去       ← LangGraph

自己接的：
   外部 HTTP 请求       ← requests
   外部密钥读取         ← os.getenv
   业务级异常处理       ← try/except
```

> `@tool` 函数应返回干净的字符串或 JSON，**异常必须用 try/except 接住转成"工具调用失败"的 text**，否则 ReAct 循环直接断掉。

## 10. 调用时序

```
User        Client           DeepSeek        LangGraph          和风/Tavily
 │            │                  │                │                  │
 │─ 输入 ────→│                  │                │                  │
 │            │  format_messages ↓                │                  │
 │            │  messages=[sys, user]             │                  │
 │            │                  │                │                  │
 │            │  agent.invoke ───→│  ReAct round 1 │                  │
 │            │                  │ ← No tool yet →│                  │
 │            │                  │  选 get_weather→│                  │
 │            │                  │                │── HTTP ──────────→│
 │            │                  │                │← weather JSON ────│
 │            │                  │  ReAct round 2 │                  │
 │            │                  │  选 get_city   │                  │
 │            │                  │                │── HTTP ──────────→│
 │            │                  │                │← search JSON ─────│
 │            │                  │  ReAct round 3 │                  │
 │            │                  │  不调工具，输出 │                  │
 │            │←─────────────────│                │                  │
 │← 输出 ────│                  │                │                  │
```

跟 demo_1 序列图对比：demo_1 那两条"工具调用收尾"的整合阶段被 ReAct 循环吸收，外部调用流程简化成一次 `invoke`。

## 11. 几个常踩的坑

| 坑                                                | 原因                                                                     | 处理                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `@tool` 函数签名没标注类型                        | Pydantic 拿不到类型，schema 生成乱七八糟                                 | 函数一定要写 `def get_weather_info(location: str):`          |
| `args_schema` 继承错 BaseModel                    | `from openai import BaseModel` 与 `from pydantic import BaseModel` 同名不同源 | 业务里建议统一用 `pydantic.BaseModel`                       |
| Pydantic v2 写法                                  | 旧代码用 `Field(...)`                                                    | v2 推荐用默认值 + `Field(description=...)`                 |
| `promptTemplate` 里写 `<code v-pre>{x}</code>` 被当 Vue 模板 | VitePress 把 <code v-pre>{{ }}</code> 当模板插值                       | 避免在 markdown 行内代码里写 <code v-pre>{{ }}</code>，用 `<code v-pre>` 或单独成段 |
| `invoke` 返回没拿到最终回答                       | ReAct 在某个工具函数抛异常后停了循环                                     | 在 `@tool` 里 try/except，把异常转成 `"工具调用失败: xxx"`   |
| 工具丢给 LangChain 后 description 看不到          | 装饰器第一/二个位置参数没写对                                            | 写关键字参数 `description="..."` 而不是位置参数              |
| `tool` 名字和真实函数名不一致                     | 习惯命名两套（`get_weather_info_tool` vs `get_weather_info`）            | 真实函数名是 Python 里调用的；`@tool` 第一个参数名是给模型看的 |
| 输出 langtrace 太长看不清                          | 默认 debug 关不掉                                                        | 在 `agent.invoke` 前后加 `print(resp["messages"][-1].content)` |

## 12. 小结

1. **ReAct = Reasoning + Acting**，把 demo_1 的"两段式"扩成"自动多轮循环"，每轮一个 Thought→Action→Observation
2. **`@tool` 装饰器 + Pydantic** 让"工具函数"和"工具描述"写在一起，schema 不再是个独立维护的 dict
3. **`ChatPromptTemplate`** 把提示词文本和业务数据分离
4. **`create_react_agent(model, tools).invoke({"messages": ...})`** 接管了 demo_1 里 37 行调度代码
5. **框架接走了调度，没接走业务**——HTTP 调用、密钥读取、异常处理仍是工具函数自己的责任
6. **demo_2 灵活度低于 demo_1**，被 ReAct 循环框死。需要细粒度控制时要从 `langgraph` 底层原语自己搭状态机