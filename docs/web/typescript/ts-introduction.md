---
title: 初识 TS、编译、语法检查
date: 2022-01-01
tags:
  - TypeScript
---

# 初识 TS、编译、语法检查

## 1、TypeScript的介绍

1. ts 是由微软开发的开源编程语言
2. typescript 是 javascript 的超集
3. ts 是开发大型应用的基石
4. ts 提供了更丰富的语法提示
5. ts 在编写阶段能够检查错误
6. ts 是<font style="color:#FA541C;">静态类型</font> js 是<font style="color:#FA541C;">动态类型</font>

## 2、TS的安装

```bash
cnpm install typescript -g
```

### 查看版本

```bash
tsc -v
```

## 3、编译TS

编写TS代码 -> 检查TS代码类型（静态类型检查） -> 编译TS代码 -> 运行JS代码（JS运行环境）

<font style="color:#FA541C;">所有的TS文件最终都将会被编译成JS文件执行</font>

## 4、语法检查

在写 ts 时，如果出错编辑器会提示对应的错误，不会像 js 打开浏览器时才报错

## 5、为什么需要TypeScript

1. 一个属性到底存不存在可能是未知的，能不能访问或者调用。
2. 一个函数对参数的传递约定，在JS中极有可能很难判定函数正常工作的参数条件。

这些未知信息可能产生的情况，导致对对象的使用者有很多不必要花费的使用成本，以及对项目维护的代码分析的成本。TypeScript的存在就是动态制定了一个更明确对对象的使用规范类型定义和严格的约束是一个复杂或大型项目维护的基础条件
