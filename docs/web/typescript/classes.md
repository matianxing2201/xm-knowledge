---
title: 类
date: 2026-07-09
tags:
  - TypeScript
---

# 类

```json
"strictPropertyInitialization": false  // 是否检测初始值
```

## 1、类

```typescript
class Animal {
  name: string;
  constructor(theName: string) {
    this.name = theName;
  }
  move(distanceInMeters: number = 0) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}
```

## 2、继承

继承中的super，在constructor中默认是<font style="color:#F5222D;">构造函数，</font>外部指的是<font style="color:#F5222D;">父类</font>

```typescript
class Snake extends Animal {
  constructor(name: string) {
    super(name);
  }
  move(distanceInMeters = 5) {
    console.log("Slithering...");
    super.move(distanceInMeters);
  }
}
```

## 3、类的修饰符

### public 默认 公共的成员属性

- 自身调用
- 子类可以调用
- 实例可以调用

### private 私有的

- 自身调用

### protected 受保护的

- 自身调用
- 子类调用

### readonly 只读

- 优先级：public > readonly
- 是否可写：readonly 只读，不可写
- 不能修饰成员方法

## 4、存取器

getter 取值函数 `obj.a`

setter 存值函数 `obj.a = '123'`

改变赋值和读取的行为

## 5、抽象类

抽象类：能够提供其他类的基类

抽象类：

1. 无法创建实例
2. 抽象方法一定要有实现
