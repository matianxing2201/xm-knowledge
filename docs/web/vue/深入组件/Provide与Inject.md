---
title: Provide 与 Inject
date: 2022-01-01
tags:
  - Vue
---

# Provide 与 Inject

# 单项数据流

一种组件化中的数据流向规范

数据总是从父组件向子组件流动 -> 子组件不可以改变父组件流入的数据（属性props）

子组件 -> 更改数据 -> 数据属于父组件定义的

# 传递静态或动态的Prop

```javascript
<my-props title="This is my title"></my-props> //静态传入一个字符串
<my-props :title="obj.title"></my-props>  // v-bind的简写 通过 ： 动态赋值
```

### 传入一个数字

```javascript

<!-- 即便 `42` 是静态的，我们仍然需要 `v-bind` 来告诉 Vue     -->
<!-- 这是一个 JavaScript 表达式而不是一个字符串。             -->
<my-props :likes="42"></my-props>

<!-- 用一个变量进行动态赋值。-->
<my-props :likes="obj.likes"></my-props>
```

### 传入一个布尔值

```javascript
<my-props :published="false"></my-props>

<!-- 也可以传递一个变量-->
<my-props :published="obj.published"></my-props>
```

### 传入数组

```javascript
<my-props :list="[1,2,3]"></my-props>

<!-- 也可以传递一个变量-->
<my-props :list="obj.list"></my-props>
```

### 传入对象

```javascript
<my-props :obj="{ a:1, b: 2 }"></my-props>

<!-- 也可以传递一个变量-->
<my-props :obj="obj.obj"></my-props>
```

### 传入一个对象的所有property

把对象中的所有属性都作为prop传入，可以通过不带参数的 v-bind 取代 v-bind:prop-name

```javascript
data:{
	a: 1,
  b: 2
}
<my-props v-bind="data"></my-props>  等同于
<my-props v-bind:a = "a" v-bind:b = 'b'></my-props>
```

# Props验证

- 提供了定制prop验证的方式。如果不被满足Vue会在浏览器中警告。
- null 与 undefined 会通过任何类型的验证

```javascript
export default {
  name: "Props",
  props: {
    // null 与 undefined 会通过任何类型的验证
    propA: Number, //基础类型检查 验证只能是数字类型
    //可以是多个可能的类型
    propB: [String, Number],
    //验证必填
    propC: {
      type: String,
      require: true,
    },
    //带有默认值的数字 原始值直接设置默认值  应用值  工厂函数函数   返回一个新的引用
    propD: {
      type: Number,
      default: 100,
    },
    propE: {
      type: Object,
      default: function () {
        return {
          name: "this is default name",
        };
      },
    },
  },
};
```

## 检查类型

可以是一下原生构造函数中的一个

| String | Number | Boolean | Array | Object | Date | Function | Symbol | Promise |
| ------ | ------ | ------- | ----- | ------ | ---- | -------- | ------ | ------- |

也还可以是一个自定义的构造函数

```javascript
function Person(firstName, lastName){
	this.firstName = firstName
  this.lastName = lastName
}
<!--------------------------------->
 props:{
 		name: Person
 }
```

# Props的命名规范

HTML中的属性名是大小写不敏感的，浏览器会把所有大写字符解释为小写字符，当在HTML中是使用使用kebab-case（短横线分割）命名。在模板中使用camelCase（驼峰命名）
