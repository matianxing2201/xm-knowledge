---
title: 代码分割之lazy:Suspense与路由懒加载
date: 2026-07-09
tags:
  - React
  - 代码分割
  - lazy
  - Suspense
---

# 代码分割之lazy:Suspense与路由懒加载

## 1、lazy 内置方法 Suspense 内置组件

- lazy 是 React 提供的懒（动态）加载组件的方法，`<font style="color:#FA8C16;">React.lazy()</font>`。
- 能减少打包体积、延迟加载首屏不需要渲染的组件。
- 依赖内置组件 Suspense：给 lazy 加上 loading 指示器组件的一个容器组件。
- Suspense 目前只给 lazy 组件配合实现组件等待加载指示器的功能。
- React.lazy 接收一个函数，这个函数需要动态调用 import()。它必须返回一个 Promise，该 Promise 需要 resolve 一个 `<font style="color:#FA8C16;">default export</font>` 的 React 组件。所以要用类返回 render 而不是函数。

> **<font style="background-color:#FCFCCA;">注意</font>**<font style="background-color:#FCFCCA;">：</font>
>
> <font style="background-color:#FCFCCA;">React.lazy 和 Suspense 技术还不支持服务端渲染。在服务器渲染的应用中使用的话 使用 </font><font style="color:rgb(0, 0, 0);background-color:#FCFCCA;"> </font>[<font style="background-color:#FCFCCA;">Loadable Components</font>](https://github.com/gregberge/loadable-components)<font style="color:rgb(0, 0, 0);background-color:#FCFCCA;"> 这个库。</font>

`<font style="color:#FA8C16;">React.lazy</font>` 函数可以像渲染常规组件一样处理动态引入（的组件）。

**使用之前：**

```javascript
import MyMain from "./MyMain";
```

    **使用之后：**

```javascript
const MyMain = React.lazy(() => import("./MyMain"));
```

    `<font style="color:#FA8C16;">React.lazy</font>` 接收一个函数，这个函数需要动态调用 `<font style="color:#FA8C16;">import()</font>`。它必须返回一个 `<font style="color:#FA8C16;">Promise</font>` ，该Promise 需要 resolve 一个 `<font style="color:#FA8C16;">default</font>` export 的 React 组件。

然后应在 `<font style="color:#FA8C16;">Suspense</font>` 组件中渲染 lazy 组件，如此使我们可以使用在等待加载 lazy 组件时做优雅降级（如 loading 指示器等）。

```javascript
import React, { Component, Suspense, lazy } from "react";
import Loading from "./Loading";

const MyMain = lazy(() => import("./Main"));
class App extends Component {
  render() {
    return (
      <div>
        <Suspense fallback={<Loading />}>
          <MyMain />
        </Suspense>
      </div>
    );
  }
}
```

    `<font style="color:#FA8C16;">fallback</font>` 属性接收任何在组件加载过程中需要展示的 React 元素。 `<font style="color:#FA8C16;">Suspense</font>` 组件 放置于懒加载组件之上的任何位置。也可以用一个 `<font style="color:#FA8C16;">Suspense</font>` 组件包裹多个懒加载组件

## 2、路由懒加载

- <font style="color:#FA8C16;">npm i react-router react-router-dom</font>
- 本地调试时，path和文件名相同，会变成访问文件

```javascript
import Loading from "./loading";
import React, { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { Switch, Route } from "react-router";
const MyMain = lazy(() => import("./main.jsx"));
function App() {
  return (
    <div>
      {/* 注意 fallback这里是组件 */}
      <Suspense fallback={<Loading />}>
        <div>
          <MyMain />
          <Switch>
            <Route
              path="/mypage1"
              component={lazy(() => import("./page1.jsx"))}
            />
            <Route
              path="/mypage2"
              component={lazy(() => import("./page2.jsx"))}
            />
          </Switch>
        </div>
      </Suspense>
    </div>
  );
}

// 路由懒加载
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("app"),
);
```
