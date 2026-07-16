---
title: Effect Hook
date: 2022-01-01
tags:
  - React
  - Hook
  - useEffect
---

# Effect Hook

## 1、什么是副作用

和外部有交互如 引用外部变量、调用外部函数、修改dom、全局变量、ajax、计时器（依赖window.setTimeout、存储相关。

纯函数：相同的输入一定会得到相同的输出。

Effect Hook 可以在<font style="color:#FA8C16;">函数组件中</font>执行副作用操作。

## 2、useEffect 执行时机

- 初次渲染之后 `componentDidMount`（真实dom构建之后）
- 渲染更新之后 `componentDidUpdate`
- useEffect是异步的。在回调函数中拿到更新的state

## 3、存在清理函数

- 首次执行：render -> useEffect
- 再次执行：render -> 清理函数 -> useEffect
- 清理函数：组件更新、组件销毁时执行

### 组件更新

```javascript
import { useState, useEffect } from "react";
export default function App(props) {
  const [count, setCount] = useState(() => {
    console.log(1); // 惰性初始化，只会打印一次
    return 1;
  });
  useEffect(() => {
    // 持续递增
    console.log("useEffect");
    let timer = setInterval(() => {
      // 2. 每一次副作用都会重新初始化一个timer
      setCount(count + 1);
    }, 1000);
    return () => {
      clearInterval(timer); // 1.闭包 第二次运行时，先清理上一次的timer
      console.log("clear Effect");
    };
  });
  return (
    <>
      <h1>{count}</h1>
    </>
  );
}
```

### 组件销毁

```javascript
import { useState, useEffect } from "react";
function Test() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    console.log("useEffect");
    return () => {
      console.log("clear Effect"); // 组件更新、销毁时执行
    };
  });
  return (
    <>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>add</button>
    </>
  );
}
export default function App() {
  const [show, setShow] = useState(true);
  return (
    <>
      {show && <Test />}
      <button onClick={() => setShow(!show)}>changeShow</button>
    </>
  );
}
```

### 只在didMount时执行

- 指定当前effect函数所需要的依赖项
- 若依赖项是空数组，在初次渲染和卸载时执行
- 弱依赖项不变，effect不执行
- 存在依赖项并且依赖项更新时，effect执行

```javascript
import { useState, useEffect } from "react";
function Test() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    console.log("useEffect");
    let timer = setInterval(() => {
      // didMount时执行一次
      // setCount(count + 1) // 若在依赖项中未填入count，则此时count拿到的一直是0！
      // 但填入count依赖不能解决“只在didMount时执行”的问题
      // 改成回调的方式，能获取最新的count
      setCount((count) => count + 1);
    }, 1000);
    return () => {
      clearInterval(timer); // 组件销毁时执行，didMount时不执行
      console.log("clear Effect");
    };
  }, []); // 增加了依赖项
  return (
    <>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>add</button>
    </>
  );
}
export default function App() {
  const [show, setShow] = useState(true);
  return (
    <>
      {show && <Test />}
      <button onClick={() => setShow(!show)}>changeShow</button>
    </>
  );
}
```
