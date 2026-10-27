---
date: 2026-10-27
title: Ollama 配置与客户端
tags:
  - AI
  - AI Agent
  - Ollama
---

# Ollama 配置与客户端

配置和客户端是 Ollama 各个案例共用的准备工作：配置负责集中记录“使用什么模型、连接哪里”，客户端负责“通过什么对象调用 Ollama”。把它们单独记录后，基础对话、多轮对话、向量化等案例就不必各自重复介绍。

对话调用的具体过程见 [Ollama 基础对话与参数配置](./Ollama-基础对话与参数配置.md)。

## 一、配置模型名称

案例项目将不同用途的模型名放在 `Conf` 类中：

```python
class Conf:
    CHAT_MODEL = "qwen2.5:1.5b"
    EMBEDDING_MODEL = "all-minilm"
    VISION_MODEL = "llava:7b"
```

调用时通过 `Conf.CHAT_MODEL` 等名字引用，而不必在每个案例里重复写模型名：

```python
response = ollama.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)
```

配置模型名只是告诉程序要调用哪个模型，并不会自动下载模型。该模型需要先在当前 Ollama 服务中准备好；可以通过 `ollama list` 查看本地模型。

不同任务可以配置不同模型，例如：

- `CHAT_MODEL`：文本对话
- `EMBEDDING_MODEL`：文本向量化
- `VISION_MODEL`：图像理解

## 二、配置服务地址

当程序需要连接指定的 Ollama 服务时，把服务地址也放进配置中：

```python
class Conf:
    HOST = "http://127.0.0.1:11434"
    CHAT_MODEL = "qwen2.5:1.5b"
```

`HOST` 是 Ollama 服务的地址。服务运行在本机默认端口时通常使用 `http://127.0.0.1:11434`；如果服务部署在其他机器或容器网络中，就要改成程序实际可访问的地址。

## 三、创建 Ollama 客户端

项目将客户端创建过程封装在 `client.py`：

```python
import ollama

from .config import Conf


def get_client() -> ollama.Client:
    return ollama.Client(host=Conf.HOST)
```

`ollama.Client(...)` 创建客户端实例，`host` 告诉它连接哪个 Ollama 服务。`get_client()` 返回这个实例，后续通过实例的方法调用服务：

```python
client = get_client()

response = client.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)
```

客户端实例负责连接和提供调用方法；它不是模型，也不是模型回复。模型名在 `chat` 调用时传入，完整回复则由 `client.chat(...)` 返回。

## 四、模块方法和客户端方法

案例 demo 直接使用 `ollama.chat(...)`：

```python
response = ollama.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)
```

这里调用的是 `ollama` 模块提供的便捷方法。项目蓝图使用 `client.py` 创建的实例：

```python
client = get_client()
response = client.chat(
    model=Conf.CHAT_MODEL,
    messages=messages,
)
```

两种写法都能发起对话。实例写法可以显式指定服务地址，并便于在项目中统一复用客户端配置。

客户端常用方法包括：

| 方法 | 用途 |
| --- | --- |
| `client.chat(...)` | 按消息列表进行对话 |
| `client.generate(...)` | 根据一段 prompt 生成文本 |
| `client.list()` | 查看 Ollama 服务中已有的模型 |
| `client.show(model=...)` | 查看模型信息 |
| `client.pull(model=...)` | 下载模型 |
| `client.ps()` | 查看当前正在运行的模型 |
| `client.embed(...)` | 将文本转换为向量 |

这些方法作用于 Ollama 服务；比如 `list()` 查看的是服务器上的模型列表，不是客户端对象本身的属性列表。

## 五、从配置到对话

```text
Conf 配置模型名和服务地址
              ↓
       get_client() 创建客户端
              ↓
 client.chat(model=..., messages=...)
              ↓
       返回模型回复对象
```

## 六、小结

```text
[x] Conf 集中管理模型名称和连接地址
[x] 模型必须在目标 Ollama 服务中准备好
[x] Client 实例负责连接 Ollama，并提供调用方法
[x] 模块方法和实例方法都能调用 Ollama
```

> `Conf` 提供配置，`Client` 提供调用入口，具体案例负责组织请求并处理响应。
