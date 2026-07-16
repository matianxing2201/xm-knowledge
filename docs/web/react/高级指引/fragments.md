---
title: Fragment和段语法
date: 2026-07-09
tags:
  - React
  - Fragment
---

# Fragment和段语法

1. jsx语法，相当于 `<font style="color:#FA8C16;">document.createDocumentFragment()</font>`
2. 创建文档碎片容器，优化渲染
3. 解决了没有根节点的问题
4. `<font style="color:#FA8C16;"><></></font>` 这种段语法也会声明 `<font style="color:#FA8C16;">React.Fragment</font>`
5. 短语法不支持 key
6. React.Fragment 只支持 key 属性，其余属性如事件等在当前版本不支持

```javascript
App.js;

import TableHeaders from "./TableHeaders";
import TableCells from "./TableCells";

class App extends Component {
  state = {
    headers: ["Name", "Age", "ID"],
    info: ["tianxing Ma", "27", "001"],
  };
  render() {
    return (
      <table border="1">
        <caption>title</caption>
        <thead>
          <tr>
            <TableHeaders headers={this.state.headers} />
          </tr>
        </thead>
        <tbody>
          <tr>
            <TableCells info={this.state.info} />
          </tr>
        </tbody>
      </table>
    );
  }
}

export default App;
```

```javascript
TableCells.js;

import React, { Component, Fragment } from "react";

class TableCells extends Component {
  render() {
    return (
      <Fragment>
        {this.props.info.map((item, index) => {
          return <th key={index}>{item}</th>;
        })}
      </Fragment>
    );
  }
}

export default TableCells;
```

```javascript
TableHeaders.js;

import React, { Component, Fragment } from "react";
class TableHeaders extends Component {
  render() {
    return (
      <Fragment>
        {this.props.headers.map((item, index) => {
          return <th key={index}>{item}</th>;
        })}
      </Fragment>
    );
  }
}

export default TableHeaders;
```

![Fragment](/images/web/react/fragment-1.png)
