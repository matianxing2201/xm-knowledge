---
title: Setup
date: 2022-01-01
tags:
  - Vue
---

# Setup

## 1、参数

### props

父组件传入的属性在props中可以获取。 `setup`函数中的`props`是响应式的，当传入新的`prop`时，它将会被更新。

```javascript
export default {
  props: {
    title: String,
  },
  setup(props) {
    console.log(props.title);
  },
};
```

> 1. <font style="color:#FA541C;">如实使用ES6去结构props 那么prop将会失去响应式。</font>
> 2. <font style="color:#FA541C;">如果需要结构prop，可以在</font>`<font style="color:#FA541C;">setup</font>`<font style="color:#FA541C;">函数中使用</font>`<font style="color:#FA541C;">toRefs</font>`<font style="color:#FA541C;">函数来实现。</font>
> 3. <font style="color:#FA541C;">也可以使用 toRef 单独创建。</font>

```javascript

import { toRefs, toRef } from 'vue'

setup(props) {
  const { title } = toRefs(props);
  const { author } = toRef(props, 'author');

  return{
    title,
    author
  }
  console.log(title.value)
}


```

### context

`context`是一个普通的`JavaScript`对象(<font style="color:#FA541C;">不是响应式的，</font>可以使用ES6结构)。暴露了以下值:

```javascript
export default {
  setup(props, context) {
    // Attribute (非响应式对象，等同于 $attrs)
    console.log(context.attrs)

    // 插槽 (非响应式对象，等同于 $slots)
    console.log(context.slots)

    // 触发事件 (方法，等同于 $emit)
    console.log(context.emit)

    // 暴露公共 property (函数)
    console.log(context.expose)
  }
}

export default {
  setup(props, { attrs, slots, emit, expose }) {
    ...
  }
}
```

`attrs`和`slots`是有状态的，当组件内容更新时，他们也会随之更新。所以应该避免对他们进行结构。

## 2、使用 `this`

在`setup`内部，没有this，因为`setup()`是在解析其选项之前被调用。

## 3、实例

```javascript
<script>
import { computed, toRefs } from "vue";

export default {
  name: "VSetup",
  /**
   * 组合式API的入口函数，所有组合式API都可以放入到setup内部执行
   * 组件被创建之前,beforeCreate,props被解析之后，created执行
   * 使用组合式API时, 没有beforeCreate与created生命周期函数
   *
   * 在组件创建之前自动执行
   */
  props: {
    content: String,
  },
  /**
   * @param {选项API中props选项的引用} props
   * @param {
   *      attrs -> this.attrs
   *      slots-> this.$slots
   *      emit->this.$emit
   *      expose->暴露属性给父组件
   * } ctx
   */

  setup(props, ctx) {
    // setup(props, ctx) {
    // const { title, content, author } = props;  //  失去响应式
    // const { title, content, author } = toRefs(props);
    // console.log(content);
    // const myContent = computed(() => "content:" + content.value);

    const { content } = toRefs(props);
    const myContent = computed(() => "Content:" + content.value);

    console.log(ctx);
    // this.$attrs 非prop的attributes
    // this.$emit  -> ctx.emit
    // this.$slot.default() -> 匿名slot
    // this.$slot.name() -> 具名 slot name
    // attrs slots 属性都是非响应式的

    // data computed methods refs -> this
    // setup组件被创建之前执行的,执行期 -> this
    return {
      myContent
    }
  },


  // return {
  //   myContent,
  // };
  // },
};
</script>
```
