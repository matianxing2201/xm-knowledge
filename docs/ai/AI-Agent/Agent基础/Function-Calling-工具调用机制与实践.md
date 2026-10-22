---
date: 2026-07-25
title: Function Calling 工具调用机制与实践
tags:
  - AI
  - AI Agent
  - Function Calling
  - DeepSeek
---

# Function Calling 工具调用机制与实践

## 0. 概念地图：LLM / Agent / Skill / Tool / MCP

```
┌─────────────── 概念层级 ───────────────┐
│                                       │
│  LLM       ← 大脑（只会读字写字）     │
│    ↓ 给它工具                          │
│  Tool       ← 手（一个具体的能力）     │
│    ↓ 把多个工具组合起来                 │
│  Skill      ← 一项技能（完成任务）     │
│    ↓ 让"使用技能"自动化                │
│  Agent      ← 智能体（会规划+调用）     │
│    ↓ 一套让所有外部系统互通的标准      │
│  MCP        ← 协议（让工具能被插上来）  │
│                                       │
└───────────────────────────────────────┘
```

| 概念    | 定义                                               | 本项目对应           |
| ------- | -------------------------------------------------- | -------------------- |
| LLM     | 输入文本→输出文本                                   | DeepSeek Chat        |
| Tool    | 一个可调用的函数（完成子任务的方法）                 | `get_weather_info`   |
| Skill   | 用一组工具完成一个完整任务的能力                    | "做南京5天攻略"      |
| Agent   | 自动规划任务、调用工具、整合结果的应用              | demo_2 ReAct Agent   |
| MCP     | 大模型与外部系统连接的标准协议                      | 本篇不涉及           |

```
Function Calling 补上 LLM"动手"的缺口：
让 LLM 能调外部工具拿资料，再基于资料作答。
```

## 1. Function Calling 解决什么问题

### 痛点：知识停滞

```
用户问：今天南京天气怎么样？
LLM：  → 训练数据里没有"今天"
       → 只能瞎编（幻觉）
       → 或者承认"我不知道实时信息"
```

### 解法：让模型决定"调谁"

```
       用户："月底到南京旅游，帮我做5天攻略"
                  ↓
        ┌─────────────────────┐
        │   LLM（大脑）       │
        │   "我需要两类资料" │
        └─────────────────────┘
                  ↓ 说出"该调哪个函数、传什么参数"
        ┌─────────────────────┐
        │  天气工具  │ 城市搜索工具 │
        └─────────────────────┘
                  ↓ 工具执行后返回真实数据
        ┌─────────────────────┐
        │   LLM 再基于资料     │
        │   生成最终攻略       │
        └─────────────────────┘
```

这就是 Function Calling：**用自然语言触发函数调用，再把结果回流给模型**。

## 2. 五步标准流程

```
1. 工具定义    把 Python 函数用 JSON Schema 描述成模型能理解的"菜单"
2. 模型推理    用户需求 → 模型决定"该调哪个工具、传什么参数"
3. 参数生成    模型按 schema 吐出 arguments（JSON 字符串）
4. 函数执行    本地按 name 路由到真正的 Python 函数并执行
5. 结果整合    把工具返回的数据拼回 prompt，再问模型一次 → 最终答案
```

每一步都对应 demo_1 里一段代码。本文按这个顺序拆。

## 3. 项目结构

```
function_calling_mcp_workflow/
├── llm_manager.py      ← 统一管理 LLM 客户端（OpenAI SDK + LangChain）
├── .env                ← 密钥与配置（不入 Git）
├── demo_1/
│   └── app.py          ← 本篇主角：原生 SDK 调用
└── demo_2/
    └── app.py          ← 下一篇主角：LangChain ReAct
```

`llm_manager.py` 里只做了两件事：

