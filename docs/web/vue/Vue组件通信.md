---
title: Vue 组件通信
date: 2022-01-01
tags:
  - Vue
---

# Vue 组件通信

# 1、props/$emit

父组件通过props的方式向子组件传递。子组件通过实例方法$.emit 触发自定义事件，父组件监听自定义事件并绑定事件处理函数执行。

## 父传子

```javascript
父组件
<template>
  <div id="app">
    //设置定义自定义属性 并将name 传递到子组件
    <Child :name='name'></Child>
  </div>
</template>


<script>
import Child from './components/Child'   //引入子页面
export default {
    name:'App',
    data(){
      return {
        name:'Mtx'
      }
    },
  //注册
    components:{
      Child
    }

}
</script>

```

```javascript
子组件
<template>
  <div>
     {{ name }}

  </div>
</template>

<script>
export default {
    name:'Child',
    /*
    *   通过props 验证接受传递过来的值
    **/
    props:{
    	name:String, //类型是字符串
      required:true, //是否必填
      default:'zhangsan'  //默认值   默认值可以是对象 函数
      default(){
      	return {
        	name:'zhangsan'
        }
      }
    }

}
</script>

<style>

</style>
```

## 子传父

通过自定义事件 向父组件传递参数 父组件监听传递过来的参数名来执行自定义的逻辑

```javascript
父组件
 <Child :name='name' @changeName="upName"></Child>

export default {
    name:'App',
    methods:{
      upName(value){
        this.name = value
      }
    }
}
```

```javascript
 <button @click='changeName'>change</button>

export default {
    name:'Child',
    methods:{
        changeName(){
            this.$emit('changeName','lisi')
        }
    }
}
```

# 2、Event bus

通过创建一个空的vue实例作为事件中心，用它来触发和监听事件。从而实现父子、兄弟、跨级之间的通信。当项目比较大时推荐使用Vuex

```javascript
main.js
export const eventBus = new Vue();


兄组件
import { eventBus } from 'main.js'
eventBus.$emit('changeData','10');

弟组件
import { eventBus } from 'main.js'
在create 钩子函数执行的时候 监听 兄组件的 changeData
create(){
	eventBus.$on('changeData', (data) => {
  	this.data = data;
  })
}
```

# 3、Vuex

1. Vuex实现了一个<font style="color:#FA541C;">单向数据流</font>，在全局拥有一个State存放数据。
2. 当组件要更改State中的数据时，<font style="color:#FA541C;">必须通过Mutation进行</font>，Mutation同时提供了订阅者模式供外部插件调用获取State数据的更新。
3. 而当所有异步操作(常见于调用后端接口异步获取更新数据)或批量的同步操作需要走Action，但<font style="color:#FA541C;">Action也是无法直接修改State</font>的，还是需要通过Mutation来修改State的数据。最后，根据State的变化，渲染到视图上。

详情在Vuex笔记中。。。

# 4、组件中可以使用 `<font style="color:#FA541C;">$parent</font>` 和 `<font style="color:#FA541C;">$children</font>` 获取到父组件实例和子组件实例。从而获取数据

# 5、`<font style="color:#FA541C;">$refs</font>` 获取组件实例，获取数据
