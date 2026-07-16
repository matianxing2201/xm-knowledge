---
title: state与setState、单向数据流
date: 2022-01-01
tags:
  - React
  - State
  - setState
---

# state与setState、单向数据流

## 1、生命周期与组件卸载

在具有许多组件的应用程序中，当组件被销毁时释放所占用的资源是非常重要的。

当 `<font style="color:#FA8C16;">Clock</font>` 组件第一次被渲染到 DOM 中的时候，<font style="color:#FA8C16;">设置一个计时器</font>打印当前时间。在这 React 中被称为"挂载（mount）"。

同时，当 DOM 中 Clock 组件被删除的时候，应该<font style="color:#FA8C16;">清除计时器</font>。在这 React 中被称为"卸载（unmount）"。

我们可以为 class 组件声明一些特殊的方法，当组件挂载或卸载时去执行这些方法：

```javascript
class Clock extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    time: new Data().toString(),
  };
  // 组件被渲染到 DOM 后中执行
  // 设置计时器
  componendDidMount() {
    this.t = setInterval(() => {
      this.setState({
        time: new Date().toString(),
      });
    }, 1000);
  }
  // 组件即将被卸载时
  // 清除计时器
  componentWillUnmount() {
    clearInterval(this.t);
    this.t = null;
  }

  return() {
    render(
      <div>
        <h1>{this.state.time}</h1>
      </div>,
    );
  }
}
```

## 2、State 使用的注意事项

1. 必须使用 setState 方法来更改 state
2. 多个 setState 会合并并调用
3. props 和 state 更新数据要谨慎（<font style="color:#FA8C16;">state的更新可能是异步的</font>）
4. setState 操作合并的原理：浅合并，即设置什么属性就更新什么，最终在合并成一个 state

```javascript
不要直接修改 State
// Wrong
this.state.comment = 'Hello';

// Correct
this.setState({
  comment: 'Hello'
});
构造函数是唯一可以给 this.state 赋值的地方
```

```javascript
this.props 和 this.state 可能会异步更新，所以不要依赖他们的值来更新下一个状态。

// Wrong
this.setState({
	counter: this.state.counter + this.props.increment
})

要解决这个问题，可以让 setState() 接受一个函数而不是一个对象。
这个函数上一个 state 作为第一个参数，将此次更新被应用时的 props 做为第二个参数：

// Correct
this.setState((state,props) => {
	counter: state.counter + props.increment
})
```

```javascript
// 设置arr,用一个全新的数组替换，而不在使用原先的引用

this.setState({
	arr:[...this.state.arr, 4]
  // OR
  arr:this.state.arr.concat(4);
})
```

> state 是组件内部特有的数据封装
>
> 其他组件无法读写该组件的 state
>
> 组件可以通过其他组件调用时传入的属性来传递 state 的值
>
> props 虽然是响应式的，但是组件内部是只读的
>
> state 只能传递给自己的子组件（state的安全影响范围）
>
> 组件可以没有状态
>
> 组件有无状态切换（原先无状态，在生命周期函数/绑定的事件处理函数中增加状态）
>
> **总结：这种数据（状态）从父到子，由上而写的传递的方式叫单向数据流**
