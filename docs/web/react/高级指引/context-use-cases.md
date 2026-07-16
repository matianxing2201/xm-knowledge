---
title: 初识Context的使用场景
date: 2022-01-01
tags:
  - React
  - Context
---

# 初识Context的使用场景

## 1、context

- 容器（即上下文）-> 装数据 -> 可以传递到程序的多个地方
- 程序在执行时可以访问的容器

## 2、使用

**context.js**

```javascript
export const ThemeContext = React.createContext("black"); // 默认值
```

    **main.jsx**

```javascript
import BottomNav from "./BottomNav/index";
import Header from "./Header/index";
import BtnGroup from "./BtnGroup/index";
import { ThemeContext } from "./context";
class Main extends React.Component {
  state = {
    navData: ["第①", "第②", "第③", "第④"],
    theme: "black",
  };
  changeTheme = (theme) => {
    this.setState({
      theme,
    });
  };
  render() {
    return (
      <ThemeContext.Provider value={this.state.theme}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Header>标题</Header>
          <BtnGroup changeTheme={this.changeTheme} />
          <BottomNav data={this.state.navData}></BottomNav>
        </div>
      </ThemeContext.Provider>
    );
  }
}
export default Main;
```

    **Header 组件**

```javascript
import "./index.css";
import { ThemeContext } from "../context";

class Header extends React.Component {
  render() {
    return (
      <ThemeContext.Consumer>
        {(theme) => {
          console.log("theme", theme);
          return (
            <header className={"title " + `header-${theme}`}>
              {this.props.children}
            </header>
          );
        }}
      </ThemeContext.Consumer>
    );
  }
}
export default Header;
```

**BtnGroup 组件**

```javascript
// 注意方法的绑定
import "./index.css";
class BottomNav extends React.Component {
  render() {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          flex: 1,
          paddingTop: "44px",
        }}>
        <button onClick={() => this.props.changeTheme("black")}>Black</button>
        <button onClick={() => this.props.changeTheme("orange")}>Orange</button>
        <button onClick={() => this.props.changeTheme("purple")}>Purple</button>
        <button onClick={() => this.props.changeTheme("red")}>Red</button>
      </div>
    );
  }
}
export default BottomNav;
```

## 3、总结

- 提供 `<font style="color:#FA8C16;">export const ThemeContext = React.createContext('red')</font>`
- Provide 组件包裹组件树、传递 value : `<font style="color:#FA8C16;"><ThemeContext.Provider value={ this.state.theme }></ThemeContext.Provider></font>`
- Consumer 使用 theme （jsx + 回调函数参数为 theme）
