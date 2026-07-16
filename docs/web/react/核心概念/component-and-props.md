---
title: 组件与Props
date: 2026-07-09
tags:
  - React
  - Props
---

# 组件与Props

## 1、组件的概念

**组件**：视图的片段、内部管理数据的集合（state）、外部传入配置集合（props）

**包含**：

- 视图标记（React 的 JSX 、Vue 的 template ）需要经过转换成为真实 DOM
- 事件
- 逻辑（存储stroage、数据结构化）
- 外部的配置

## 2、属性 props 和数据/状态 state 的区别

- state -> 数据池 组件内部的管理数据容器 组件内部可读可写
- props -> 属性池 外部调用组件时传入的属性集合，组件内部<font style="color:#FA8C16;">只可读</font>，不可写
- props传递的值不可改变，可以通过子组件内部的state接收props传入的值然后再进行修改

```javascript
class Title extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: this.props.title,
    };
  }
  handleChangeClick = () => {
    this.setState({
      title: "change",
    });
  };
  render() {
    return (
      <div>
        <h1>{this.state.title}</h1>
        <button onClick={this.handleChangeClick}>Click</button>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "This is a title",
    };
  }
  render() {
    return (
      <div>
        <Title title={this.state.title} />
      </div>
    );
  }
}
```

## 3、组件渲染过程

- React 主动调用 自定义组件
- 将属性集合转换对象 `<font style="color:#FA8C16;">props -> { title: 'xxx' }</font>`
- 将对象作为 props 传入组件
- 替换 JSX 中的 props 或者 state 中的变量
- ReactDOM 将最终的 React 元素通过一系列操作转换成真实 DOM 进行渲染

## 4、组件调用规范

- 视图标记：HTML标签 `<font style="color:#FA8C16;"><h1></h1></font>`
- 大驼峰写法作为一个 React 元素 `<font style="color:#FA8C16;"><Title/></font>` 组件 -> JSX -> React 元素
- 组件转换 React 元素 `<font style="color:#FA8C16;">React.createElement</font>`

## 5、props的使用

### 类组件

```javascript
class Title extends React.Component {
	constructor(props) {
  	super(props)
  }
  // 数据 - 内部数据 - state
  state = {
  	title: this.props.title
  }

  // 事件处理函数
	handleChangeClick(){

    // 逻辑
    this.setState({
    	title:'new title'
    })
  }

	render(){
    // 视图标记
  	return (
    	<h1> { this.state.title } </h1>

      // 事件
      <button onClick={ this.handleChangeClick.bind(this) }>Change</button>
    )
  }
}

ReactDOM.render(
	<Title title='This is my Init Title'/>,
  document.getElementById('app')
)

```

### hooks（函数组件）

- 函数组件一定要是一个纯函数（入参不可修改，保证复用性）
- 注意 onClick 绑定的不是函数执行 setTitle('new title')，而应该是一个匿名函数
- 也可以使用 bind 返回一个函数

```javascript
function Title(props) {
  const [title, setTitle] = React.useState(props.title);
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setTitle("new title")}>Change</button>
      // <button onClick={setTitle.bind(this, "new title")}>Change</button>
    </div>
  );
}

ReactDOM.render(<Title title="title" />, document.getElementById("app"));

/**
	ReactDOM.render(
  	React.createElement(Title,{
    	title: 'init title'
    })
  )
	
*/
```

### 使用展开运算符

```javascript
// 省略
state = {
	title: 'title',
	author: 'author'
}
render(){
	return (
		<Title {...this.state }/>
	)
}
// 相当于 <Title title="this.state.title" author="this.state.author" />

```

## 6、组合组件

组件可以在输出中引用其他组件。这样可以让我们用同一组件来抽象出任意层次的细节。按钮、表单、对话框等。在 React 应用程序中，这些通常都会以组件的形式表示

```javascript
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

function App() {
  return (
    <div>
      <Welcome name="Zhangsan" />
      <Welcome name="Lisi" />
      <Welcome name="Wangwu" />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```