```python
from openai import OpenAI
from langchain_openai import ChatOpenAI

# 原生 OpenAI SDK 客户端（demo_1 用这个）
llm = OpenAI(
    base_url=os.getenv("DEEPSEEK_BASE_URL"),
    api_key=os.getenv("DEEPSEEK_API_KEY"),
)

# LangChain ChatOpenAI 客户端（demo_2 用这个）
model = ChatOpenAI(
    base_url=os.getenv("DEEPSEEK_BASE_URL"),
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    model=os.getenv("DEEPSEEK_CHAT_MODEL"),
)
```

两套客户端都指向 DeepSeek——DeepSeek 兼容 OpenAI 协议，所以函数调用语法和 OpenAI 完全一致。

## 4. 第一步：工具定义

### 工具就是普通 Python 函数

demo_1 里定义了两个工具，签名规整：

```python
# 工具一：查城市天气（和风天气 API）
def get_weather_info(location: str):
    # 1. 先用城市名换 city_id
    city_url = f"{HEFENG_BASE_URL}{CITY_PATH}?location={location}&key={HEFENG_API_KEY}"
    resp = requests.get(city_url)
    location_list = resp.json().get("location")
    if not location_list:
        return "未找到城市信息"
    city_id = location_list[0].get("id")

    # 2. 用 city_id 换 15 天天气
    weather_url = f"{HEFENG_BASE_URL}{WEATHER_PATH}?location={city_id}&key={HEFENG_API_KEY}"
    resp = requests.get(weather_url)
    return json.dumps(resp.json().get("daily"))


# 工具二：查城市旅游信息（Tavily 搜索 API）
def get_city_info(query: str):
    resp = requests.post(
        TAVILY_BASE_URL,
        json={"query": query},
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
    )
    return json.dumps(resp.json().get("results"))
```

### 但模型看不见 Python 代码

模型只读文本。必须把函数名、参数、用途用 JSON 写成说明书递给它——这就是 `tools` 字段：

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather_info",
            "description": "查询城市天气",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "城市名"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_city_info",
            "description": "查询城市旅游信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "用户输入的问题或需求"
                    }
                },
                "required": ["query"]
            }
        }
    }
]
```

### 描述字段含义

| 字段          | 给谁看       | 作用                                       |
| ------------- | ------------ | ------------------------------------------ |
| `type`        | OpenAI 协议  | 固定 `"function"`                          |
| `name`        | 模型         | 模型决定要调哪个工具时的"名字"             |
| `description` | 模型         | 模型决定要不要调这个工具的"理由"           |
| `parameters`  | 模型 + 协议  | JSON Schema，决定传参的结构                |
| `properties`  | 模型         | 每个参数的类型 + 描述                       |
| `required`    | 模型 + 协议  | 哪些参数不能省                              |

> `description` 决定模型是否选中该工具。写清楚比写宽泛好——例如 `get_city_info` 的 description 写"查询城市旅游信息"比"查询城市信息"更准。

## 5. 第二步：模型推理 + 参数生成

把用户问题和工具菜单一起递给模型：

```python
resp = llm.chat.completions.create(
    model=DEEPSEEK_CHAT_MODEL,
    messages=[
        {"role": "user", "content": user_input}
    ],
    tools=tools,
    tool_choice="auto",   # none / auto / required / 指定函数
)
```

模型拿到"用户问题 + 工具菜单"后会做两件事：

```
1. 推理：    "用户要 5 天攻略，天气和景点都需要 → 调两个工具"
2. 生成参数： arguments = '{"location": "南京"}'
              arguments = '{"query": "南京旅游攻略5天"}'
