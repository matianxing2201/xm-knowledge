---
title: 非受控组件、受控与非受控选择方案
date: 2022-01-01
tags:
  - React
---

# 非受控组件、受控与非受控选择方案

> 大多数情况下，推荐使用 `<font style="color:#FA8C16;">受控组件</font>` 来处理表单数据。再一个受控组件中，表单数据时由 React 组件来管理的。另一种替代方式时使用非受控组件，这是表单数据将交由 DOM 节点来处理。
>
> 要别写一个非受控组件，而不是为每个状态更新都编写数据处理函数，可以使用 `<font style="color:#FA8C16;">ref</font>` 来从 DOM 节点中获取表单数据

```javascript
clas From extends React.Component {
	handleSubmitClick = (e) => {
  	e.preventDefault();
    console.log(this.refs.refName.value)
  }

  render() {
  	return(
    	<form>
        <p>
          <label>用户名</label>
          <input type="text" ref="refName" placeholder="请输入用户名" />
        </p>
      	<p>
          <button onClick={ this.handleSubmitClick }>提交</button>
        </p>
     	</form>
    )
  }
}
```

## 1、refs 已弃用提示

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640566258905-da9bc277-fa51-49a2-8007-fa731e2e1fbd.png" width="597" title="" crop="0,0,1,1" id="u6ce86c7a" class="ne-image">

## 2、使用 hooks React.craeteRef

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.refName = React.createRef();
    this.refPwd = React.createRef();
  }

  handleSubmitClick = (e) => {
    e.preventDefault();
    console.log(this.refName.current.value, this.refPwd.current.value);
  };

  render() {
    return (
      <form>
        <p>
          <label>用户名</label>
          {/* ref="refName" 改用 hooks React.createRef */}
          <input type="text" ref={this.refName} placeholder="请输入用户名" />
        </p>
        <p>
          <label>密码</label>
          <input type="password" ref={this.refPwd} placeholder="请输入密码" />
        </p>
        <p>
          <button onClick={this.handleSubmitClick}>提交</button>
        </p>
      </form>
    );
  }
}
```

## 3、默认值

form field 的默认值，在组件挂在完毕后更新，不会导致 DOM 的更新。React 赋予一个初始值，后续不去控制它更新。这种情况下可以指定一个 `<font style="color:#FA8C16;">defaultValue</font>` 属性，而不是 `<font style="color:#FA8C16;">value</font>` 。

```javascript
render() {
    return (
      <form>
        <p>
          <label>用户名</label>
          <input
            type="text"
            value="12"
            placeholder="请输入用户名"
          />
        </p>
      </form>
    );
  }
```

如果使用 value 必须绑定处理函数

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640567525399-020610c0-de89-433f-9615-a34ab27cee90.png" width="694" title="" crop="0,0,1,1" id="u88b75bb0" class="ne-image">

## 4、文件输入

在 React 中，`<font style="color:#FA8C16;"><input type="file" /></font>` 始终时一个非受控组件，因为它的值只能是由用户实则hi，而不能通过代码控制。

```javascript
class Form extends React.Component {
  constructor(props) {
    super(props);
    this.refFile = React.createRef();
  }

  handleSubmitClick = (e) => {
    e.preventDefault();
    console.log(this.refFile.current.files[0]);
  };

  render() {
    return (
      <form>
        <p>
          <label>文件</label>
          <input type="file" ref={this.refFile} />
        </p>
        <p>
          <button onClick={this.handleSubmitClick}>提交</button>
        </p>
      </form>
    );
  }
}
```

## 5、什么是元素受控

每个表单元素都有一个不同的属性来设置该值，下面表单总结：

|           元素           |        值属性        | 更改回调 |     回调中的新值     |
| :----------------------: | :------------------: | :------: | :------------------: |
|  <input type="text" />   |    value="string"    | onChange |  event.target.value  |
| <input type="checkbox"/> | checked={ boolean }  | onChange | event.target.checked |
|  <input type="radio" />  | checked={ boolean }  | onChange | event.target.checked |
|       <textarea />       |    value="string"    | onChange |  event.target.value  |
|        <select />        | value="option value" | onChange |  event.target.value  |

## 6、结论

1. 受控和不受控的表单字段都有其有点。根据业务需求选择适合的方案。
2. 如果表单的 UI 交互非常简单，非受控组件完全可以使用。
