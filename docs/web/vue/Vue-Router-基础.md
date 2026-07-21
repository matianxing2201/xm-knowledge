---
title: Vue Router 基础
date: 2022-01-01
tags:
  - Vue
  - Vue Router
---

# Vue Router 基础

## 使用

### 1、在main.js中引入 router

```javascript
import VurRouter from "vue-router";
```

### 2、注册router 使用插件

执行install方法。 通过mixin方法 给所有的组件注册beforeCreate()与destroyed()方法

```javascript
Vue.use(VurRouter);
```

### 3、路由配置

```javascript
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];
```

### 4、创建VueRouter实例，并把配置的路由信息赋值给一个常量

```javascript
const router = new VueRouter({
  routes,
  mode: "history",
});
/**
	默认hash模式
*/
```

### 5、实例化VueRouter对象传到Vue实例中

```javascript
new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
```

## router-link

使用自定义组件 `router-link` 创建连接。使得Vue Router可以在不重新加载页面的情况下修改URL，处理URL。

## router-view

显示对应的组件。

## 设置active链接样式

### 1、默认样式选中

![](https://cdn.nlark.com/yuque/0/2021/png/12961835/1628042685815-42897789-b8be-4eea-a3f2-9ede4451644a.png)

### 2、自定义选中样式

需要设置 active-class="active" 如下

![](https://cdn.nlark.com/yuque/0/2021/png/12961835/1628043127460-d096e534-0ebf-4984-8cfc-cd39e31c19be.png)

### 3、设置渲染标签

给router-link标签设置tag属性为自定义的标签

![](https://cdn.nlark.com/yuque/0/2021/png/12961835/1628043542135-14d419df-413e-4f74-9713-d94ebc028863.png)

渲染后的样式

![](https://cdn.nlark.com/yuque/0/2021/png/12961835/1628043576242-4401d3b7-cb31-471e-a437-66f09f1ec5d9.png)

### 4、exact属性

"是否激活"默认类名的依据时**包含匹配。**当当前路径是以`/about` 开头，`<router-link to='/about'>`会被设置css类名。

这个规则下，每个路由都会激活`<router-link to="/">`会导默认首页会一直存在active类。这时需要设置精确匹配模式 如下

```javascript
<!-- 这个链接只会在地址为 / 的时候被激活 -->
<router-link to="/" exact></router-link>
```

## hash模式与history模式

### 1、hash：

1. 不需要在创建vueRouter实例的时候添加额外的配置
2. 使用 URL hash 值来作路由。支持所有浏览器，包括不支持 HTML5 History Api 的浏览器。兼容性较好
3. 不需要配置服务器（因为始终都要返回index.html,使用hash来模拟一个完整的URL，当URL改变时，页面不会重新加载）

### 2、history：

1. 创建vueRouter实例时 设置 **mode **属性，值为 '**history**'
2. 配置后台服务器始终返回index.html页面。 [后端配置例子 Apache/nginx/Node等](https://router.vuejs.org/zh/guide/essentials/history-mode.html#%E5%90%8E%E7%AB%AF%E9%85%8D%E7%BD%AE%E4%BE%8B%E5%AD%90)
3. 依赖 HTML5 History API 和服务器配置。

## 编程式导航

可以通过借用router的实例方法，来实现导航跳转。

Vue实例内部可以通过`$router`访问路由实例。所以可以通过`this.router.push`来修改

当点击`<router link to:'...'>`的时候相当于 `router.push(...)`。

|          声明式           |       编程式       |
| :-----------------------: | :----------------: |
| `<router-link :to="...">` | `router.push(...)` |

### 1、router.push

#### 参数

字符串/对象

```javascript
// 字符串
router.push("/");

// 对象
router.push({ path: "/" });
```

### 2、router.replace

与push作用相同都会跳转页面，但是唯一的不同他不会向 history 添加记录

| 声明式 | 编程式 |
| :-----------------------------: | :-----------------: |
| `<router-link :to="..." replace>` | `router.replace(...)` |

### 3、router.go

参数式一个整数，在hisroty记录中向前或向后的操作

```javascript
// 在浏览器记录中前进一步，等同于 history.forward()
router.go(1);

// 后退一步记录，等同于 history.back()
router.go(-1);

// 前进 3 步记录
router.go(3);

// 如果 history 记录不够用，失败
router.go(-100);
router.go(100);
```

## 动态路由匹配

当一个路劲参数使用 `:` 标记。当匹配到路由时，参数值会被设置到 this.$route.params，可以在每个组件内使用。

```javascript
const routes = [
  {
    path: '/',
    component: Home
  },
  {
   //动态路径参数 以冒号开头
    path:'/user/:id',
    component:() => import('../views/User.vue')
  }
]


 <router-link to='/user/1'>User</router-link>
```

route对象 参数会在params中看到

![](https://cdn.nlark.com/yuque/0/2021/png/12961835/1628061938584-30f275dd-bf76-4f5e-a6d3-743cf58875b0.png)

### 监听路由参数变化

当使用路由参数的时候，如从 `/user/1` 导航到 `/user2`，组件会被复用。因为两个路由都是渲染同一个组件，不会被创建，且复用组件。会导致生命周期钩子函数不会被调用。可以使用 watch `$route`来监听参数来触发路由变更

```javascript
export default {
  name: "User",
  data() {
    return {
      // id:this.$route.id,
    };
  },
  watch: {
    $route(to, from) {
      // 对路由变化作出响应...
      console.log(to, from);
    },
  },
};
```

## 嵌套路由

如需将组件渲染到父组件的`router-view`中，需要再路由中配置 `children`

```javascript
const routes = [
  {
    path: "/user/",
    name: "User",
    component: () => import("../views/User.vue"),
    children: [
      {
        path: "child1",
        //path 属性中 不添加  /  表示 再一级路由的后面添加地址  如  http://localhost:8080/user/child2
        //              以   / 开头的嵌套路径将视为根路径      如  http://localhost:8080/child2
        component: () => import("../views/Child1.vue"),
      },
      {
        path: "child2",
        component: () => import("../views/Child2.vue"),
      },
    ],
  },
];
```

## 命名路由

除了 `path` 之外，还可以使用 `name` 。优点以下

1. 没有硬编码的 URL
2. `params` 的自动编码/解码
3. 防止在 URL 中输入错误
4. 绕过路径排序

```javascript
const routes = [
  {
    path: "/about",
    name: "About",
    component: () => import("../views/About.vue"),
  },
];
```

在 `<router-link>` 组件的 to 属性传递一个对象，如果有参数 在添加params属性 传入参数

```javascript
<router-link :to="{ name: 'About', params: { username: 'xxx' }}">
  User
</router-link>
```

## 重定向

配置 redirect 属性 ，值可以是一个字符串也可以是一个对象

```javascript
const routes = [
  {
    path: "/about",
    name: "About",
    redirect: {
      name: "User",
    },
  },
];
```

### 使用场景

当页面地址没有匹配到路由的时候 设置一个使用通配符匹配的 \* 在最后一个 因为他是自上而下执行 当没有匹配到 就会进入

\*路由 用来显示 404的页面信息