```

然后返回 `tool_calls` 数组，里面装着模型要调的"指令"。

### `tool_choice` 的四种取值

| 取值              | 含义                                                       |
| ----------------- | ---------------------------------------------------------- |
| `"none"`          | 模型不调工具，直接文本回复                                 |
| `"auto"`（默认）  | 模型自己判断要不要调、调哪个                               |
| `"required"`      | 必须调至少一个工具（不许直接回答）                         |
| `{"type":"function","function":{"name":"xxx"}}` | 强制只调指定的那个工具 |

实际开发 90% 用 `"auto"`。如果想"必须查了天气再回答"就强制 `"required"`。

## 6. 第三、四步：函数执行（手动分发）

模型返回的不是执行结果，只是"帮我执行这些函数"的指令。执行还要自己动手：

```python
message = resp.choices[0].message

user_prompt = ""
if hasattr(message, "tool_calls"):
    user_prompt += "====以下是旅游攻略必备资料====\n\n"
    for func_info in message.tool_calls:
        func = func_info.function
        func_name = func.name
        func_args = json.loads(func.arguments)   # arguments 是 JSON 字符串，解码

        if func_name == "get_weather_info":
            location = func_args["location"]
            weather_info = get_weather_info(location)
            user_prompt += f"----以下是{location}天气信息-开始----\n\n"
            user_prompt += weather_info + "\n\n"
            user_prompt += f"----以下是{location}天气信息-结束----\n\n"
        elif func_name == "get_city_info":
            query = func_args["query"]
            city_info = get_city_info(query)
            user_prompt += "----以下是城市旅游相关信息-开始----\n\n"
            user_prompt += city_info + "\n\n"
            user_prompt += "----以下是城市旅游相关信息-结束----\n\n"
```

### 关键细节：`arguments` 是字符串

```
func_info.function.arguments  ← 这是个 JSON 字符串：'{"location": "南京"}'
                              ← 必须 json.loads() 才能拿到 dict
```

直接 `func_args["location"]` 会报 `string indices must be integers`——`arguments` 不是 dict 而是字符串，忘了 `json.loads` 是常见错误。

### 关键细节：`message.tool_calls` 可能不存在

模型有时不调任何工具直接回答（"今天南京天气很好，你想了解什么~"），此时 `message.tool_calls` 是 `None`。所以上面用了 `hasattr(...)` 判断。也可以写：

```python
if message.tool_calls:
    ...
```

### 关键细节：返回结果要回到 prompt

工具的返回值不会被模型自动接着用——模型已"下班"。收集完所有工具结果后，拼成新的 user prompt 再发起新一轮调用（见第 7 节）。

```
为什么不能在第一次调用里就把工具结果轮流塞回去？
  → HTTP 长连接/状态机不划算
  → 也容易绕乱消息顺序
  → 标准做法就是"两段式"：先问该调谁，再带着结果问最终答案
```

## 7. 第五步：结果整合 + 第二次调用

```python
resp = llm.chat.completions.create(
    model=DEEPSEEK_CHAT_MODEL,
    messages=[
        {
            "role": "system",
            "content": "你是一个专业的旅游攻略撰写者，你需要根据用户输入的需求详细编写旅游攻略"
        },
        {
            "role": "user",
            "content": user_prompt     # 工具返回值拼出来的大段资料
        }
    ]
)
print(resp.choices[0].message.content)
```

### 注意第二次调用的 `messages` 没有 `tools`

```
第一次 messages = [{role:user, content: 用户问题}]              + tools
第二次 messages = [{role:system,...}, {role:user, content: 资料}]   无 tools
```

```
为什么第二次不再带 tools？
  → 工具已经调完，资料已经拿到
  → 此时再带 tools，模型可能又想调一轮（多余）
  → 第二次的目的是"基于已有资料组织最终答案"，不需要再外呼
```

### 两次调用的分工

```
第一次 (推理阶段):
  职责：决定该调谁、传什么参数
  输入：用户原话 + 工具菜单
  输出：tool_calls 指令列表（不是最终答案）
       ↓
  中间：本地执行所有工具函数，收集返回值
       ↓
第二次 (整合阶段):
  职责：基于"用户原话"和"工具返回的资料"写出最终答案
  输入：system 设定身份 + user 拼好的资料块
  输出：完整攻略文本（这就是要的）
