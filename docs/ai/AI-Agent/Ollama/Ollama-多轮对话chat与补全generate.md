---
date: 2026-10-22
title: Ollama 多轮对话与补全（chat vs generate）
tags:
  - AI
  - AI Agent
  - Ollama
---

# Ollama 多轮对话与补全（chat vs generate）

[基础对话](./Ollama-基础对话与参数配置.md)介绍了如何发送一次消息。本篇在此基础上记录两个用法：用 `chat` 传入多轮历史，用 `generate` 根据一段提示词生成文本。



## 一、`chat` 和 `generate` 的区别

| 方法 | 主要输入 | 主要输出 | 常见用途 |
| --- | --- | --- | --- |
| `chat` | 带角色的 `messages` 列表 | `response.message.content` | 对话、多轮追问 |
| `generate` | 一段 `prompt` 文本 | `response.response` | 根据提示词生成文本或续写 |

`chat` 用 `role` 区分用户、助手等消息；`generate` 直接接收提示词。两者都需要指定要使用的模型。

## 二、多轮对话怎样保留上下文

每次调用都要把需要模型参考的历史放进 `messages`。例如，用户先介绍自己，再继续提问：

```python
messages = [
    {"role": "user", "content": "我叫小明。"},
    {"role": "assistant", "content": "你好，小明！"},
    {"role": "user", "content": "我叫什么名字？"},
]
```

模型能从前面的消息中看到名字，才有依据回答最后一个问题。如果下一次只传“我叫什么名字？”，模型就看不到这段历史。

案例中的终端对话维护了一个列表，流程如下：

```python
messages.append({"role": "user", "content": user_input})

response = client.chat(model=Conf.CHAT_MODEL, messages=messages)
reply = response.message.content

messages.append({"role": "assistant", "content": reply})
```

下一轮用户输入时，继续追加一条 `user` 消息，再把整个列表传给 `chat`。如果需要系统指令，也可以在列表开头放一条 `role` 为 `system` 的消息，并在后续请求中继续带上。

## 三、项目中的多轮对话接口

请求地址：

```text
POST http://127.0.0.1:5000/ollama/multi/chat
```

第一次请求可以只传一条用户消息：

```json
{
  "messages": [
    {"role": "user", "content": "我叫小明。"}
  ]
}
```

服务层把 `messages` 原样传给 Ollama，并将完整响应转换为字典：

```python
response = get_client().chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)
return response.model_dump()
```

返回结果里的 `message` 包含助手回复，下面是省略其他字段后的示意：

```json
{
  "message": {
    "role": "assistant",
    "content": "你好，小明！"
  }
}
```

继续追问时，调用方需要把上一轮的用户消息和实际返回的助手消息一起带上，再追加新的用户问题：

```json
{
  "messages": [
    {"role": "user", "content": "我叫小明。"},
    {"role": "assistant", "content": "你好，小明！"},
    {"role": "user", "content": "我叫什么名字？"}
  ]
}
```

这里的接口不保存会话历史，也不会自动把回复追加进下一次请求。上面的助手内容只是示例，实际使用时应填入接口返回的内容。

## 四、使用 `generate` 补全文本

`generate` 接收一段 `prompt`。案例用一句诗作为输入，让模型继续生成：

```python
prompt = "年年岁岁花相似，下一句"

response = client.generate(
    model=Conf.CHAT_MODEL,
    prompt=prompt,
)

print(response.response)
```

与 `chat` 的 `response.message.content` 不同，`generate` 的生成文本在 `response.response` 中。实际输出会受模型和提示词影响。

项目把生成文本放进 JSON 的 `response` 字段中返回。Apifox 请求示例：

```text
POST http://127.0.0.1:5000/ollama/multi/completion
```

```json
{
  "prompt": "年年岁岁花相似，下一句"
}
```

服务层调用 `get_client().generate(...)`，控制器将返回文本包装为 `{"response": "..."}`。

## 五、小结

```text
[x] chat 接收带角色的 messages 列表
[x] 多轮对话由调用方维护历史，并在每次请求时传入
[x] chat 的助手回复位于 response.message.content
[x] generate 接收 prompt，生成文本位于 response.response
```

> 多轮对话的关键是把需要的历史消息重新传给模型；文本生成则从当前提供的 prompt 开始。
