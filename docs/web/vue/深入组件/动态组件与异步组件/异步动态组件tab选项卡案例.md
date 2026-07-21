---
title: 异步/动态组件 tab 选项卡案例
date: 2022-01-01
tags:
  - Vue
---

# 异步/动态组件 tab 选项卡案例

### App.vue

```javascript
<template>
  <div class="tab">
    <div class="nav">
      <div
        v-for="(value, key) in navData"
        :key="key"
        :class="['nav-item', { active: currentTab == key }]"
        @click="onSetCurr(key)"
      >
        {{ value }}
      </div>

      <div class="component">
        <component :is="currentComponent"></component>
      </div>
    </div>
  </div>
</template>

<script>
import { Intro, List, Article } from "./components/AsyncComponents";

export default {
  name: "App",
  components: {},
  data() {
    return {
      currentTab: "intro",
      navData: {
        intro: "Intro",
        list: "List",
        article: "Article",
      },
    };
  },
  computed:{
    currentComponent(){
      switch (this.currentTab){
        case 'intro':
          return Intro;
        case 'list':
          return List;
        case 'article':
          return Article;
      }
    }
  },
  methods: {
    onSetCurr(value) {
      this.currentTab = value;
    },
  },
};
</script>

<style lang="scss">
.tab {
  width: 500px;
  height: 500px;
  border: 1px solid #000;
  margin: 50px auto;

  .nav {
    height: 50px;
    border-bottom: 1px solid #000;

    .nav-item {
      float: left;
      width: 33.33%;
      height: 100%;
      text-align: center;
      line-height: 50px;

      &.active {
        background-color: #000;
        color: #fff;
      }
    }
  }

  .component{
    padding: 30px;
    box-sizing: border-box;
  }
}
</style>

```

### AsyncComponents.js

```javascript
import { defineAsyncComponent } from "vue";
import Loading from "./Loading";
import Error from "./Error";

export const Intro = defineAsyncComponent({
  // 工厂函数  返回一个 Promise
  loader: () =>
    new Promise((resolve) =>
      setTimeout(
        () => resolve(import(/* webpackChunkName: "Intro" */ "./Intro")),
        1000,
      ),
    ),
  // 异步组件加载时的Loading 组件
  loadingComponent: Loading,
  //加载失败时使用的组件
  errorComponent: Error,
  // 在显示 loadingComponent 之前的延迟 | 默认值：200（单位 ms）
  delay: 0,
});
export const List = defineAsyncComponent(
  () => import(/* webpackChunkName: "List" */ "./List"),
);
// export const Article = defineAsyncComponent(() =>
//   import(/* webpackChunkName: "Article" */ './Article'),
// )

// 延迟异步加载
export const Article = defineAsyncComponent(() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(import(/* webpackChunkName: "Article" */ "./Article.vue"));
    }, 1000);
  });
});
```

### Intro.vue

```javascript
<template>
  <div>
    <h1>Intro</h1>
    <p>This is Intro</p>
  </div>
</template>

<script>
export default {
  name: "Intro",
};
</script>

<style>
</style>
```
