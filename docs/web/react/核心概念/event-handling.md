---
title: 事件处理函数绑定与事件对象
date: 2026-07-09
tags:
  - React
  - 事件
---

# 事件处理函数绑定与事件对象

## 1、事件处理函数的绑定

React 元素的事件处理和 DOM 元素的很相似，但是语法上有一些不同：

1. React 事件的命名采用小驼峰式（camelCase），而不是纯小写。
2. 使用 JSX 语法时你需要传入一个函数作为事件处理函数，而不是一个字符串。
3. 直接创建 React 元素

```javascript
// 传统 HTML
<button onclick="handleClick()">
  Click
</button

// React
<button onClick = { handleClick }>
  Click
</button>

// React 元素
React.createElement(
	'button',
  {
  	onClick: { this.handleClick }
  },
  Click
)
```

## 2、阻止默认行为

React 中不可以通过返回 `<font style="color:#FA8C16;">false</font>` 的方式阻止默认行为。必须显示使用 `<font style="color:#FA8C16;">preventDefault</font>` 。

例如传统的 HTML 中阻止链接默认打开一个新页面：

```javascript
<a href="#" onclick="console.log('was clicked'); return false">
  Click
</a>
```

在 React 中如下：

```javascript
class App extends React.Components {
  handleClick(e) {
    e.preventDefault();
    console.log("已点击");
  }

	render() {
  	return(
    	<a href="#" onClick = { this.handleClick }>链接</a>

			//使用伪协议在 React 中会报warning
			{/* <a href="javascript:;" onClick = { this.handleClick }>链接</a> */}
    )
  }
}

ReactDOM.render(
	<App />,
  document.getElementById('app')
)
```

- 使用伪协议在 React 中会报warning

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640160057309-2a023325-6966-4226-886a-d7404592b846.png" width="657.5" title="" crop="0,0,1,1" id="u3098cc8a" class="ne-image">

## 3、事件对象

1. SyntheticBaseEvent 合成基础事件对象
2. 这个 SyntheticBaseEvent 是遵守 W3C 事件对象规范的，不存在浏览器兼容性问题

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640160817546-00815376-9e58-4e9d-b456-18bbc7c78e6a.png" width="310" title="" crop="0,0,1,1" id="u10f6f447" class="ne-image">

## 4、React 为什么要将事件处理直接绑定在元素上

React 认为事件处理和视图有直接关系，写在一起可以更直观的表述视图与逻辑关系，便于维护

## 5、this 指向

- ES6 Class模块默认不对事件处理函数进行 this 的再绑定

```javascript
class App extends React.Component {
  handleClick(e) {
    console.log(this);
    // this 默认为 undefined
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Click</button>
      </div>
    );
  }
}

ReactDOM.render(
  <App />
  document.getElementById("root")
);
```

- DOM0 事件

```javascript
<button onclick="console.log(this)">Click</button> // this 指向 button
```

### 修改 this 指向的方法

1. 在构造器中 bind this => **隐式传入 e**
2. 在视图中 bind this => **隐式传入 e**
3. 回调 + 箭头函数 + 方法执行（render函数每次执行时都会创建新的回调）
   1. 注意：给子组件的属性传递函数时，由于每次都创建一个回调，子组件每次都接收一个新的函数，可能触发子组件的 render **显示传入 e**
4. class field写法：class 内部的箭头函数

> 事件对象都在最后一个参数

```javascript
// 在构造器中 bind this
class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log(this); // this 指向 App
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Click</button>
      </div>
    );
  }
}
```

```javascript
// 在视图中 bind this
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  handleClick() {
    console.log(this);
  }
  render() {
    return (
      <div>
        <button onClick={this.handleClick.bind(this)}>Click</button>
      </div>
    );
  }
}
```

```javascript
// 回调 + 箭头函数 + 方法执行
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  handleClick(e) {
    console.log(this);
  }
  render() {
    return (
      <div>
        <button onClick={(e) => this.handleClick(e)}>Click</button>
      </div>
    );
  }
}
```

- 用在子组件上时，父组件每次 render 都创建一个新的回调，fn 是响应的，会触发子组件的 render

```javascript
render() {
  return (
    <div>
      <button onClick={() => this.handleClick()}>按钮</button>
      <Title fn={() => this.doSth} />
		</div>
	)
}

```

```javascript
// class 内部的箭头函数

// class内部的箭头函数
class MyButton extends React.Component {
  constructor(props) {
    super(props);
  }
  // 实验性写法
  outerClick = () => {
    console.log("outher-this", this);
    // 箭头函数的this是稳定的 指向外部的 button
  };
  render() {
    return (
      <div>
        <button onClick={this.outerClick}>按钮</button>
      </div>
    );
  }
}
```
