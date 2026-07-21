---
title: Vue Router 进阶
date: 2022-01-01
tags:
  - Vue
  - Vue Router
---

# Vue Router 进阶

# 导航守卫

## 1、全局前置守卫

当一个导航触发时，全局前置守卫按照创建的顺序调用。

### 参数

#### to：Route

即将要进入的目标路由对象

#### from：Router

当前导航正要离开的路由

#### next：Function

1. 一定需要调用next方法来resolve这个钩子。next执行后才能成功进入目标路由
2. next(false) 可以中断当前的导航。
3. next()的值可以是字符串，或是一个对象 `next('/')` 或者 `next({ path : '/' })`

```javascript
const router = new VueRouter({ ... })

router.beforeEach((to, from, next) => {
  // 进行逻辑判断 如用户未登录或身份认证错误 执行next(false) 或者进入登录的路由
  if(!Login){
  	next({ name: 'Login})
  }
  next()
})
```

## 全局后置钩子

后置的钩子与前置守卫不同。后置猴子不会接收`next`函数也不会改变导航本身

```javascript
router.afterEach((to, from) => {
  // ...
});
```

## 路由独享守卫

在单独的路由上配置自定义的 `beforeEnter` 守卫。用法与全局前置守卫方法参数一样。

```javascript
const router = new VueRouter({
  routes: [
    {
      path: "/foo",
      component: Foo,
      beforeEnter: (to, from, next) => {
        // ...
      },
    },
  ],
});
```

# 路由懒加载

在项目打包构建时，JavaScript包会变的非常大，影响页面加载速度。从而可是结合Vue的一部组件与Webpack的代码分割功能没实现路由组件的懒加载。用到那个路由加载那个路由不是一开始全部加载。从而提高加载速度。

```javascript
const Foo = () => import(/* webpackChunkName: "group-foo" */ "./Foo.vue");
const Bar = () => import(/* webpackChunkName: "group-foo" */ "./Bar.vue");
const Baz = () => import(/* webpackChunkName: "group-foo" */ "./Baz.vue");
```
