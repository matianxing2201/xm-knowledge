---
title: defineAsyncComponent
date: 2022-01-01
tags:
  - Vue
---

# defineAsyncComponent

创建一个异步加载的组件。

## 参数

`defineAsyncComponent`接收一个返回`Promise`的工厂函数。

```javascript
// 局部注册
export const Intro = defineAsyncComponent({
 import(/* webpackChunkName: "Intro" */ './Intro'),  // import
})

// 全局注册
export const Intro = defineAsyncComponent({
 import(/* webpackChunkName: "Intro" */ './Intro'),  // import      /*  */ 注释中显示chunks的名称
})

app.component('async-component', Intro)

```

`defineAsyncComponent`可以接收一个对象格式的参数

```javascript
import { defineAsyncComponent } from "vue";

const AsyncComp = defineAsyncComponent({
  // 工厂函数  返回一个 Promise   延迟1秒加载
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

  /**
   *
   * @param {*} error 错误信息对象
   * @param {*} retry 一个函数，用于指示当 promise 加载器 reject 时，加载器是否应该重试
   * @param {*} fail  一个函数，指示加载程序结束退出
   * @param {*} attempts 允许的最大重试次数
   */
  onError(error, retry, fail, attempts) {
    if (error.message.match(/fetch/) && attempts <= 3) {
      // 请求发生错误时重试，最多可尝试 3 次
      retry();
    } else {
      // 注意，retry/fail 就像 promise 的 resolve/reject 一样：
      // 必须调用其中一个才能继续错误处理。
      fail();
    }
  },
});
```
