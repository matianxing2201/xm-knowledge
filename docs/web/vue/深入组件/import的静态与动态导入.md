---
title: import 的静态与动态导入
date: 2022-01-01
tags:
  - Vue
---

# import 的静态与动态导入

## Vue实例

`Vue.createApp` -> 创建一个Vue的应用 -> 应用实例

### 属性

| component： | 注册全局组件             |
| ----------- | ------------------------ |
| config：    | 应用配置                 |
| directive： | 全局注册全局自定义指令   |
| mixin：     | 全局注册混入器           |
| mount：     | 挂在组件                 |
| provide：   | 注入全局跨组件层级的属性 |
| use：       | 使用插件                 |

## 组件名

在注册一个组件的时候，我们始终需要给它一个名子。

Vue 推荐组件名和使用组件时的标签名尽量一致。

```javascript
import { createApp } from "vue";

const app = createApp({});

第一个参数就是组件名;
app.components("my-component-name", {
  /* ...  */
});
```

### 命名遵循 W3C 规范

- 全部小写
- 包含连字符

### 组件名大小写

#### kebab-case （短横线分隔命名）

1. 符合W3C对标签的使用规范 -> XHTML
2. 避免现有或将来的HTML标签的冲突
3. 避免有一些大小写不敏感的文件系统，解析会出现问题

```javascript
app.component("my-component-name", {
  /* ... */
});
```

#### PascalCase （大驼峰命名）

1. 有利于编辑器的补全
2. JSX使用PascalCase 进行标签书写

```javascript
app.component("MyComponentName", {
  /* ... */
});
```

#### 双标签

标准的HTML标签大多数都是双标签

#### 规范

全局注册使用 kebab-case

局部注册使用 PascalCase

标签的书写都是用 kebab-case 双标签

## 全局注册

通过 `app.component('MyComponentName',{...})` 这种方式注册的方式是全局注册。注册过后可以在任何新创建的组件实例的模板中。

```javascript

const app = Vue.createApp({})

								组件名       组件本身
app.component('ComponentA', {
  /* ... */
})
app.component('ComponentB', {
  /* ... */
})
app.component('ComponentC', {
  /* ... */
})

app.mount('#app')

--------------------template--------------------------

<div id="app">
  <component-a></component-a>
  <component-b></component-b>
  <component-c></component-c>
</div>
```

## 局部注册

在一个组件内部，使用另外一个组件，需要在当前组件的内部 注册组件

1、可以通过一个JavaScript对象来定义组件

```javascript
const ComponentA = {
  /* ... */
};
const ComponentB = {
  /* ... */
};
```

2、在 `components` 选项中 定义需要引入的组件

```javascript
const App = Vue.createApp({
  components: {
    ComponentA,
    ComponentB,
  },
});
```

3、在视图中使用

```javascript
<div id="app">
  <component-a></component-a>
  <component-b></component-b>
</div>
```

##
