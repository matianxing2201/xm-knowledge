---
title: 深入JSX
date: 2022-01-01
tags:
  - React
  - JSX
---

# 深入JSX

## 1、React对JSX的处理

- `React.createElement`有三个参数：标签类型、属性集合、子元素。
- JSX其实是`React.createElement`函数调用的语法糖。
- JSX -> 编译 -> `React.createElement` 调用形式

```javascript
class App extends Component {
  render() {
    return (
      <div className="box" id="J_box">
        <h1 className="title">
          title<span>span</span>
        </h1>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
```

<img src="https://cdn.nlark.com/yuque/0/2022/png/12961835/1647264419670-de797ee9-8b00-4635-8653-221ed1885470.png" width="248" title="" crop="0,0,1,1" id="u44e92195" class="ne-image">

<img src="https://cdn.nlark.com/yuque/0/2022/png/12961835/1647264526624-9606ddb0-8038-4aea-b479-82ab956ce833.png" width="860" title="" crop="0,0,1,1" id="u05fe00ed" class="ne-image">

```javascript
class App extends React.Component {
  render() {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "box",
        id: "J_Box",
      },
      /* @__PURE__ */ React.createElement(
        "h1",
        {
          className: "title",
        },
        "This is a ",
        /* @__PURE__ */ React.createElement("span", null, "TITLE"),
      ),
    );
  }
}
```

## 2、React元素类型

- MyButton -> 是React元素 -> 也是React元素类型
- 以JSX形式使用组件，则该组件必须存在于当前作用域
- React.createElement拿到组件并实例化，拿到他的视图

## 3、在JSX中使用点语法

```javascript
const colorSystem = {
  danger: "red",
  success: "green",
  primary: "blue",
  warning: "orange",
};
const MyUi = {
  Button: class extends Component {
    render() {
      const { type, children } = this.props;
      return (
        <button
          style={{
            color: "#fff",
            backgroundColor: colorSystem[type],
          }}>
          {children}
        </button>
      );
    }
  },
};

class App extends Component {
  render() {
    return (
      <>
        <MyUi.Button type="danger">点击</MyUi.Button>
        <MyUi.Button type="success">点击</MyUi.Button>
        <MyUi.Button type="primary">点击</MyUi.Button>
        <MyUi.Button type="warning">点击</MyUi.Button>
      </>
    );
  }
}
```

```javascript
登录与欢迎组件简单案例;
class Login extends Component {
  render() {
    return <div>请登录</div>;
  }
}

class Welcome extends Component {
  render() {
    return (
      <div>
        <h1>你好,{this.props.name}</h1>
      </div>
    );
  }
}

class App extends Component {
  static components = {
    login: Login,
    welcome: Welcome,
  };

  render() {
    // 根据传值 动态显示组件
    const HeaderUser = App.components["login"];
    //const HeaderUser = App.components['welcome']
    return (
      <>
        <HeaderUser name="张三"></HeaderUser>
      </>
    );
  }
}
```

## 4、JSX的props

### JSX的表达式与语句

- JSX的大括号里可以传入任何JS表达式（三目等）
- 不可以传入JS语句（if/for/switch/function）,非表达式可以在JSX大括号外面使用（除render）

### 字符串字面量

- 字符串字面量传入的props能显示特殊符号
- JS表达式传入的props将原封不动的显示

<img src="https://cdn.nlark.com/yuque/0/2022/png/12961835/1647667538172-2ed0465e-e217-4055-b107-844b30bf1c6b.png" width="1032" title="" crop="0,0,1,1" id="u4d3f015f" class="ne-image">

- 字符串传入的意义是字符串本意，传入了字符串的`true`，不代表`Bool`类型的真假，隐式转换为真，但全等 === true 会判断为假。

```javascript
<Title
	isShow = "true"
	a = "1" //字符串 1
	b = 1 // 数字1
/>
function App() {
  return (
    <div className="App">
      <Title
        title="&lt;This is a Title&gt;"
        author="Matianxing"
        isShow = "true"
        // 语义：字符串传入的意义是字符串的意思，不代表Bool真假
        // 逻辑：字符串true逻辑是真

        // 语义和逻辑：Bool true的留意代表Bool真假

        // isShow = { true }
        // 不赋值属性 -> 默认是Bool 真
        // 并不建议这么做，语义不好，相比于ES6的省略属性 { isShow } => { isShow : isShow }
      />

    </div>
  );
}
```

### 剩余运算符

- 当传入的属性非常多时可以使用扩展运算符把属性收集起来一次性传入
- 如果有不用的属性，可以先解构，再展开余下的属性进行传递

```javascript
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "This is a title",
      author: "Matianxing",
      age: 27,
    };
  }
  render() {
    const { age, ...other } = this.state;
    return (
      <div className="App">
        <Title {...this.state}></Title>
        <Title {...other}></Title>
      </div>
    );
  }
}
```
