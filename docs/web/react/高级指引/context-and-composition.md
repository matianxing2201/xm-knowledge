---
title: Context与组合的应用场景与使用问题
date: 2026-07-09
tags:
  - React
  - Context
---

# Context与组合的应用场景与使用问题

## 1、contextType

- 指定 context 类型为创建的上下文，此时不需要用 Consumer 组件包裹，使用 this.context 即可访问。
- 会向上找到最近的上下文并取值。
- 最适合的场景：杂乱无章的组件都需要同一些数据。若单纯为了不层层传递属性，使用 context 时不合适的。
- Context 的缺点：弱化及污染组件的纯度，导致组件复用性降低。
- 使用组合组件（嵌套组件），则不需要使用 context 。

## 2、context

```javascript
import React, { Component, createContext } from "react";

const CityContext = createContext({
  value: "nanjing",
  name: "南京",
});

// 文字提示
class Context extends Component {
  render() {
    return <h1>{this.props.name}</h1>;
  }
}

// 下拉
class Selector extends Component {
  static contextType = CityContext;
  render() {
    return (
      <>
        <select
          defaultvalue={this.context.name}
          onChange={(e) => {
            this.props.changeCity({
              value: e.target.value,
              name: e.target[e.target.selectedIndex].label,
            });
          }}>
          <option value="nanjing">南京</option>
          <option value="hangzhou">杭州</option>
          <option value="shenzheng">深圳</option>
          <option value="chengdu">成都</option>
        </select>
      </>
    );
  }
}

class App extends Component {
  state = {
    cityInfo: {
      value: "nanjing",
      name: "南京",
    },
  };

  changeCity = (obj) => {
    console.log(obj);
    this.setState({
      cityInfo: obj,
    });
  };
  render() {
    return (
      <>
        <CityContext.Provider value={this.state.cityInfo}>
          <Context name={this.state.cityInfo.name} />
          <Selector changeCity={this.changeCity} />
        </CityContext.Provider>
      </>
    );
  }
}

export default App;
```

##

## 3、使用组合组件

```javascript
// 渲染文字
class Content extends React.Component {
  render() {
    return (
      <div>
        <h1>{this.props.label}</h1>
        <div>{this.props.selector}</div>
      </div>
    );
  }
}
// 下拉选
class Selector extends React.Component {
  render() {
    return (
      <>
        <select
          value={this.props.dataForSelector.name}
          onChange={(e) => {
            this.props.changeCity({
              value: e.target.value,
              label: e.target[e.target.selectedIndex].label,
            });
          }}>
          <option value="nanjing">南京</option>
          <option value="hangzhou">杭州</option>
          <option value="shenzheng">深圳</option>
          <option value="chengdu">成都</option>
        </select>
      </>
    );
  }
}
class Main extends React.Component {
  state = {
    cityInfo: {
      value: "nanjing",
      label: "南京",
    },
  };
  changeCity = (obj) => {
    this.setState({
      cityInfo: obj,
    });
  };
  render() {
    return (
      <>
        <Content
          label={this.state.cityInfo.label}
          selector={
            <Selector
              changeCity={this.changeCity}
              dataForSelector={this.state.cityInfo}
            />
          }
        />
        {/* 组合组件 在这里传入了数据 */}
      </>
    );
  }
}
ReactDOM.render(<Main />, document.getElementById("app"));
```
