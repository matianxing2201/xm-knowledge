---
title: 错误边界与使用技巧
date: 2026-07-09
tags:
  - React
  - 错误边界
---

# 错误边界与使用技巧

1. React16 增加。
2. 防止某个组件的 UI 渲染错误导致整个应用崩溃。
3. 子组件发生 JS 错误，有备用的渲染 UI。
4. 错误边界时组件，只能 用 class 组件来写。

## 1、错误边界组件捕获错误的时机

- 渲染时
- 生命周期函数中
- 组件树的构造函数中

## 2、getDerivedStateFromError

生命周期函数 static getDerivedStateFromError(error)

**参数**：子组件抛出的错误

**返回值**：新的 state

渲染阶段调用

**作用**：不允许出现副作用（异步代码、操作 dom 等）

## 3、componentDidCatch

- 生命周期函数
- 组件原型上的方法
- 边界组件捕获异常，并进行后续处理
- **作用**：错误信息获取，运行副作用
- 在组件抛出错误后调用
- **参数**：error（抛出错误）、info（组件引发错误相关的信息，即组件站）

## 4、无法捕获的场景

- 事件处理函数（无法显示备用UI）

```javascript
function Btn() {
  const handleClick = () => {
    console.log("click");
    throw new Error("click throw err");
  };

  return <div onClick={handleClick}>点击</div>;
}

<ErrorBoundary>
  <Btn />
</ErrorBoundary>;
```

- 异步 setTimeout、ajax、requestAnimationFrame 回调函数

```javascript
function Btn() {
  const err = () => {
    setTimeout(() => {
      throw new Error("抛出错误");
    });
  };

  err();

  return <div>内容</div>;
}

<ErrorBoundary>
  <Btn />
</ErrorBoundary>;
```

- 服务端渲染
- 错误边界组件（ErrorBoundary）内部有错误

> <font style="background-color:#FCFCCA;">以上几种情况有可能导致整个 React 组件被卸载</font>

<font style="background-color:#FCFCCA;"></font>

## 5、演示

如果一个 class 组件中定义了 `<font style="color:#FA8C16;">static getDerivedStateFromError()</font>` 或 `<font style="color:#FA8C16;">componentDidCatch()</font>` 这两个生命周期方法中的任意一个（或两个）时，那么它就变成一个错误边界。当抛出错误后，使用 `<font style="color:#FA8C16;">static getDerivedStateFromError()</font>` 渲染备用 UI，使用 `<font style="color:#FA8C16;">componentDidCatch()</font>` 打印错误信息。

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器
    logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

    然后使用常规组件去使用：

```javascript
<ErrorBoundary>
  <MyWidget />
</ErrorBoundary>
```

## 6、错误边界冒泡

错误边界的工作方式类似与 JavaScript 的 `<font style="color:#FA8C16;">catch {}</font>`，不同的地方在于错误边界<font style="color:#FA8C16;">只针对 React 组件</font>。<font style="color:#FA8C16;">只有 class 组件</font>才可以称为错误边界组件。大多数情况下，只需要生命一次错误边界组件，并在整个引用中使用它。

注意错误边界仅可以捕获其子组件的错误，它无法捕获其自生的错误。如果一个错误边界无法渲染错误信息，则错误会冒泡到最近的上层错误边界，这也类似与 JavaScript 中 catch{} 的工作机制。

```javascript
<ErrorBoundary2>
  <ErrorBoundary>
    <TestErr />
  </ErrorBoundary>
</ErrorBoundary2>
```
