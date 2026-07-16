---
title: 条件渲染
date: 2026-07-09
tags:
  - React
---

# 条件渲染

React 中的条件渲染和 JavaScript 中的一样，使用 JavaScript 运算符 `<font style="color:#FA8C16;">if</font>` 或者条件运算符去创建元素来表现当前的状态，然后让 React 更具它们来更新 UI。

判断表达式一定是 false/null/undefined时才不会被渲染，0、空字符串、NaN会显示

例：

```javascript
class Login extends React.Component {
  render(props) {
    return <button onClick={props.handleLoginOutClickClick}>Login</button>;
  }
}

class LoginOut extends React.Component {
  render(props) {
    return <button onClick={props.handleLoginOutClickClick}>LoginOut</button>;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  handleLoginClickClick = () => {
    this.setState({
      isLogin: true,
    });
  };

  handleLoginOutClickClick = () => {
    this.setState({
      isLogin: false,
    });
  };

  state = {
    isLogin: false,
  };

  render() {
    const { isLogin } = this.state;
    if (isLogin) {
      return (
        <LoginOut handleLoginOutClickClick={this.handleLoginOutClickClick} />
      );
    } else {
      return <Login handleLoginClickClick={this.handleLoginClickClick} />;
    }
  }
}
```

## 1、与运算符 &&

通过花括号包裹代码，可以在 JSX 中嵌入任何表达式。包括 JavaScript 中的逻辑与（&&）运算符。它可以很方便的进行元素的条件渲染。

```javascript
class App from React.Component {
	state = {
  	LoginShow: true
  }
  render() {
  	return (
      {
      	LoginShow && <Login />
        //  true && expression 总会返回 expression
        //  false && expression 总会返回 false
      }
    )
  }
}
```

## 2、三目运算符

JavaScript 中的三目运算符 `<font style="color:#FA8C16;">condition ? true : false</font>` 也可以渲染

## 3、阻止条件渲染

有些情况下，希望能隐藏组件，即使他已经被其他组件渲染。若要完成次操作，可以让 `<font style="color:#FA8C16;">render</font>` 方法直接返回 null，而不进行任何渲染。
