---
title: 受控组件
date: 2026-07-09
tags:
  - React
---

# 受控组件

> <font style="color:#FA8C16;">由 state 来决定表单内部的数据，由表单的处理函数来更改 state 的方式叫做"受控组件"。</font>

在提交表单打印出内容时，可以将表单写为受控组件。

```javascript
class App extends React.Component {
  state = {
    username: "",
  };
  handleChange = (e) => {
    [e.target.name] = e.target.value;
  };

  render() {
    const username = this.state;
    return (
      <form>
        <p>
          <label>用户名</label>
          <input value={username} onChange={this.handleChange} />
        </p>
      </form>
    );
  }
}
```

由于在表单元素上设置了 `<font style="color:#FA8C16;">value</font>` 属性，因此显示的值始终为 `<font style="color:#FA8C16;">this.state.username</font>`，这使得 React 的 state 成为唯一的数据源。由于 `<font style="color:#FA8C16;">handleChange</font>` 在每次按键是都会执行并更新 React 的 state，因此显示的值将随着用户输入而更新。

对于受控组件来说，输入的值始终由 React 的 state 来驱动。也可以将 value 传递给其他 UI 元素，或者通过其他事件处理函数重置，但这样会编写更多的代码。

## 1、select/input 标签

- React 不是由 `<font style="color:#FA8C16;">selected</font>` 属性去控制选中状态，而是根据 `<font style="color:#FA8C16;">select</font>` 标签上的 `<font style="color:#FA8C16;">value</font>` 属性控制的。

```javascript
class App extends React.Component {
	state = {
  	gender:'',
    username:''
  }

	handleChange = (e) => {
  	[e.target.name] = e.target.value
  }
	render() {
    const { gender,username } = this.state;
  	return (
    	<form>
      	<p>
      		<label>性别</label>
      		<select value={gender} name="gender" onChange={this.handleChange}>
      			<option value="male">男</option>
						<option value="famale">女</option>
      		</select>
      	</p>
				<p>
        	<label>用户名</label>
					<input type="text" value={username} name="username" onChange={this.handleChange}>
        </p>
      </form>
    )
  }
}
```

## 2、radio 标签

- radio 设置相同的 name 才可单选。
- 时间处理函数中 event 参数在 最后一项。

```javascript
class App extends React.Component {
  state = {
    isAdult: true,
  };

  handleRadioChange = (value, e) => {
    // event 参数在末尾
    [e.target.name] = value;
  };
  render() {
    const { isAdult } = this.state;
    return (
      <form>
        <p>
          <label>是否成年</label>
          已成年
          <input
            type="radio"
            name="isAdult"
            checked={isAdult}
            onChange={this.handleRadioChange.bind(this, true)}
          />{" "}
          | 未成年
          <input
            type="radio"
            name="isAdult"
            checked={!isAdult}
            onChange={this.handleRadioChange.bind(this, false)}
          />{" "}
          |
        </p>
      </form>
    );
  }
}
```

## 3、checkbox 标签

```javascript
const hobbies = [
  {
    id: "1",
    hobby: "旅行",
  },
  {
    id: "2",
    hobby: "唱歌",
  },
  {
    id: 3,
    hobby: "炉石传说",
  },
];

class App extends React.Component {
  state = {
    hobbyList: [],
  };

  handleCheckboxChange = (e) => {
    const name = e.target.name,
      value = e.target.value,
      list = this.state[name];
    let chioseList = [];
    // 如果存在 反选
    if (list.includes(value)) {
      chioseList = list.filter((item) => item != value);
    } else {
      chioseList = [...this.state[name], value];
    }

    this.setState({
      [name]: chioseList,
    });
    console.log(chioseList);
  };
  render() {
    const { hobbyList } = this.state;
    return (
      <form>
        <p>
          <label>爱好:</label>
          {hobbies.map(({ hobby, id }, index) => {
            return (
              <span key={id}>
                {hobby}:
                <input
                  type="checkbox"
                  name="hobbyList"
                  value={id}
                  onChange={this.handleCheckboxChange}
                  checked={hobbyList.includes(id)}
                />
              </span>
            );
          })}
        </p>
      </form>
    );
  }
}
```
