---
title: useReducer
date: 2026-07-09
tags:
  - React
  - Hook
  - useReducer
---

# useReducer

```javascript
const [state, dispatch] = useReducer(reducer, initial, init);
```

useState的替代方案。它接收一个`(state, action) => newState`的reducer，并返回当前的`state`及其配套`dispatch`方法。

**计数器案例**

```javascript
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </>
  );
}
```

## 惰性初始化

需要惰性的创建初始`state`，需要将`init`函数作为useReducer的第三个参数，这样初始化state将被设置为`init(initialArt)`。

```javascript
function init(initialCount) {
  return { count: initialCount };
}

function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return init(action.payload);
    default:
      throw new Error();
  }
}

function Counter({ initialCount }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);
  return (
    <>
      Count: {state.count}
      <button
        onClick={() => dispatch({ type: "reset", payload: initialCount })}>
        Reset
      </button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </>
  );
}
```

## 跳过dispatch

如果Reducer Hook 的返回值与当前的`state`相同，React将跳过子组件的渲染与副作用的执行（使用Object.is比较算法来比较state）。
