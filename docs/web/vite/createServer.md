---
title: createServer
date: 2026-07-08
tags:
  - Vite
  - DevServer
  - 源码
---

# createServer

> 入口文件在packages/vite/src/node/cli.ts 不是通常的index文件当做入口

```vue
const cli = cac('vite')
```

![Vite createServer 架构图](/images/web/vite/web-vite-createServer-01.png)

createServer -> \_createServer(门面模式)

## 配置解析与准备

1. 调用 resolveConfig 解析传入的配置，得到最终的config
2. 异步初始化 public 目录下的静态文件（initPublicFiles）
3. 解析 HTTPS、输出目录、文件监听等相关配置

![配置解析流程](/images/web/vite/web-vite-createServer-02.png)

## 服务端基础设施初始化

1. 创建 Connect 中间件实例 middlewares
2. 根据 middlewareMode 决定是否创建原生 HTTP 服务器 (httpServer)
3. 创建 WebScoket 服务(ws), 用户 HMR 通信

![服务端基础设施](/images/web/vite/web-vite-createServer-03.png)

## 文件监听器初始化

配置并创建 Chokidar 文件监听器 watcher，监听项目根目录、配置依赖、环境变量文件和 public 目录等

![文件监听器](/images/web/vite/web-vite-createServer-04.png)

## 环境(Environment)初始化

遍历 config.environments，为每个环境调用 createEnvironment 创建环境实例(如client、ssr)

调用每个环境的 init 方法，传入 watcher 和前一个环境实例，实现热重载和状态继承

![环境初始化](/images/web/vite/web-vite-createServer-05.png)

## 兼容性与插件容器

1. 创建 ModuleGraph 实例，兼容旧版 API
2. 创建插件容器 plugincontainer，用于运行插件钩子

![插件容器](/images/web/vite/web-vite-createServer-06.png)

## 关闭与重启相关逻辑

1. 定义 closeServer 方法，确保关闭服务器是清理所有资源
2. 支持服务器重启和端口变更

![关闭重启逻辑](/images/web/vite/web-vite-createServer-07.png)

## ViteDevServer 实例组装

1. 构造 server 对象，挂载各种方法（如 transform、ssrLoadModule、listen、close、resetart、openBrowser 等）
2. 用 Proxy 包装，保证重启后属性引用一致

![ViteDevServer 实例组装](/images/web/vite/web-vite-createServer-08.png)

![ViteDevServer 方法绑定](/images/web/vite/web-vite-createServer-09.png)

## 插件钩子与中间件链路

1. 按序挂载内置中间件（如 CORS、host效验、静态资源、transform、HTML fallback、错误处理等）
2. 执行所有插件的 configureServer 钩子，云溪插件自定义服务器行为

## 文件监听事件处理

1. 监听文件的 add、unlink、change 时间，触发热更新、缓存失效、public 资源同步等逻辑

## 服务启动前的初始化

1. 在非 middleware 模式下，重写 httpserver.listen， 确保在监听端口前完成必要的初始化（如 optimizer）

## 返回 server 实例
