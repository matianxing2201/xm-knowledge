---
title: Vite 独有钩子
date: 2026-07-08
tags:
  - Vite
  - 钩子
  - 插件
---

# Vite 独有钩子

## config

在解析`Vite`配置前调用。`args1`接收原始用户配置 `arg2`描述配置环境的变量(mode,command)。返回一个将被深度合并到现有配置中的部分配置对象，或直接改变配置。

> 根据不同的开发环境 配置不同的baseUrl简单案例

```typescript
export default function envConfigPlugin() {
  return {
    name: "env-config",
    config(config, { mode }) {
      const envConfig = {
        // 开发环境配置
        development: {
          define: {
            __API_BASE__: JSON.stringify("https://dev.api.xxx"),
          },
          build: {
            sourcemap: true,
          },
        },
        // 生产环境配置
        production: {
          define: {
            __API_BASE__: JSON.stringify("https://api.xxx"),
          },
          build: {
            sourcemap: false,
            minify: "terser",
          },
        },
        // 测试环境配置
        test: {
          define: {
            __API_BASE__: JSON.stringify("https://test.api.xxx"),
          },
        },
      };

      return envConfig[mode] || {};
    },
  };
}
```

```typescript
import envConfigPlugin from "./vite-plugin-env-config";

export default {
  plugins: [envConfigPlugin()],
};
```

## configResolved

在解析`Vite`配置后调用。作用是读取和存储最终的解析配置

> 分析构建配置并生成构建信息

```typescript
// vite-plugin-config-analyzer.js
export default function configAnalyzerPlugin() {
  return {
    name: "config-analyzer",
    configResolved(resolvedConfig) {
      console.log("==== 构建配置分析报告 ====");
      console.log("构建模式:", resolvedConfig.mode);
      console.log("入口文件:", resolvedConfig.build.rollupOptions.input);
      console.log("输出目录:", resolvedConfig.build.outDir);
      console.log(
        "启用的插件:",
        resolvedConfig.plugins.map((p) => p.name),
      );

      // 可以写入文件或发送到监控系统
      if (resolvedConfig.build.lib) {
        console.log("库模式配置:", resolvedConfig.build.lib);
      }
    },
  };
}
```

## configureServer

用于配置开发服务器钩子。通常用于在应用程序中添加自定义中间件

> mock api 使用类似koa中间件的用法

```typescript
export default function mockApiPlugin() {
  return {
    name: "mock-api",
    configureServer(server) {
      // 模拟用户数据API
      server.middlewares.use("/api/users", (req, res) => {
        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET") {
          res.end(
            JSON.stringify([
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" },
            ]),
          );
        } else if (req.method === "POST") {
          // 模拟创建用户
          res.statusCode = 201;
          res.end(JSON.stringify({ id: 3, name: "New User" }));
        }
      });

      // 模拟产品数据
      server.middlewares.use("/api/products", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify([
            { id: 1, name: "Product A", price: 99.99 },
            { id: 2, name: "Product B", price: 199.99 },
          ]),
        );
      });
    },
  };
}
```

`configureServer`钩子在内部中间件安装前调用，自定义中间件将会比内部中间件<font style="color:#ED740C;">早</font>运行。如果希望在内部中间件之后执行，可以通过<font style="color:#ED740C;">返回一个函数</font>，那么这个中间件将会在内部中间件执行后被调用。

```typescript
const myPlugin = () => ({
  name: "configure-server",
  configureServer(server) {
    // 返回一个在内部中间件安装后
    // 被调用的后置钩子
    return () => {
      server.middlewares.use((req, res, next) => {
        // 自定义请求处理...
      });
    };
  },
});
```

## configurePreviewServer

与configureServer相同，但用于预览服务器。

> 在预览构建结果是，添加一些安全相关的HTTP头

```typescript
export default function securityHeadersPlugin() {
  return {
    name: "security-headers",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "default-src 'self'");
        next();
      });
    },
  };
}
```

## transformIndexHtml

转换`index.html`的专用钩子。钩子接收当前HTML字符串，它是一个异步钩子，可以返回

1. 经过转换的HTML 字符串
2. 注入到先用HTML中的标签描述符对象数组
3. 包含 html, tags 的对象

```typescript
const htmlPlugin = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html) {
      return html.replace(
        /<title>(.*?)<\/title>/,
        `<title>Title replaced!</title>`,
      );
    },
  };
};
```

## handleHotUpdate

执行自定义 HMR 更新处理。钩子接收一个带有一下签名的上下文对象

```typescript
export default function customHmrPlugin() {
  return {
    name: 'custom-hmr',
    handleHotUpdate({ file, server }) {
      // 返回一个孔数组，想客户端发送自定义事件，来进行自定义的HMR处理
      if (file.endsWith('config.json')) {
        console.log('配置文件已更新，发送自定义事件')
        server.ws.send({
          type: 'custom',
          event: 'config-update',
          data: { file }
        })
        return [] // 阻止默认的HMR行为
      }

      // 处理store文件变化
      if (file.includes('/store/')) {
        console.log('store已更新，重新加载页面')
        server.ws.send({
          type: 'full-reload',
          path: '*' // 强制完全刷新
        })
        return []
      }
  }
}
```

```typescript
if (import.meta.hot) {
  import.meta.hot.on("config-update", (data) => {
    // 执行自定义更新
  });
}
```
