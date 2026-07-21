---
title: class 与 style 的视图绑定
date: 2022-01-01
tags:
  - Vue
---

# class 与 style 的视图绑定

因为class与style 都是 attribute属性，所以可以用`v-bind`进行处理，因为vue对`v-bind:class/style` 进行了特殊的封装。除了可以接收字符串类型，也可以接收<font style="color:#FA541C;">数组</font>或者<font style="color:#FA541C;">对象</font>

# class绑定

## 1、对象语法

### 根据属性进行绑定class

```javascript
var App = {
    data() {
        return {
            title: 'Title',
            isActive: true
        }
    },
    template: `
        <h1 :class="{ active :  isActive}">{{ title }}</h1>   //设置属性
    `,

}
渲染结果为   <h1 class="active">...</h1>
```

### 根据对象属性进行绑定

```javascript
var App = {
    data() {
        return {
            title: 'Title',
            isActive: true,
            activeObj: {
                'active': true
            }
        }
    },
    template: `
        <h1 :class="activeObj" >{{ title }}</h1>
    `,
}
渲染结果  <h1 class="active" >{{ title }}</h1>
```

### `:class`与普通的`class`可以共存

```javascript
var App = {
  data() {
    return {
      title: "Title",
      isActive: true,
    };
  },
  template: `
        <h1 :class='active : isActive' class="prange-BG" >{{ title }}</h1>    //设置color  = red
    `,
};

渲染结果;
```

### 使用计算属性

```javascript
var App = {
  data() {
    return {
      title: "Title",
      isActive: true,
      num: 10,
    };
  },
  computed: {
    classObject() {
      return {
        active: this.num > 5 ? true : false,
      };
    },
  },
  template: `
        <h1 :class="classObject" class="prange-BG">{{ title }}</h1>   //使用计算属性 更具逻辑来显示class
    `,
};
```

## 2、数组语法

把一个数组传给`:class`，以应用一个class列表

```javascript
<div :class="[activeClass, errorClass]"></div>
data() {
  return {
    activeClass: 'active',
    errorClass: 'text-danger'
  }
}

渲染结果 <div class="active text-danger"></div>
```

# style内联样式绑定

## 对象语法

```javascript
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>

data() {
  return {
    activeColor: 'red',
    fontSize: 30
  }
}

<div :style="styleObject"></div>
data() {
  return {
    styleObject: {
      color: 'red',
      fontSize: '13px'
    }
  }
}
```

## 数组语法

```javascript
<div :style="[baseStyles, overridingStyles]"></div>
```

# 前缀

**style使用中，vue会在运行时自动检测添加相应的前缀**

```javascript
<div :style="{ display: ['-webkit-box', '-ms-flexbox', 'flex'] }"></div>
```

# 变量命名规则

| cameCase     | 小驼峰命名法                       | -> thisIsMyVarible                             |
| ------------ | ---------------------------------- | ---------------------------------------------- |
| kebab-case   | 短横线命名法                       | -> this-is-my-varible                          |
| snake_case   | 蛇形命名法                         | -> this_is_my-varible                          |
| 匈牙利命名法 | 变量=> 属性 + 类型 + 描述 lpszTest | -> lpsz 以空字符串为结尾的字符串的长整型指指针 |
| PascalCase   | 大驼峰命名法                       | -> ThisIsMyVarible                             |
