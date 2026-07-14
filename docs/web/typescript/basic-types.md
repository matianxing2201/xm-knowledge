---
title: 基础类型
date: 2026-07-09
tags:
  - TypeScript
---

# 基础类型

## 1、数组

几乎所有变成语言中`[]`都代指一个数组，在TS中，数组元素的类型在定义式不需确定。在JS中，数组是有字典方式存储的，数组长度是动态的。

```typescript
// 声明与初始化
// 元素为number的数组
// Array<string> === string[]

let intArr: number[] = [1, 2, 3];
let strArr: Array<string> = ["1", "2", "3"];
```