```

## 8. 完整可运行代码（脱敏）

```python
# demo_1/app.py
import json
import os

import requests
from dotenv import load_dotenv

import llm_manager

load_dotenv()

HEFENG_API_KEY = os.getenv("HEFENG_API_KEY")          # your-hefeng-key-here
HEFENG_BASE_URL = os.getenv("HEFENG_BASE_URL")        # https://api.qweather.com
CITY_PATH = os.getenv("CITY_PATH")                   # /geo/v2/city/lookup
WEATHER_PATH = os.getenv("WEATHER_PATH")              # /v7/weather/15d

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")          # your-tavily-key-here
TAVILY_BASE_URL = os.getenv("TAVILY_BASE_URL")       # https://api.tavily.com/search
DEEPSEEK_CHAT_MODEL = os.getenv("DEEPSEEK_CHAT_MODEL")

user_input = "月底到南京旅游，给我做一份5天的旅游攻略"


# ----------- 工具一：天气 -----------
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
def get_city_info(query: str):
    resp = requests.post(
        TAVILY_BASE_URL,
        json={"query": query},
        headers={"Authorization": f"Bearer {TAVILY_API_KEY}"},
    )
    return json.dumps(resp.json().get("results"))


# ----------- 第一次：让模型选工具 -----------
resp = llm_manager.llm.chat.completions.create(
    model=DEEPSEEK_CHAT_MODEL,
    messages=[{"role": "user", "content": user_input}],
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather_info",
                "description": "查询城市天气",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "城市名"}
                    },
                    "required": ["location"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_city_info",
                "description": "查询城市旅游信息",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "用户输入的问题或需求"}
                    },
                    "required": ["query"]
                }
            }
        }
    ],
    tool_choice="auto"
)

message = resp.choices[0].message

# ----------- 本地执行工具，收集结果 -----------
user_prompt = ""
if hasattr(message, "tool_calls"):
    user_prompt += "====以下是旅游攻略必备资料====\n\n"
    for func_info in message.tool_calls:
        func = func_info.function
        func_name = func.name
        func_args = json.loads(func.arguments)

        if func_name == "get_weather_info":
            location = func_args["location"]
            weather_info = get_weather_info(location)
            user_prompt += f"----以下是{location}天气信息-开始----\n\n"
            user_prompt += weather_info + "\n\n"
            user_prompt += f"----以下是{location}天气信息-结束----\n\n"
        elif func_name == "get_city_info":
            query = func_args["query"]
            city_info = get_city_info(query)
            user_prompt += "----以下是城市旅游相关信息-开始----\n\n"
            user_prompt += city_info + "\n\n"
            user_prompt += "----以下是城市旅游相关信息-结束----\n\n"

# ----------- 第二次：基于资料生成最终攻略 -----------
resp = llm_manager.llm.chat.completions.create(
    model=DEEPSEEK_CHAT_MODEL,
    messages=[
        {"role": "system", "content": "你是一个专业的旅游攻略撰写者，你需要根据用户输入的需求详细编写旅游攻略"},
        {"role": "user", "content": user_prompt}
    ]
)

print(resp.choices[0].message.content)
```

## 9. 完整调用时序

```
User       Client            DeepSeek           和风天气     Tavily
 │           │                  │                  │           │
 │─── 输入 ─→│                  │                  │           │
 │           │── 调用(带tools) ─→│                  │           │
 │           │                  │ 推理决定调两个工具│           │
 │           │←─ tool_calls ─────│                  │           │
 │           │                  │                  │           │
 │           │── HTTP 请求 ─────────────────────────→│           │
 │           │── HTTP 请求 ─────────────────────────────────────→│
 │           │←─ 天气 JSON ─────────────────────────│           │
 │           │←─ 搜索 JSON ─────────────────────────────────────│
 │           │                  │                  │           │
 │           │  拼成 user_prompt │                  │           │
 │           │── 调用(无tools) ─→│                  │           │
 │           │                  │ 整合 → 生成攻略   │           │
 │           │←─ 最终文本 ───────│                  │           │
 │←─ 输出 ───│                  │                  │           │
