---
title: 列表渲染与 Vue 就地更新策略
date: 2022-01-01
tags:
  - Vue
---

# 列表渲染与 Vue 就地更新策略

# `v-for` 把一个数组对应成一组元素

1、`v-for` 指令可以将一个数组渲染成一个列表。语法格式是 `item in items` items是源数据数组，item是每一项被迭代数组的别名

2、`v-for` 块中，可以访问所有父作用域中的property

3、`v-for` 中第二个参数是可选项。表示当前的选项的索引

```javascript
const App = {
    template:`
        <div>
            <ul>
                <li v-for='(item,index) in students' :key="index">
                    <span>爱好：{{ hobby }}</span> -
                    <span>{{ item.name }}</span> -
                    <span>{{ item.age }}</span>
                </li>
            </ul>
        </div>
    `,
    data(){
        return{
            students:[
                {name:'zhangsan',age:'18'},
                {name:'lisi',age:'20'}
            ],
            hobby:'玩'
        }
    }
}
结果
爱好：玩 - zhangsan - 18
爱好：玩 - lisi - 20
```

# `v-for` 里使用对象

1、第二个参数是可选项 键名

2、第三个参数是可选项 索引值

3、遍历对象时，会按照 `Object.keys()` 的结果遍历。无法保证在不同的JS引擎下的结果都一直

# 维护状态

1、在更新`v-for` 渲染的元素列表是，默认采用“<font style="color:#FA541C;">原地更新</font>”策略。如果数据项的顺序被改变，Vue不会移动DOM元素来进行匹配数据项，而是在原来的元素基础上更新每个元素。

2、<font style="color:#FA541C;">只适用于不依赖子组件或临时DOM状态 </font>如 input 的列表渲染输出。

3、所以通过给每项元素提供一个 唯一的 key 来追踪每个节点的身份。从而重新排序现有的元素

# 在 `tenplate` 中使用` v-for`

```javascript
<ul>
  <template v-for="item in items" :key="item.msg">
    <li>{{ item.msg }}</li>
  </template>
</ul>
```

```javascript
const App = {
  template: `
        <div>
            <ul>
                <li v-for='(item,key,index) in person' :key='key'>
                    <span>{{ item }}</span>  -
                    <span>{{ key }}</span>  -
                    <span>{{ index }}</span>
                </li>
            </ul>
        </div>
    `,
  data() {
    return {
      person: {
        name: "wangwu",
        age: 22,
      },
    };
  },
};

结果;
wangwu - name - 0;
22 - age - 1;
```

# `v-for` 与 `v-if` 同时使用

如果 `v-for` 与 `v-if` 用于一个元素使用，`v-if` 的优先级高于 `v-for`

```javascript
<li v-for="todo in todos" v-if="!todo.isComplete">
  {{ todo.name }}
</li>
v-if  ->  todo  访问不到  不存在todo
v-for ->  todo  可以访问执行

在渲染期间,属性todo确实被访问了,但是todo并没有定义在实例上,所以取不到
```

# 在组件中使用`v-for`

1、组件上可以和使用普通元素一样使用v-for

```javascript
<my-component v-for="item in items" :key="item.id"></my-component>
```

2、所有数据都不会默认传递到子组件上，因为子组件有自己独立的作用域。可以通过props将数据传递到组件中。

```javascript
<my-component
  v-for="(item, index) in items"
  :item="item"
  :index="index"
  :key="item.id"
></my-component>
```

# 删除li的案例

点击 item-2 的 delete 按钮 -> item-3 进入 item2 -> 删除 item-3 的li

```javascript
<template>
  <div id="app">
    <ul>
      <li v-for="(item,index) of list" :key="index"
      >
      <span>{{ item.value }}</span>-<button @click="deleteItem(index)">Del</button>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  name: "App",
  data() {
    return {
      list: [
        { id: 1, value: "item-1" },
        { id: 2, value: "item-2" },
        { id: 3, value: "item-3" },
      ],
      isLogin: false
    };
  },
  methods: {
    deleteItem(index){
      this.list.splice(index,1)
    }
  },
};
</script>
```

# 用户登录/退出案例

有相同的a标签，只有内容有区别 当出发 v-if 的时候 就a标签这块地 不会删除与创建 而是直接在当前的a标签上 直接修改内容

```javascript
<template>
  <div id="app">
    <div v-if="isLogin">
      <span>欢迎</span>
			<a href="javascript:;" @click="isLogin = false">Mtx</a>
    </div>
		<div v-else>
      <a href="javascript:;" @click="isLogin = true">登录</a>
			<a href="#">注册</a>
    </div>
  </div>
</template>
<script>
export default {
  name: "App",
  data() {
    return {
      isLogin: false
    };
  },
};
</script>
```

# input输入框的情况下

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1629426926430-a09da0b5-8e4f-47ea-8b71-e016085b5b8d.png" width="298.5" title="" crop="0,0,1,1" id="OSlUH" class="ne-image"><img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1629426936129-e339bd15-b8fa-4ea5-a33c-abc96ce8638a.png" width="317" title="" crop="0,0,1,1" id="k0ABT" class="ne-image">

```javascript
<template>
  <div id="app">
    <ul>
      <li v-for="(item,index) of list" :key="index"
      >
      <span>{{ item.value }}</span>-<button @click="deleteItem(index)">Del</button>
      <input type="text" />
      </li>
    </ul>
  </div>
</template>
```

# 就地更新的问题

当li被删除 input 里面的值还在里面。因为这里的input是临时的DOM，在元素复用时，input 里面的值也会保留

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1629428903602-02080080-0c60-4f12-9c2a-62471321b62e.png" width="795.5" title="" crop="0,0,1,1" id="uxbml" class="ne-image">

# 解决方案

[建议](https://v3.cn.vuejs.org/style-guide/#keyed-v-for-essential)<font style="color:#2C3E50;">尽可能在使用 </font>`v-for`<font style="color:#2C3E50;"> 时提供 </font>`key`<font style="color:#2C3E50;"> attribute，除非遍历输出的 DOM 内容非常简单，或者是刻意依赖默认行为以获取性能上的提升。</font>
