---
title: 父子组件数据关系与状态提升
date: 2026-07-09
tags:
  - React
  - 状态提升
---

# 父子组件数据关系与状态提升

## 1、含义

- 状态提升：两个组件（无父子关系）共享一个数据并且同步数据表便。
- 类组件调用（实例化）的时候，组件内部的状态时唯一且独立的。
- 组件嵌套与调用，和是类组件（render）还是函数组件（直接return）没有关系。
- 类组件与函数组件时可以相互嵌套调用的。

> 单向数据流
>
> 数据的流动 父 -> 子 props 向下传递
>
> props 只读数据 -> props -> 数据操作 -> 父组件来完成 -> 数据由父组件管理
>
> 状态提升 -> 本应该是子组件的状态 ->父组件来保存与操作 -> 通过 props -> 子组件

例：

```javascript
class App extends React.Component {
  state = {
    name: "zhangsan",
  };

  handleChange = (e) => {
    console.log(e); // BaseEvent   通过事件源的value 修改
    this.setState({
      name: e.target.value,
    });
  };

  render() {
    return (
      <div>
        <MyInput
          num={"1"}
          name={this.state.name}
          handleChange={this.handleChange}
        />
        <MyInput
          num={"2"}
          name={this.state.name}
          handleChange={this.handleChange}
        />
      </div>
    );
  }
}

class MyInput extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        第{this.props.num}个:
        <input
          type="text"
          value={this.props.name}
          onChange={this.props.handleChange}
        />
      </div>
    );
  }
}
```
