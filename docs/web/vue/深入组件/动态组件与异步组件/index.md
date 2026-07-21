---
date: 2022-01-01
title: 动态组件与异步组件
---

# 动态组件与异步组件

```tree
- name: 异步/动态组件 tab 选项卡案例
  href: /xm-knowledge/web/vue/深入组件/动态组件与异步组件/异步动态组件tab选项卡案例
- name: defineAsyncComponent
  href: /xm-knowledge/web/vue/深入组件/动态组件与异步组件/defineAsyncComponent
```

# keep-alive

切换组件时，缓存组件，保持组件的状态，避免反复渲染导致性能问题

```javascript
// 失活的组件将会被保存 在动态组件上使用
<div class="login-component">
  <keep-alive>
  	<component :is="currentTabComponent"></component>
	</keep-alive>
</div>
```

# 动态组件

在交互中，组件的渲染时不确定的，根据交互的操作来决定渲染那个组件

# 异步组件

没有必要在当前进行加载的组件，被分割成代码文件，按需从服务器上下载并加载

在Vue2中 可以通过 `MobileLogin => import('./MobileLogin.vue')`来实现

在Vue3中 通过 `defineAsyncComponent` 方法。它返回一个Promise。就可以动态的导入。

```javascript
import { defineAsyncComponent } from "vue";

//Vue2
AsyncComp: () => import("./xxxx");

//Vue3
const MobileLogin = defineAsyncComponent(() => import("./MobileLogin.vue"));
export default {
  name: "MainlLogin",
  components: MobileLogin,
};
```