```

## 10. 数据形态一路看下来

```
[1] 用户输入
    "月底到南京旅游，给我做一份5天的旅游攻略"

[2] 第一次响应里 message.tool_calls（注意 arguments 是 JSON 字符串）
    [
      {
        "id": "call_xxx1",
        "type": "function",
        "function": {
          "name": "get_weather_info",
          "arguments": "{\"location\": \"南京\"}"
        }
      },
      {
        "id": "call_xxx2",
        "type": "function",
        "function": {
          "name": "get_city_info",
          "arguments": "{\"query\": \"南京旅游攻略5天\"}"
        }
      }
    ]

[3] 本地分发后，user_prompt（拼好的资料块）
    ====以下是旅游攻略必备资料====

    ----以下是南京天气信息-开始----

    [{"fxDate":"2026-07-30","textDay":"多云",...}, ...]

    ----以下是南京天气信息-结束----

    ----以下是城市旅游相关信息-开始----

    [{"title":"夫子庙","content":...}, ...]

    ----以下是城市旅游相关信息-结束----

[4] 第二次响应的 content
    "Day 1：夫子庙+秦淮河；Day 2：中山陵+南京博物院；..."
```

## 11. 几个常踩的坑

| 坑                                              | 原因                                                            | 处理                                                          |
| ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `string indices must be integers`              | `func.arguments` 是 JSON 字符串不是 dict                        | 先 `json.loads(func.arguments)` 再取字段                      |
| 模型选错工具                                    | `description` 写得太宽泛                                        | 把 `description` 写得越具体越好（"查询城市旅游信息" 非 "查询城市信息"） |
| 模型不调任何工具直接回答                        | `tool_choice="auto"` 模型觉得没必要                              | 改成 `"required"` 强制调用                                    |
| 期望工具是个数，结果拿到一段文本                | 工具返回值被 `json.dumps` 成字符串                              | 它本来就是字符串，再 `json.loads` 才能拿结构                   |
| API key 泄露                                    | URL 里直接拼 key                                                | 用 `.env` 加载，`os.getenv()` 取值；key 不上 Git              |
| 工具调用了但模型回答还是没用上资料              | 第二次调用没把 `user_prompt` 塞进 messages，或 tools 又带上了   | 第二次只发 system+user 两段资料，不要带 tools                 |
| 流式响应时 `tool_calls` 拼到一半                | 流式下 `arguments` 是分块返回的                                 | 累积完整 `delta.tool_calls[].function.arguments` 再 `loads`  |

## 12. 小结

1. **Function Calling = 让 LLM 在对话中触发外部函数调用**，本质是用 JSON Schema 描述工具，让模型按 schema 吐参数
2. **完整链路是"两段式"**：第一次问模型"该调谁"，本地执行后，第二次问模型"基于资料给答案"
3. **`tool_choice` 是工具选择的开关**：`auto` 让模型自己判断、`required` 强制必调、`none` 关掉调用、指定函数则只调那一个
4. **`description` 决定工具被选中的概率**，每一行都要写得让模型能拿来就判断要不要选
5. **工具返回值不会自动喂回模型**，必须手动拼到下一轮的 user prompt 里
6. **密钥和工具的实际 Python 实现是两件事**：模型只能看到 schema，看不到代码——代码安全反而是次要的，schema 描述才是关键

下一篇 [LangChain ReAct Agent 实战](/xm-knowledge/ai/AI-Agent/LangChain-ReAct-Agent-实战) 把两段式手写流程换成 LangChain + LangGraph 的 ReAct Agent，用装饰器 + 一句 invoke 替代手工调度。