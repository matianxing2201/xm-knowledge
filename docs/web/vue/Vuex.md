---
title: Vuex
date: 2022-01-01
tags:
  - Vue
  - Vuex
---

# Vuex

# 什么是Vuex？

为Vue.js应用程序开发的**状态管理模式 + 库。**它采用集中式存储管理应用的所有组件的状态，并以响应的规则保证状态以一种可预测的方式发生变化。

# 核心概念

## State

Vuex使用单一状态树。所有的数据都存放再state中

### 获取 Vue 组件中的 Vuex 状态

因为Vuex的状态存储是响应式的，从store实例中读取状态嘴方便的方法就是通过计算属性中返回某个状态

```javascript
.vue页面
export default {
    computed:{
        counter(){
            return this.$store.state.counter
        }
    }
}
```

```javascript
store / index.js;
export default new Vuex.Store({
  state: {
    counter: 0,
  },
});
```

## Getter

当多个组件中需要用到这个属性时，除了使用重复写这一个函数，或者抽离到公共的函数做操作都不理想。 这时候可以使用 store 中定义的 "getter" (store中的计算属性)

```javascript
export default new Vuex.Store({
  state: {
    counter:0
  },
  getters:{
    doubuleCounter: state =>{
      return state.counter * 2
    },
    strCounter:state=>{
      return `点击了${state.counter}次`
    }
  },
})

视图
computed:{
  totol(){
    return this.$store.getters.strCounter
  }
}
```

### `mapGetters` 辅助函数

`mapGetters` 辅助函数 的作用 是将 store 中的 getter映射到局部计算属性

```javascript
import { mapGetters } from "vuex";

export default {
  // ...
  computed: {
    // 使用ES6的对象展开运算符将 getter 混入 computed 对象中
    ...mapGetters([
      "strCounter",
      // ...
    ]),
  },
};
```

## Mutation**<font style="color:#FA541C;"></font>**

Vuex的store中想要改变状态的唯一方法就是通过 提交<font style="color:#2C3E50;">mutation。第一个参数是state</font>

```javascript
export default new Vuex.Store({
  state: {
    counter: 0,
  },
  mutations: {
    increment(state) {
      // 变更状态
      state.counter++;
    },
  },
});
```

在视图中调用 方式 触发 <font style="color:#2C3E50;">mutation </font>并调用处理函数

```javascript
methods:{
	increment(){
  	this.$store.commit('increment')
  }
},
```

### 1、提交荷载（Payload）

在commit 中 传入额外的参数。

通常情况下，荷载是一个对象。

```javascript
视图
methods:{
	increment(){
  	this.$store.commit('increment',{ setp:10 })
  }
},
```

```javascript
store
mutations: {
  state: {
    counter:0
  },
  increment (state, payload) {
    state.counter += payload.step
  }
}
```

### 2、对象提交风格

```javascript
视图
this.store.commit({
  type: 'increment',
  step: 10
})
mutations: {
  increment (state, payload) {
    state.count += payload.step
  }
}
```

### 3、Mutation 必须是同步函数

为了能使devtools 追踪状态变化

### 4、mapMutations辅助函数

使用mapMutations辅助函数将组件中的methods映射为 store.commit 调用

```javascript
import { mapMutations } from "vuex";

export default {
  // ...
  methods: {
    ...mapMutations([
      "increment", // 将 `this.increment()` 映射为 `this.$store.commit('increment')`
      // `mapMutations` 也支持载荷：
      "incrementBy", // 将 `this.incrementBy(amount)` 映射为 `this.$store.commit('incrementBy', amount)`
    ]),
    ...mapMutations({
      add: "increment", // 将 `this.add()` 映射为 `this.$store.commit('increment')`
    }),
  },
};
```

## Action

1. Action是通过提交mutation来更改state中的状态 自己不能直接更改
2. 异步操作通常是通过Action进行提交

```javascript
store.js;
const store = new Vuex.Store({
  state: {
    count: 0,
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
  actions: {
    // 也可以使用 参数结构 简化 contenxt { commit }
    increment(context) {
      //可以执行异步操作
      setTimeout(() => {
        context.commit("increment");
      }, 1000);
    },
  },
});
```

```javascript
视图  Action 通过 stroe.dispatch方法触发
this.$store.dispatch('increment')
```

### mapActions 辅助函数

```javascript
import { mapActions } from "vuex";

export default {
  name: "Counter",

  methods: {
    ...mapActions([
      "increment", // 将 `this.increment()` 映射为 `this.$store.dispatch('increment')`
    ]),
  },
};
```

## Module

当使用单一状态树，当应用变得非常复杂时，store对象会变得非常臃肿。为了解决这些问题 Vux 可以将 store 分割成模块。 每个模块用用自己的state、mutation、action、getter

```javascript
const moduleA = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... }
}

const store = new Vuex.Store({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态
```

```javascript
{
  store.complexPicSearch.imageCutBase64[subTabActive] == "#" ? (
    <div className={optionsPicSearchBtn}>
      <input
        type="file"
        ref="picSearch"
        onChange={() => {
          picSearchChange(this.refs.picSearch);
        }}
        tabIndex={store.g.getTabIndex()}
        title="点击选择图片"
      />
      <span>
        {store.complexPicSearch.imageCutBase64[subTabActive] != "#"
          ? "重新上传"
          : "选择图片"}
      </span>
    </div>
  ) : (
    <>
      {/* 全景搜图-预览 */}
      {isAllowed("YI_TU_SOU_TU") ? (
        <div className={picSearchContent}>
          <div
            className="options-preview-clean"
            onClick={() => {
              cleanPicSearch();
            }}
            title="关闭">
            <i className="icon i-tubiao_icon"></i>
          </div>
          <img src={store.complexPicSearch.imageCutBase64[subTabActive]} />
          <div className="options-control-btns">
            <div className="control-btns-wrapper">
              <div className="btns-item">
                <i
                  className="icon i-icons03"
                  onClick={() => {
                    store.complexPicSearch.imageCutBase64[subTabActive] == "#";
                  }}></i>
              </div>
              <div className="btns-item">
                <i
                  className="icon i-icons03"
                  onClick={() => {
                    picSearchCrop();
                  }}></i>
              </div>
            </div>
          </div>
          {/* <div className="options-preview-control" onClick={() => { picSearchCrop() }}>框选目标</div> */}
        </div>
      ) : null}
    </>
  );
}
```
