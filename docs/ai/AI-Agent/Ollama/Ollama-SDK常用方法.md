---
date: 2026-10-28
title: Ollama SDK 常用方法
tags:
  - AI
  - AI Agent
  - Ollama
---

# Ollama SDK 常用方法

前面的笔记使用 `chat` 和 `generate` 调用模型。本篇对应项目中的 `common_methods`，记录查看、创建、删除、拉取模型以及生成文本向量的方法。

所有方法通过 `get_client()` 获取同一个配置方式的客户端。当前聊天模型为 `qwen2.5:7b`，向量模型为 `all-minilm`，分别在 `Conf.CHAT_MODEL` 和 `Conf.EMBEDDING_MODEL` 中配置。

以下输出来自本机 Ollama 的实际调用；模型列表、运行状态和数字会随环境变化。为了便于阅读，部分结果只展示相关字段。

## 一、查看已安装和运行中的模型

`list()` 查看 Ollama 服务中已安装的模型，`ps()` 查看当前加载运行的模型：

```python
client = get_client()

installed = client.list()
running = client.ps()
```

项目的 `list_models()` 把两份结果转换为 JSON 可用的字典，分别放在 `installed` 和 `running` 中：

```python
return {
    "installed": client.list().model_dump(mode="json"),
    "running": client.ps().model_dump(mode="json"),
}
```

对应接口：

```text
GET http://127.0.0.1:5000/ollama/methods/models
```

拉取向量模型后，从实际返回中提取的模型名和大小为：

```text
list_models: [('all-minilm:latest', 45960996), ('qwen2.5:7b', 4683087332)]
```

`size` 的单位是字节。做向量化之前，`running` 曾返回 `{"models": []}`；调用向量化后，再次查看运行状态，可以看到加载中的模型（以下为字段摘录）：

```json
{
  "models": [
    {
      "model": "all-minilm:latest",
      "size": 49387928,
      "size_vram": 0,
      "context_length": 256
    }
  ]
}
```

在 Docker Desktop 的 Ollama 容器 **Exec** 中，也可以用 `ollama list` 和 `ollama ps` 查看同一服务。命令行以表格展示，格式与上面的 SDK 返回不同：

![Docker Exec 中查看已安装模型和运行中的模型](/images/ai/ollama/ollama-common-list-ps.jpg)

模型已经安装，不代表它一直加载在内存中；`ps()` 的结果会随模型是否正在运行而变化。

## 二、查看模型详情 `show`

`show()` 根据模型名读取模型详情：

```python
response = get_client().show(model="qwen2.5:7b")
print(response.model_dump(mode="json"))
```

对应接口：

```text
GET http://127.0.0.1:5000/ollama/methods/models/qwen2.5:7b
```

本机 `qwen2.5:7b` 的实际返回中，`details` 包含以下信息（字段摘录）：

```json
{
  "details": {
    "format": "gguf",
    "family": "qwen2",
    "parameter_size": "7.6B",
    "quantization_level": "Q4_K_M"
  },
  "parameters": null
}
```

Docker Exec 中执行 `ollama show qwen2.5:7b`，可以看到同一模型的架构、参数规模和量化信息：

![Docker Exec 中查看 qwen2.5:7b 模型详情](/images/ai/ollama/ollama-common-show.jpg)

接口还可能返回模板、许可证和其他模型信息；具体字段取决于模型。

## 三、文本向量化 `embed`

项目使用 `Conf.EMBEDDING_MODEL` 指定向量模型，调用 `embed` 后取第一段输入对应的向量：

```python
response = get_client().embed(
    model=Conf.EMBEDDING_MODEL,
    input=text,
)
return list(response.embeddings[0])
```

`embeddings` 是向量列表；当前接口接收一段文本，所以取第一个向量并放到返回 JSON 的 `embedding` 字段中。

```text
POST http://127.0.0.1:5000/ollama/methods/embed
```

```json
{
  "input": "你好"
}
```

使用 `all-minilm` 对“你好”进行实际调用，终端中打印向量长度和前五个数值：

```text
embedding_dimensions: 384
embedding_first_five: [0.004169383, 0.015250988, 0.08021433, 0.001120034, 0.015079128]
```

完整接口结果包含全部 384 个数值，上面只摘取前五个。使用前需确保 Ollama 服务中已安装配置的向量模型，例如在运行 Ollama 的环境中执行 `ollama pull all-minilm`。

## 四、创建模型 `create`

`create()` 可以基于已有模型创建新的模型配置：

```python
response = get_client().create(
    model=model,
    from_=base_model or Conf.CHAT_MODEL,
    system=system,
)
```

`model` 是新模型名称，`from_` 指定基础模型，`system` 是可选的系统提示词。项目接口使用 JSON 字段 `from`；如果没有传入，就使用 `Conf.CHAT_MODEL`。

```text
POST http://127.0.0.1:5000/ollama/methods/models/create
```

```json
{
  "model": "demo-assistant",
  "from": "qwen2.5:7b",
  "system": "请简洁回答问题"
}
```

本次使用一个新建的临时模型实际调用，创建成功后的返回为：

```text
create_model: {'status': 'success', 'completed': None, 'total': None, 'digest': None}
```

## 五、删除模型 `delete`

`delete()` 接收模型名并删除该模型：

```python
response = get_client().delete(model=model)
return response.model_dump(mode="json")
```

```text
DELETE http://127.0.0.1:5000/ollama/methods/models/demo-assistant
```

本次只删除了刚创建的临时模型，实际返回：

```text
delete_model: {'status': 'success'}
```

调用时将路径中的名称替换为要删除的模型名。`qwen2.5:7b` 等已有模型没有在本次演示中删除。

## 六、拉取模型 `pull`

`pull()` 从模型仓库拉取模型。普通模式等待完成后返回结果；设置 `stream=True` 可以逐条查看进度：

```python
for progress in get_client().pull(model="all-minilm", stream=True):
    print(progress.model_dump(mode="json", exclude_none=True))
```

```text
POST http://127.0.0.1:5000/ollama/methods/models/pull
```

```json
{
  "model": "all-minilm",
  "stream": true
}
```

实际流式调用中，按状态变化抽取的部分返回为：

```json
{"status": "pulling manifest"}
{"status": "verifying sha256 digest"}
{"status": "writing manifest"}
{"status": "success"}
```

下图是在 Docker Exec 中执行 `ollama pull all-minilm` 的实际结果。命令行展示进度条，项目接口则返回上面这种 JSON 进度事件：

![Docker Exec 中拉取 all-minilm 并完成校验](/images/ai/ollama/ollama-common-pull.jpg)

下载层数据时还会返回 `completed` 和 `total`，可用于观察进度。项目的 HTTP 接口会将每条进度包装成 SSE 事件，并在结束时发送 `data: [DONE]`。

## 七、小结

```text
[x] list 查看已安装模型，ps 查看正在运行的模型
[x] show 查看模型定义和详情
[x] embed 将文本转换为向量
[x] create 基于已有模型创建新模型，delete 删除指定模型
[x] pull 拉取模型，可通过流式响应查看进度
```
