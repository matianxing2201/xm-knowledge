---
date: 2026-10-22
title: Ollama 函数调用（Function Calling）
tags:
  - AI
  - AI Agent
  - Ollama
  - Function Calling
---

# Ollama 函数调用（Function Calling）

## 一、为什需要 Function Calling

- 让模型决定「要不要调用工具」以及「怎么调」

## 二、Ollama 的工具支持

- 通过 messages 里的 `tools` 声明可用工具
- Ollama 支持 `tools` 传参

## 三、calculator 示例

- 定义一个加法 / 计算工具
- 调用流程：模型返回 tool_calls -> 程序执行工具 -> 结果回传
- 完整多轮工具调用代码

## 四、工具结果如何回填给模型

## 五、与自定义模型 Modelfile 结合

## 六、小结

1. 在请求中通过 `tools` 描述模型可以使用的工具及其参数。
2. 模型根据对话决定是否发起工具调用，并在 `tool_calls` 中返回调用信息。
3. 工具代码由应用程序执行；Ollama 不会替应用运行本地函数。
4. 程序将执行结果作为工具消息放回对话，再次请求模型整理最终回复。
