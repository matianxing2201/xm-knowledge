---
title: 代码分割之import静动态导入
date: 2026-07-09
tags:
  - React
  - 代码分割
  - import
---

# 代码分割之import静动态导入

## 首屏优化方案

> 项目构建时会整体打包成一个 bundle 的 JS 文件，而有的代码。模块是加载时不需要的，需要分割出来单独形成一个文件快 chunk （不会打包在main里），让模块懒加载（需要加载时才加载），以减少应用体积、减少加载时的体积。

- `<font style="color:#FA8C16;">import</font>` 是关键字而非函数（类比 `<font style="color:#FA8C16;">typeof</font>`，`<font style="color:#FA8C16;">typeof '123'</font>` or`<font style="color:#FA8C16;"> typeof('123')</font>`）。
- 静态导入：`<font style="color:#FA8C16;">import xxx from ''</font>`，导入时加载，导入的模块会被编译，不是按需编译。
- 动态导入：`<font style="color:#FA8C16;">import('')</font>` 根据条件或按需的模块导入。
- 动态导入应用场景：

```javascript
模块太大，使用可能性底
模块的导入占用了大量系统内存
模块需要异步导入
导入模块时需要动态构建路径 import('./' + a + '.js' )
模块中的代码需要程序触发了某些条件才运行(点击事件)
```

- 不要滥用动态导入：静态导入有利于初始化依赖，动态导入不能用于静态的程序分析和tree shaking

```javascript
// module.js
export default class MyTest {
    construct() {
        console.log('构造器')
    }
}

// 视图
<template>
  <div>
    <button class="test" @click="clickBtn">查看</button>
  </div>
</template>

<script>
export default {
  name: "Plan",
  methods: {
    async clickBtn() {
      const res = await import("../libs/module.js");
      // import返回值是Promise
      console.log("res", res);
      let myTest = res.default;
      new myTest();
    },
  },
};
</script>
```

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1640655237296-1dede13a-bf6a-41a3-b765-d7de39af1fee.png" width="450.5" title="" crop="0,0,1,1" id="u55c4b849" class="ne-image">

- 如果使用 vite/脚手架（create react app）搭建的项目 -> 可以直接使用 `<font style="color:#FA8C16;">import()</font>`
- 如果时手动配置 webpack ，需要按照代码分割指南配置 [webpack动态导入](https://webpack.docschina.org/guides/code-splitting/#dynamic-imports)
- 如果使用 babel 解析 `<font style="color:#FA8C16;">import()</font>` 需要安装依赖 `<font style="color:#FA8C16;background-color:rgb(249, 242, 244);">@babel/plugin-syntax-dynamic-import</font>` (在动态注册 vue-route 时，出现对 import 的语法错误，可能就时需要安装该依赖)

## react 中使用

- 对于动态import的内容，不会直接打包进 main.js 里；如果时静态导入的就会直接打包进一个 js 里

```javascript
function Button() {
  // 函数里定义方法，要写关键字声明 和类不同
  const handleClick = async () => {
    // 若export default 接收到的就是default；否则接收到导出的
    const plus = await import("./index.js").then((res) => res.default);
    // await + then 将res.default保存到res
    plus(1, 2);
  };
  return <button onClick={handleClick}>getSum</button>;
}
ReactDOM.render(<Button />, document.getElementById("app"));
```
