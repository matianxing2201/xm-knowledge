---
title: 泛型
date: 2026-07-09
tags:
  - TypeScript
---

# 泛型

## 1、泛型变量

使用泛型创建像identity这样的泛型函数时，编译器要求在函数体必须正确的使用这个通用的类型。必须吧这些参数当做是任务或所有类型。

```typescript
function identity<T>(arg: T): T {
  console.log(arg.length); // 类型“T”上不存在属性“length”。
  return arg;
}
```

需要打印出`arg`的长度：

```typescript
function loggingIdentity<T>(arg: T[]): T[] {
  console.log(arg.length); // Array has a .length, so no more error
  return arg;
}
```

泛型函数接收类型参数`T`和参数`arg`，他是个元素类型是`T`的数组，并返回元素类型是`T`的数组。如果传入数字数组，将返回一个数字数组，因此此时泛型`T`的类型为`number`

## 2、泛型类型

函数泛型的注解方式

```typescript
function identity<T>(arg: T): T {
  return arg;
}
let a: <T>(arg: T) => T = identity;
```

对象字面量的方式来定义泛型类型

```typescript
let a: { <T>(arg: T): T } = identity;
```

泛型接口的定义方式

```typescript
interface IdentityInterface {
  <T>:(arg: T): T
}
let a: IdentityInterface = identity;
```
