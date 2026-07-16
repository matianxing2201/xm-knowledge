---
title: 列表渲染
date: 2026-07-09
tags:
  - React
---

# 列表渲染

使用 `<font style="color:#FA8C16;">map()</font>` 函数，可以对数据或组件进行渲染

## 1、table 相关的 warning

> JSX 中使用table，如果没有 tbody、thead 会告警
>
> <img src="https://cdn.nlark.com/yuque/0/2021/bmp/12961835/1640319125171-dc526450-dffc-488a-9f94-1381c26d97b9.bmp" width="707" title="" crop="0,0,1,1" id="u26c049bd" class="ne-image">

## 2、key 相关的 warning

- <font style="color:rgba(0, 0, 0, 0.75);">Each child in a list should have a unique "key" prop.（列表中的每个子元素都必需有一个唯一的key属性值）</font>
- <font style="color:rgba(0, 0, 0, 0.75);">key是React确定元素是否改变的唯一标识，key必需在兄弟节点中是唯一的</font>

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640319414017-f15377f1-dd4d-45e9-937f-9706e910ac25.png" width="751.5" title="" crop="0,0,1,1" id="BCYkd" class="ne-image">

## 3、key

key 帮助 React 识别那些元素改变了，比如被添加或删除。因此必需给每项元素赋予一个确定的表示：

```javascript
render() {
    return (
      <table>
        {this.state.table.map((item) => {
          return (
            <tr>
              <td>{item.id}</td>
              <td>{item.name}</td>
            </tr>
          );
        })}
      </table>
    );
  }
```

一个元素的 key 最好时这个元素在列表中唯一的值。通常可以使用数据中的 id 来作为元素的 key：

```javascript
<table>
  {this.state.table.map((item) => {
    return (
      //  添加 key 属性
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>{item.name}</td>
      </tr>
    );
  })}
</table>
```

### 不建议使用 index 作为 key 值

- 建立在列表顺序改变、元素增删的情况下。列表增删或顺序改变，index 对应项就会改变
- 若列表时静态不可操作的，可以选择 index 作为 key 值

### key 的错误使用方式

```javascript
// header 部分
class MyThead extends React.Component {
  render() {
    return (
      <thead>
        <tr>
          <th>sid</th>
          <th>ID</th>
          <th>姓名</th>
        </tr>
      </thead>
    );
  }
}
// tbody 部分
class MyTbody extends React.Component {
  render() {
    const { sid, item } = this.props;
    return (
      // 错误！ 不需要再这指定key
      <tr key={sid}>
        <td>{sid}</td>
        <td>{item.id}</td>
        <td>{item.name}</td>
      </tr>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    table: [
      { id: 1, name: "张三" },
      { id: 2, name: "李四" },
      { id: 3, name: "王五" },
    ],
  };

  render() {
    return (
      <table>
        <MyThead />
        <tbody>
          {this.state.table.map((item) => {
            const key = nanoid();
            // 元素的 key 应该在这里指定
            return <MyTbody sid={key} item={item} key={key}></MyTbody>;
          })}
        </tbody>
      </table>
    );
  }
}
```

### key 的正确使用

- React 明确规定，key 不能作为属性传递给子组件，必须显示传递 key 值（使用别的属性名，如sid）
- 方式开发者在逻辑中对 key 值进行操作
- key 只是再兄弟节点之间必须唯一
  - 它们不需要是全局唯一。当生成两个不同数组时，可以使用相同的 key 值。
