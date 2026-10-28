---
date: 2026-10-28
title: Ollama 自定义模型 Modelfile
tags:
  - AI
  - AI Agent
  - Ollama
---

# Ollama 自定义模型 Modelfile

`Modelfile` 用于描述一个自定义模型如何从基础模型构建，以及它默认使用什么提示词和参数。可以把它理解成模型的配置说明书：基础模型仍由已有模型提供，Modelfile 为它添加一层定制配置。

本篇使用 `qwen2.5:7b` 创建一个面向 Python 代码生成的模型 `code-assistant`，并调用它生成 L2 归一化函数。

## 一、Modelfile 常用指令

| 指令 | 作用 |
| --- | --- |
| `FROM` | 指定要基于哪个已有模型构建，是必需项。 |
| `SYSTEM` | 设置模型默认遵循的系统提示词。 |
| `PARAMETER` | 设置模型默认运行参数，例如温度和上下文长度。 |
| `TEMPLATE` | 自定义发送给模型的提示词模板。 |
| `ADAPTER` | 加载与基础模型匹配的 LoRA 适配器。 |
| `LICENSE` | 记录模型使用的许可证内容。 |
| `MESSAGE` | 为模型添加示例对话。 |

常见采样参数中，`temperature` 控制生成随机性，值越低输出越稳定；`top_p` 控制候选词范围。参数只在需要时设置，未写入的设置使用模型默认值。

## 二、编写 Modelfile

项目中的 `agent_practice/app/blueprints/ollama/modelfile/Modelfile` 内容如下：

```dockerfile
# 使用的基础模型
FROM qwen2.5:7b

# 系统提示词
SYSTEM """
你是一个专业Python代码助手，请根据用户需求写代码，仅输出代码与代码注释，其余内容全部舍弃不输出。
"""

# 默认参数
PARAMETER temperature 0.2
PARAMETER top_p 0.8
```

这里，`FROM` 指定已经安装的 `qwen2.5:7b`；`SYSTEM` 将助手定位为 Python 代码助手；两个 `PARAMETER` 为新模型设置默认采样参数。三引号用于书写多行系统提示词。

## 三、创建自定义模型

在本机 Ollama 服务中创建模型时，`-f` 后面跟 Modelfile 的路径：

```bash
ollama create code-assistant -f ./Modelfile
```

若 Ollama 运行在 Docker 容器中，先把文件复制进容器，再在容器内执行创建命令：

```bash
docker cp app/blueprints/ollama/modelfile/Modelfile ollama:/root/Modelfile
docker exec -it ollama ollama create code-assistant -f /root/Modelfile
```

创建过程会读取基础模型并写入新的模型配置。下面是 Docker Desktop 的 Ollama 容器 **Exec** 中实际创建成功的输出；`success` 表示模型创建完成。

![Docker Exec 中创建 code-assistant 模型成功](/images/ai/ollama/ollama-modelfile-create.jpg)

## 四、运行自定义模型

创建完成后，可以通过 `ollama run` 交互使用，也可以在命令后附上提示词：

```bash
ollama run code-assistant "用 Python 和 NumPy 写一个简洁的 L2 归一化函数，只输出代码。"
```


![Docker Exec 中使用 code-assistant 生成 L2 归一化函数](/images/ai/ollama/ollama-modelfile-generate.jpg)

生成内容的主要部分如下：

```python
import numpy as np

def l2_normalize(x):
    """对输入数组进行 L2 归一化"""
    return x / np.sqrt(np.sum(x**2))
```

对于向量 `x`，L2 归一化会将它除以自身的欧几里得范数，使结果向量的长度为 1。

## 五、在 Python 项目中调用

项目提供了两个接口：创建自定义模型，以及用该模型生成文本。

```text
POST http://127.0.0.1:5000/ollama/modelfile/create
POST http://127.0.0.1:5000/ollama/modelfile/generate
```

创建模型时可以指定模型名；不传时使用 `code-assistant`：

```json
{
  "model": "code-assistant"
}
```

生成文本时传入提示词。模型名可省略，默认使用 `code-assistant`：

```json
{
  "prompt": "用 Python 和 NumPy 写一个 L2 归一化函数，只输出代码。"
}
```

业务层通过 Ollama Python SDK 的 `create()` 方法创建模型：

```python
response = get_client().create(
    model=model,
    from_=Conf.CHAT_MODEL,
    system=SYSTEM_PROMPT,
    parameters=MODEL_PARAMETERS,
)
```

`from_`、`system`、`parameters` 分别对应 Modelfile 中的 `FROM`、`SYSTEM` 和 `PARAMETER`。SDK 接收这些配置项，不接收 Modelfile 文件路径；因此代码里将同一组配置作为参数传入。创建后通过 `generate()` 调用自定义模型：

```python
response = get_client().generate(model=model, prompt=prompt)
return response.response
```

## 六、小结

```text
[x] FROM 指定自定义模型使用的基础模型
[x] SYSTEM 设置默认行为，PARAMETER 设置默认运行参数
[x] ollama create -f Modelfile 根据配置创建自定义模型
[x] ollama run 或 SDK generate 调用创建好的模型
```
