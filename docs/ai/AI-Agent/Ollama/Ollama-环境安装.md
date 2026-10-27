---
date: 2026-10-22
title: Ollama 环境安装
tags:
  - AI
  - AI Agent
  - Ollama
  - 环境搭建
---

# Ollama 环境安装

Ollama 系列的第一篇，目标是先把本地模型运行环境搭起来。

这是基于官方的使用方式，加上我自己踩坑整理出来的。

---

# 一、Ollama 是什么

Ollama 是一个**开源、跨平台**的大模型本地部署工具。

```text
一句话
    ↓
在本地跑各种开源大语言模型
    ↓
不需要连云端 API
```

- 官网：<https://ollama.com/>
- 模型列表：<https://ollama.com/library>

对我们后面的知识库、Agent 来说，能本地起模型意味着：

- 数据不出本机，适合隐私场景
- 一条命令拉起模型，不用繁琐的配置
- 对话、补全、嵌入、工具调用都能覆盖

---

# 二、安装方式

Ollama 支持多种方式安装，按平台选一种就好。

## 直接安装

```text
Windows
    ↓
https://ollama.com/download

Mac
    ↓
brew install ollama

Linux
    ↓
curl -fsSL https://ollama.com/install.sh | sh
```

## 用 Docker 安装（重点）

如果要隔离环境，或者想用 GPU，Docker 方式是用的比较多的。

> 我这里用的是国内镜像源，直接 pull 官方镜像一般也没问题。

```bash
# 拉取 ollama 镜像
docker pull docker.m.daocloud.io/ollama/ollama:latest

# 取别名（后面好写 ollama/ollama）
docker tag docker.m.daocloud.io/ollama/ollama:latest ollama/ollama:latest

# 启动 Ollama 容器
docker run -d \
  --gpus=all \
  -e OLLAMA_REGISTRY_MIRROR=https://ollama.modelscope.cn \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  ollama/ollama
```

几个参数值得记一下：

```text
--gpus=all
    ↓
把宿主机的 GPU 全部给容器用

-e OLLAMA_REGISTRY_MIRROR=...
    ↓
换国内模型源（模型服务下载加速）

-v ollama:/root/.ollama
    ↓
数据卷，模型下载下来后容器删了也不会丢

-p 11434:11434
    ↓
暴露默认端口
```

### 进入容器并跑模型

```bash
# 进入容器
docker exec -it ollama bash

# 查看 nvidia 显卡
nvidia-smi

# 拉取模型
ollama pull qwen2.5:7b

# 运行模型
ollama run qwen2.5:7b
```

### 容器日常管理

```bash
# 查看容器状态
docker ps

# 停止
docker stop ollama

# 重启
docker restart ollama

# 看日志（排查 GPU / 模型下载报错）
docker logs ollama
```

---

# 三、常用命令

装完之后最常用的就这么几个：

```bash
# 查看版本
ollama --version

# 启动 Ollama 服务
ollama serve

# 运行模型
ollama run 模型名

# 拉取模型
ollama pull 模型名

# 列出本地模型
ollama list
```

网页查看服务状态：

```text
http://localhost:11434
```

---

# 四、几个容易踩的坑

`ollama serve` 和 `ollama run` 的区别，第一次容易混。

```text
serve
    ↓
启动后台服务（相当于起服务端）
    ↓
通常是常驻的

run
    ↓
拉起一个模型并进入交互对话
```

还有：

- 用 Docker 装了之后，`ollama` 命令要在**容器里**跑，除非另外装客户端
- GPU 报错先看 `docker logs ollama`，别一上来怀疑镜像问题

---

# 五、Python SDK

后续笔记会在 Python 代码里调用 Ollama，先装好 SDK。

```bash
pip install ollama
```

---

# 六、小结

到这一步，Ollama 环境就算搭起来了：

```text
[x] 了解 Ollama 是什么
[x] 本地安装（Mac / Windows / Linux）
[x] Docker 部署 Ollama
[x] 进容器拉取并运行 qwen2.5:7b
[x] 常用命令 serve / run / pull / list
[x] 安装 Python SDK
```

下一篇先整理[共用的模型配置与客户端封装](./Ollama-配置与客户端.md)，再进入[基础对话与参数配置](./Ollama-基础对话与参数配置.md)。
