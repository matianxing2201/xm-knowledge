---
title: 初识 Vue 以及基本用法、组件化构建
date: 2022-01-01
tags:
  - Vue
---

# 初识 Vue 以及基本用法、组件化构建

# 初识Vue

## Vue的核心（系统）

1. 模板语法 -> 核心库 -> 编译模板 -> 渲染DOM。
2. 组件逻辑的本质就是一个对象，里面有很多特殊的属性。
3. Vue将数据与DOM进行关联，并建立响应式关联。 数据改变 -> 视图更新
4. Vue完成了数据双向绑定的机制. 业务关注点全部放到逻辑层，视图交给ViewModel完成数据绑定、渲染和更新。

```javascript
<template>
  <!--  组件模板  -->
  <h1 :title="title">{{title}}</h1>
  <p>
      <span> count = {{count}}</span>
  	  <button :click='plus'>+</button>
  </p>
	<p>
      <span>{{ myComment }}</span>
      <input type="text" v-model="myComment">
  </p>
</template>

<script>
  //组件逻辑   组件逻辑模块
export default {
	name: 'App',
  data () {
  	return {
    	title:'This is title',
      count : 0,
      myComment:''
    }
  },
  // 组件里面的方法
  methods:{
  	plus(){
    	this.count ++;
    }
  }
}
</script>

<style>
	//组件的样式
</style>
```

## 基本语法

### 1、插值表达式

`{{ value }}`

### 2、`v-bind` 绑定属性

引号内部当作变量，vue会进行解析

```javascript
<div v-bind:'title'>{{ title }}</div>
简写
<div :bind='title'>{{ title }}</div>
```

### 3、`v-on`

相当于 `onclick`/`addEventListener`绑定事件处理函数

```javascript
<button v-on:click='plus'>+</button>
简写
<button :click='plus'>+</button>
```

### 4、`v-if`

`v-* `都是Vue的指令

```javascript
<button v-if='isLogin'>+</button>
<button v-else>Please Login</button>
```

### 5、`v-modal`

```javascript
 <input type="text" v-model="myComment">  //与数据的key 相同
```

### 6、`v-for`

必须添加 `:key` 表示唯一性

```javascript
/**
	key in obj    对象
  (item, index) in arr  数组
*/
<ul>
	<li v-for='(item,index) in arr' :key='item.id'></li>
</ul>
```

# 组件化构建

Vue利用ES模块化 -> Vue组件系统的构建

## 组件化

1. 抽象小型、独立、可预先定义配置的、可复用的组件。
2. 可复用性需要适当的考量，不需要重复使用的组件可以不考虑配置。 可配置性越高，功能性就越强。
3. 组件提纯，减少对外部的依赖

| <font style="color:#404040;">小型</font>     | <font style="color:#404040;">-> </font><font style="color:#404040;">页面的构成拆分成一个一个的小单元独立开发。</font> |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 独立                                         | <font style="color:#404040;">-> 每一个小单元尽可能独立开发。</font>                                                   |
| <font style="color:#404040;">预先定义</font> | <font style="color:#404040;">-> 小单元都可以先定义好，在需要的时候导入使用。</font>                                   |
| 预先配置                                     | -> 小单元可以接收一些在使用的时候需要的配置。                                                                         |
| 可复用                                       | -> 一个小单元可以在多个地方使用。                                                                                     |

# 应用实例、组件实例与根组件实例

## 应用实例

应用实例是通过createApp创建返回一个App应用实例。

应用实例主要时用来注册全局组件的。

```javascript
const app = createApp({});

console.log(app);
//返回原本的应用实例  可以链式调用
app
  .component("MyTitle", {
    data() {
      return {
        title: "This is my title1",
      };
    },
    template: `<h1 v-to-upper-case>{{ title }}</h1>`,
  })
  .directive("toUpperCase", {
    //设置自定义指令
    mounted(el) {
      el.addEventListener(
        "click",
        function () {
          this.textContent = this.textContent.toUpperCase();
        },
        false,
      );
    },
  });

app.mount("#app");
```

### 实例上暴露的方法

大多数这样的方法都会返回createApp创建出来的应用实例 允许链式操作

| 1.component                                      | 注册组件   |
| ------------------------------------------------ | ---------- |
| <font style="color:#404040;">2.directive </font> | 注册指令   |
| 3.filter                                         | 注册过滤器 |
| 4.use                                            | 使用插件   |

## 根组件实例

1. 根组件本质就是一个对象
2. createApp执行的时候需要一个根组件 `createApp({})`
3. 根组件是Vue渲染的起点
4. 根元素是一个HTML元素 `createApp`执行创建Vue应用实例时，需要一个HTML根元素。
   1. 如`<div id='app'><div>`
5. `mount`方法执行返回一个根组件实例
   1. vm -> ViewModel -> VM

## 组件实例

1. 每个组件都有自己的组件实例。
2. 一个应用中所有的组件都共享一个应用实例。
3. 无论时根组件还是应用内的其他组件，配置选项、组件行为（如生命周期）都是一样的。
4. 组件实例时可以添加属性的 `property` 如 data/props/component/methods...

# 生命周期

组件是有初始化过程的，在这个过程中，Vue提供了很多每个阶段运行的函数。

函数会在对应的初始化阶段自动运行。

<img src="https://cdn.nlark.com/yuque/0/2021/svg/12961835/1626414165076-46a1db46-2854-48b3-a7ce-2058e56b235b.svg" width="840" title="" crop="0,0,1,1" id="ZTOnx" class="ne-image">
