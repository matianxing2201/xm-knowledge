---
date: 2026-10-27
title: Ollama 基础对话与参数配置
tags:
  - AI
  - AI Agent
  - Ollama
---

# Ollama 基础对话与参数配置

配置模型名称和 Ollama 客户端的方式，见 [Ollama 配置与客户端](./Ollama-配置与客户端.md)。


## 一、准备对话消息

`chat` 接收 `messages` 消息列表。每条消息至少有两个字段：

- `role`：消息角色，常见值为 `user`（用户）、`assistant`（模型）和 `system`（系统指令）
- `content`：消息文本

```python
messages = [
    {
        "role": "user",
        "content": "帮我解释一下什么是向量检索",
    }
]
```

一次对话至少需要一条用户消息。多轮对话会把历史消息也放进列表，后续再展开。

## 二、一次性返回完整结果

不设置 `stream=True` 时，SDK 等模型生成完成后返回一个完整响应对象：

```python
import ollama

from config import Conf

response = ollama.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)

print(response["message"]["content"])
```

SDK 的响应也支持属性访问，取回复文本可以写成：

```python
print(response.message.content)
```

响应中的 `message.content` 是模型生成的正文；响应还包含模型名称、结束状态、输入输出 token 数和耗时等信息。想查看完整响应时可以直接 `print(response)`。

## 三、流式输出

设置 `stream=True` 后，`chat` 返回一个可迭代的响应流。循环会随着生成过程逐段取得 `chunk`：

```python
response_stream = ollama.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
    stream=True,
)

for chunk in response_stream:
    print(chunk["message"]["content"], end="", flush=True)
```

每个 `chunk` 都是一小段响应，因此读取的是 `chunk["message"]["content"]`，而不是等待完整的 `response`。`end=""` 不在片段间换行，`flush=True` 让终端尽快显示输出。

项目中的服务层使用客户端对象和属性访问，核心逻辑相同：

```python
stream = client.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
    stream=True,
)

for chunk in stream:
    print(chunk.message.content, end="", flush=True)
```

Web 接口还会把每段文本包装成 SSE 事件发送给前端；SSE 只是传输格式，底层仍是循环 Ollama 返回的响应流。

### 使用 Apifox 验证

请求中设置 `"stream": true`，并暂时把 `num_predict` 调小，可以观察接口逐段返回文本：

![Apifox 调用基础对话接口并收到流式响应，状态码为 200](/images/ai/ollama/ollama-basic01.png)

图中状态码为 `200`，响应区显示模型返回的文本，说明 Flask 路由、Ollama 调用和 SSE 响应链路已连通。

## 四、生成参数 `options`

`options` 用于控制模型如何生成文本。案例中使用三个参数：

```python
options = {
    "temperature": 0.3,
    "top_p": 0.9,
    "num_predict": 2048,
}

response = ollama.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
    options=options,
)
```

| 参数 | 含义 | 直观理解 |
| --- | --- | --- |
| `temperature` | 控制采样随机性 | 越低通常越稳定；越高通常越发散 |
| `top_p` | 核采样的累积概率阈值 | 从高概率候选词开始累加，达到阈值后停止纳入候选 |
| `num_predict` | 本次最多生成的 token 数 | 限制回复长度，不代表一定会生成这么多 |

这些值是起点，不是固定适用于所有模型和任务的最佳值。需要时可以从默认值开始，逐项调整并观察输出。

项目服务层还把默认参数和请求参数合并：

```python
configured = {
    "temperature": Conf.TEMPERATURE,
    "top_p": Conf.TOP_P,
    "num_predict": Conf.NUM_PREDICT,
}
if options:
    configured.update(options)
```

`update` 会把 `options` 中的键值合并到 `configured`：同名键覆盖默认值，新键则加入字典。这样通用默认值集中管理，单次调用可以只覆盖需要调整的参数。

## 五、调用流程

```text
选择模型 + 准备 messages + 可选 options
                  ↓
             调用 chat
             ↙       ↘
        普通模式       stream=True
    等待完整响应      循环读取 chunk
    取 message.content 逐段读取 message.content
```

普通模式适合调用方需要完整结果后再处理的场景；流式模式适合希望用户边生成边看到内容的场景。

## 六、小结

1. `messages` 用带角色的消息描述对话输入，多轮对话需要一并传入相关历史。
2. 普通模式等待模型生成完成，再从 `response.message.content` 读取回复。
3. 设置 `stream=True` 后，`chat` 返回可迭代的响应流，需要逐段读取内容。
4. `options` 可调整生成参数；项目可以集中设置默认值，再按请求覆盖。
