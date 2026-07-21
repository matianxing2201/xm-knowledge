---
title: 非 Prop 的 Attribute
date: 2022-01-01
tags:
  - Vue
---

# 非 Prop 的 Attribute

一个非 prop 的 attribute 是指传向一个组件，但是改组件并没有相应 **props** 或 **emits **定义的 attribute。

## Attribute 继承

当组件返回单个根节点时，非 prop 的 attribute 将自动添加到根节点的 attribute 中。

```javascript
<my-select>
  :value="3"
  modal="123"
  id="my-Selector"
  class="my-selector"
</my-select>

/* MySelect 视图 */
<select>
    <option value="1">Yesterday</option>
    <option value="2">Today</option>
    <option value="3">Tomorrow</option>
</select>
```

## 禁用 Attribute 继承

如果不需要组件的根元素继承 attribute，可以在组件的选项中设置 `inheritAttrs:false`。

禁用 attribute 继承常见的场景是需要将 attribute 应用于根节点之外的其他元素。

```javascript
app.component("date-picker", {
  inheritAttrs: false,
  template: `
    <div class="date-picker">
      <input type="datetime-local" v-bind="$attrs" />
    </div>
  `,
});
```

## 多个根节点上的 Attribute 继承

具有多个根节点的组件不具有自动 atribute fallthrough(隐式贯穿)行为。如果没有显示绑定 `$attrs`，控制台会告警。

```javascript
<custom-layout id="custom-layout" @click="changeValue"></custom-layout>


// 这将发出警告
app.component('custom-layout', {
  template: `
    <header>...</header>
    <main>...</main>
    <footer>...</footer>
  `
})

// 没有警告，$attrs 被传递到 <main> 元素
app.component('custom-layout', {
  template: `
    <header>...</header>
    <main v-bind="$attrs">...</main>
    <footer>...</footer>
  `
})
```
