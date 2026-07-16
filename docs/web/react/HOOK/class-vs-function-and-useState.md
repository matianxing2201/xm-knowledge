---
title: 类组件与函数组件与useState
date: 2026-07-09
tags:
  - React
  - Hook
  - useState
---

# 类组件与函数组件与useState

## 类组件与函数组件概述

- **类组件**：基于面向对象编程思想构建的组件体系，用于更好地组织组件代码。
- **函数组件**：基于函数式编程构建组件的方式，旨在增加组织组件代码的自由度。

## 类组件的侧重点与优缺点

<font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">面向对象的编程，包括对象的创建、继承和复用。</font>

**<font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">优点</font>**<font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">：</font>

    - **内部状态**：通过`this.state`管理组件内部状态。
    - **完整的生命周期**：提供从挂载到卸载等完整的生命周期方法。
    - **单独的render函数**：明确区分组件的渲染逻辑。

**缺点**：

    - **逻辑抽离限制**：类组件的方法逻辑通常与组件紧密绑定，难以抽离。
    - **this与生命周期复杂性**：需要处理this的指向问题，生命周期方法众多且复杂。
    - **状态复用困难**：类组件的状态难以在不同组件间复用。

## 函数式组件的侧重点与优缺点

面向函数式的编程，强调函数的执行和返回。

**优点**：

    - **简洁性**：函数组件一次执行一次返回，逻辑清晰。
    - **逻辑抽离自由**：使用Hooks等特性，可以更加自由地抽离组件逻辑。
    - **性能需求低**：函数式编程通常对性能要求较低。

**缺点**：

    - **无内部状态**：函数组件本身不维护状态（但可通过Hooks如useState实现）。
    - **生命周期不完整**：函数组件不支持某些生命周期方法（如componentDidCatch）。
    - **重渲染**：每次函数执行都会触发重渲染，但React的Diff算法可以优化性能。

## <font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">函数组件与类组件的相互调用</font>

- <font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">函数组件和类组件在React应用中是可以相互调用的。</font>
- <font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">函数组件可以作为类组件的子组件使用，也可以被类组件的方法调用。</font>
- <font style="color:rgb(5, 7, 59);background-color:rgb(253, 253, 254);">类组件同样可以作为函数组件的子组件，或在函数组件中通过React Hooks调用类组件的逻辑。</font>

```jsx
class MyClassComponent extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}
```

## useState

```jsx
import React, { useState } from 'react';

function MyFunctionComponent() {
  // [状态, 设置状态的方法]
  // 设置状态的方法 set...

  // setState(value)
  // setState(() => state)
  // state： 只读的
  // 1. 必须通过setState进行state的设置
  // 2. 设置值的时候一定要注意：必须是新值或新引用
  //    React对比值，只会浅对比
  const [count, setCount] = useState(0);
  const [info, setInfo] = useState({ name: 'xiaoma })
  const [numArr, setNumArr] = useState([1, 2, 3])

  // const increment = () => {
  //   setCount(count + 1);
  // };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={ () => setCount(1) }>Increment</button>
      <button onClick={ () => setCount(count => count + 1)}>Increment</button>

      <p>{info.name}</p>
      <button onClick={ () => setInfo((info) => {name: 'zhangsan'} ) }>setInfo</button>

      <p>{numArr}</p>
      {/* × push返回值是 跟新后的长度 */}
      <button onClick={ () => setNumArr(numArr => numArr.push(4)) }></button>
      <button onClick={ () => setNumArr(numArr => [...numArr, 4]) }></button>
    </div>
  );
}
```
