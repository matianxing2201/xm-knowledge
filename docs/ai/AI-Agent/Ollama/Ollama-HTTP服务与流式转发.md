---
date: 2026-10-22
title: Ollama 原生 HTTP API 与流式转发
tags:
  - AI
  - AI Agent
  - Ollama
  - HTTP API
---

# Ollama 原生 HTTP API 与流式转发

## 一、Ollama 原生 HTTP 接口

- `POST /api/chat`：对话
- `POST /api/generate`：补全
- `GET /api/tags`：模型列表
- 其它：`/api/show` `/api/ps` `/api/embeddings`

## 二、请求与响应结构

- messages / options 请求体
- 流式响应（SSE）的逐块返回

## 三、流式转发到前端

- 后端把 Ollama 的流式响应转发给客户端
- Server-Sent Events(SSE) 实现
- 逐 token 输出的示例

## 四、非流式与流式的取舍

## 五、小结

1. Ollama 原生 HTTP API 通过不同路径提供对话、文本生成和模型查看等能力。
2. 对话请求使用 `messages`，生成请求使用 `prompt`，两者都可以携带生成参数。
3. 开启流式响应后，Ollama 会分段返回结果；Flask 可以把这些内容包装成 SSE 转发给前端。
4. 是否使用流式，取决于界面是否需要边生成边显示；需要完整结果时可以使用普通响应。
