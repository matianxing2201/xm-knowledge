---
title: 类型的注释与 any 类型的特点
date: 2026-07-09
tags:
  - TypeScript
---

# 类型的注释与 any 类型的特点

## 1、类型的注释

1. 显示类型定义：手动指定变量类型
2. 类型的推断：通过赋值让ts对变量进行类型推断
3. 隐式的any：如果没有定义类型，且无法进行类型推断，且飞严格模式，那么隐式注解为any

```typescript
let a: number = 1; // 显示指定变量a的类型为number
a = "1"; // Type 'string' is not assignable to type 'number'.

let b = 1; // 根据类型推断b为number 类型
b = "1"; //  // 不能将类型“string”分配给类型“number”。

let c; // 等同于 let c: any
c = 1;
```

## 2、any

`any`是特殊的类型，当不希望某个特定的值导致类型检查错误是可以使用。当一个值的类型为`any`时，它的任何属性都可以被访问。

```typescript
// 参数“a|b”隐式具有“any”类型。
// strict: false 可以关闭   noImplicitAny: false
function plus(a, b) {
  return a + b;
}

// 可以任意访问对象属性
let obj: any = {
  a: 1,
};
console.log(obj.a);

// 可以给对象进行属性的追加
let obj: any = {
  a: 1,
};
obj.b = 2;

// any类型的变量可以被任何类型的变量赋值
let a;
let b = 1;
a = b;

// 隐式的any类型在严格模式下，是不被允许的
```
