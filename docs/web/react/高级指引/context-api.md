---
title: Context API
date: 2022-01-01
tags:
  - React
  - Context
---

# Context API

## 1、React.createContext

```javascript
const MyContext = React.createContext(defaultValue);
```

- 创建一个 Context 对象。当 React 渲染一个订阅了这个 Context 对象的组件，这个组件会从组件树中离自身最近的那个匹配 `<font style="color:#FA8C16;">Provider</font>` 中读取到当前的 context 值。
- **只有**当组件所处的树中没有匹配到 Provider 时，其<font style="color:#FFEFD1;"> </font>`<font style="color:#FA8C16;">defaultValue</font>`<font style="color:#FFEFD1;"> </font> 参数才会生效。这有助于在不使用 Provider 包装组件的情况下对组件进行测试。将 undefined/NaN/null 传递给 Provider 的 value 时，消费组件的 `<font style="color:#FA8C16;">defaultValue</font>` 不会生效。

## 2、Context.Provider

```javascript
<MyContext.Provider value={/* 某个值 */}>
```

- Context.Provider 是通过 React.createContext 创建出的上下文对象里的一个组件，组件里可以插入其他组件（其他组件订阅了这个 Context）。
- 通过 Provider 的 value 属性将数据传递给 Consumer 组件。
- value 变化，插入 Provider 的组件都会重新渲染。
- value 新旧值的对比算法和 `<font style="color:#FA8C16;">Object.is</font>` 类似 。
- 不用 `<font style="color:#FA8C16;"><Context.Provider></font>` 包裹，则匹配不到 Provider，则使用默认值（其他情况均不适用默认值）。
- 用 Provider 包裹，但不提供 value 值或提供 undefined，则子组件获取到时 undefined，不会使用默认值。

## 3、Context.Consumer

```javascript
<MyContext.Consumner>
  {
		(value) => /* 基于 context 值进行渲染 */
	}
</MyContext.Consumer>
```

- 订阅Context 的变更。
- Consumer 内部使用函数作为子元素 ->function as a child（有一类组件，内部使用函数作为子元素）。
- 函数接收离 Context 最近的 Provider 提供的 value。
- 没有 Provider 则去 defaultValue。

## 4、Context.displayName

```javascript
const MyContext = React.createContext(/* defualtValue */);
MyContext.displayName = 'MyDisplayName';

<MyContext.Provider> // "MyDisplayName.Provider" 在 DevTools 中
<MyContext.Consumer> // "MyDisplayName.Consumer" 在 DevTools 中
```

## 5、Class.contextType

- 写法 `<font style="color:#FA8C16;">static contextType = MyContext</font>`。
- 赋值的一定是由 `<font style="color:#FA8C16;">React.createContext()</font>` 创建出来的 Context 对象。
- `<font style="color:#FA8C16;">static contextType</font>` 对于 contextType 不复制会报错，`<font style="color:#FA8C16;">static xx </font>` 普通属性不复制则不会报错。
- 是静态属性，ES3 写法 `<font style="color:#FA8C16;">组件.contextType = MyContext</font>`。
- 不管是否指定 contextType，this.context 都存在，只是 {} 和内容的区别。
- 指定 contextType 即给当前环境下的 Context 重新指定引用。
- 在声明周期函数和 render 函数中都可以访问。
- Provider、Consumer组件比 contextType 语义化更好。
