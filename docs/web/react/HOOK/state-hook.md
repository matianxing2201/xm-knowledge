---
title: State Hook
date: 2022-01-01
tags:
  - React
  - Hook
  - useState
---

# State Hook

## 1、`Hook`是什么

`Hook`是一个特殊的函数，它可以"钩入"`React`的特性，如`useState`是允许再`React`函数组件仲添加`state`的`Hook`。

当在写函数组件时，需要向里面添加一些`state`，在`React16.8`以前必须将其转化为`class`，现在可以在现有的函数组件中，使用`Hook` 如下：

```javascript
import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>count:{count}</p>
      <button onClick={() => setCount(count + 1)}>click add</button>
    </div>
  );
}
```

![useState 原理图](/images/web/react/hook-state-hook-1.png)

## 2、注意事项

### 第二个参数函数指向的引用相同

更新方式：函数组件中state变化时才重新渲染（`React`使用`Object.is`全值相等来比较`state`的值）。

```javascript
window.arr = [];
function App() {
  const [count, setCount] = useState(0);
  window.arr.push(setCount);
  console.log(window.arr);
  return (
    <div>
      <p>count:{count}</p>
      <button onClick={() => setCount(count + 1)}>click add</button>
    </div>
  );
}
```

![setCount 引用相同](/images/web/react/hook-state-hook-2.png)

### 强制更新

- 函数组件react

```javascript
import { useState } from "react";
window.arr = [];
// create react app是基于webpack（模块化打包工具），如果用var声明arr，arr只是在当前文件夹，并不是在全局
// 要想在全局访问arr需要添加到window上
export default function App(props) {
  const [, setCount] = useState({});
  window.arr.push(setCount);
  console.log("全局的arr", window.arr);
  return (
    <>
      <button onClick={() => setCount({})}>click</button>
    </>
  );
}
```

- 类组件中，this.setState传任何值都会刷新组件
- 类组件可以用this.forceUpdate()进行强制更新，不会经过shouldComponentUpdate生命周期

### 函数更新和不同返回值的更新

```javascript
类组件;
import { useState } from "react";

export default function App(props) {
  const [count, setCount] = useState(0);
  const onClick = () => {
    setCount(count + 1);
    console.log("初始状态", count); // 第一次点击：打印0（上一次的值而不是最新的返回值）
    setCount(count + 1); // 因此，即使在这里执行多次，更新后count都为1
  };
  console.log("最新状态", count); // 第一次点击：打印1
  return (
    <>
      <h1>{count}</h1>
      <button onClick={onClick}>click</button>
    </>
  );
}
```

```javascript
函数组件;
import { useState } from "react";
export default function App(props) {
  const [count, setCount] = useState(+0);
  const onClick = () => {
    setCount((count) => count + 1); // 闭包，用最新的count进行更新
    setCount((count) => count + 1);
    console.log("初始状态", count); // 第一次点击：打印0（上一次的值而不是最新的返回值）
  };
  console.log("最新状态", count); // 第一次点击：打印2 (点击时递增了2次)
  return (
    <>
      <h1>{count}</h1>
      <button onClick={onClick}>click</button>
    </>
  );
}
```

### 类组件state状态会合并，函数组件useState不会合并

- 多个 setCount 执行多次，但最终值 render 一次
- 类组件：返回值合并（ state 的多个属性合并），函数组件中不会合并，直接 setCount 的参数更新

```javascript
import { useState } from "react";
export default function App(props) {
  const [count, setCount] = useState({ num1: 1 });
  const onClick = () => {
    setCount({ new: 2 });
  };
  console.log("更新后", count);
  return (
    <>
      <h1>{count.num1}</h1>
      <button onClick={onClick}>click</button>
    </>
  );
}
```

### 所有Hook不能再if switch for 中使用

### Hook必须写在最开始的位置

### 惰性初始state

`initialState`参数只会再组件的初始渲染时起作用，后续渲染时会被忽略。

```javascript
const [count, setCount] = useState(() => {
  	const sth = doSth...    值只计算一次
    console.log(1); // 惰性初始化，只会打印一次
    return sth
});

```
