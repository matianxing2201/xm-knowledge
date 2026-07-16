---
title: 初识React
date: 2026-07-09
tags:
  - React
---

# 初识React

# 1、认识React

`<font style="color:#FA8C16;">React</font>` 是一个用于构建用户界面的 `<font style="color:#FA8C16;">JavaScript</font>` 库 不是 框架 。

## React主观意愿

- React 仅仅负责View层渲染。
- React 是一个视图渲染的工具库，不做框架的事情。

# 2、简单使用

- 添加根容器 `<div id='app'></div>`
- 引入 CDN 脚本

```javascript
<!-- 开发环境 -->
  <script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
	<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
<!-- 生产环境 -->
  <script crossorigin src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
	<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
```

- 创建React组件

React -> React API - 处理视图的 API 集合

ReactDom -> 从 render -> 虚拟DOM -> 真实 DOM

```javascript
class MyButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openStatus: false,
    };
  }
  render() {
    return "视图";
  }
}

var span = React.createElement(
  "span",
  {
    className: "span",
    key: 1,
  },
  "this is span",
);

ReactDOM.render(
  React.createElement(
    "div",
    {
      "data-tag": "div",
    },
    [span],
  ),
  document.getElementById("app"),
);
```

# 3、工程化创建

- 创建React 17.0.2版本要求 Node>= 10.16 NPM>= 5.6
- npx create-react-app my-react-app
  1. npx npm5.2 + 的包运行工具
  2. create-react-app 内部的工程化：babel/Webpack

# 4、总结

- 一个 React 组件
  1. 继承 `<font style="color:#FA8C16;">React.Component</font>`
  2. `<font style="color:#FA8C16;">render</font>` 函数返回一个视图

- 2、只负责渲染视图，其余的不做
