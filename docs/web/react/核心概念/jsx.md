---
title: JSX
date: 2022-01-01
tags:
  - React
  - JSX
---

# JSX

# 1、什么是JSX

- 一种标签语法，JS进行的语法扩展
- 不是字符串、不是HTML标签
- 描述UI呈现与交互的直观的表现形式
- 生成React元素

# 2、为什么React不把视图标记和逻辑分开

- 渲染和UI标记是有逻辑耦合的
- 即使是这样的耦合，也能实现关注点分离

# 3、JSX插值表达式

表达式：一切有效的（符合JS编程逻辑的）表达式 `{ ... }`

被JSX编译以后 -> React元素 -> 普通的对象

```javascript
const rEL2 = <h1>this is my first jsx experinence</h1>;

const rEL = React.createElement(
  "h1",
  {
    className: "title",
  },
  "this is my first JSX experience",
);
console.log(rEL, rEL2);
```

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1629031913741-ee8ceca3-2e2c-45d6-a205-494984bff8dd.png" width="1165" title="" crop="0,0,1,1" id="TKCvr" class="ne-image">
