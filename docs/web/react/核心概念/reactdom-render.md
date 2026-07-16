---
title: 渲染元素ReactDOM.render
date: 2022-01-01
tags:
  - React
  - ReactDOM
---

# 渲染元素ReactDOM.render

## 1、ReactDOM.render

- **参数1** React 元素（<font style="color:#FA8C16;">React.createElement(类组件/函数组件) or <类组件/函数组件 /> or JSX 语法组件</font>) 包裹后函数组件才会执行
- **参数2** 根节点

### 如果是组件渲染

`<font style="color:#FA8C16;">ReactDOM.render</font>` 的第一个参数<font style="color:#FA8C16;">一定</font>要是 `<font style="color:#FA8C16;">React</font>` 元素

- 组件使用 JSX 语法
- 使用 `<font style="color:#FA8C16;">React.createElement</font>` 将组件转换成 React 元素

这样才能使组件内部的 render 函数执行

函数组件才能执行

## 2、基本的更新逻辑

- React 元素是不可变的对象 immutable Object
- 不能添加属性
- 不能修改属性（深度的可以变）
- 不能删除属性
- 不能修改属性的枚举、配置、可写（<font style="color:#FA8C16;">enumerable/configrable/writable</font>）

## 3、虚拟DOM的对比

> `<font style="color:#FA8C16;">ReactDOM.render</font>` 会深度对比新旧元素的状态，只会做必要的真实 DOM 更新

- 渲染之前 -> 每个 React 元素组成一个虚拟 DOM 的对象结构 -> 渲染
- 更新之前 -> 形成新的虚拟 DOM 对象 -> 对比新旧虚拟 DOM 节点 -> 分析出两者不同处 -> 形成一个 DOM 更新的补丁 -> 操作真实 DOM

```javascript
function update() {
  const rEl = (
    <div>
      <h1>以下显示时间</h1>
      <h2>{new Date().toString()}</h2>
    </div>
  );
  ReactDOM.render(rEl, document.getElementById("app"));
}
setInterval(update, 1000);
```

## 总结

```javascript
function Title() {
  return <div>This is a title</div>;
}

ReactDom.render(
  //<Title />
  // Title,   错误的写法 不能是类组件
  React.createElement(Title),
  document.getElementById("app"),
);
```

如果是组件渲染，`ReactDOM.rener` 的第一个参数一定要是一个React元素。

- 组件使用JSX语法
- 使用`React.createElement`将组件转化为React元素

这样才能使组件内部的`render`函数执行，函数组件才能执行
