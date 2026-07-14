---
title: 函数
date: 2026-07-09
tags:
  - TypeScript
---

# 函数

## 1、函数声明的注解方式

```typescript
/*函数声明*/
function test(a: number, b: number): number {
  return a + b;
}
test(1, 3);
```

## 2、函数表达式的注解方式

```typescript
/*函数表达式*/
let test1: (a: number, b: number) => number = function (a, b) {
  return a + b;
};
对象;
let test2: (a: number, b: number) => {} = function (a, b) {
  return { a: 1 };
};
```

## 3、interface的注解方式（常用）

```typescript
interface SearchFunc {
  (source: string, substring: string): boolean;
}
```

## 4、type 的注解方式

```typescript
type SearchFunc = (source: string, substring: string) => boolean;
```

## 5、可选参数和默认参数

必选参数不能在可选参数之后

```typescript
// 可选参数
function buildName(firstName: string, lastName?: string) {
  return firstName + " " + lastName;
}

let result1 = buildName("Bob");

// 默认值
function buildName(firstName: string, lastName: string = "zhangsan") {
  return firstName + " " + lastName;
}

let result1 = buildName("Bob");
```

## 6、剩余参数

剩余参数 默认值是数组，放在最后

```typescript
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}

let employeeName = buildName("Joseph", "Samuel", "Lucas", "MacKinzie");
```

## 7、this指向与箭头函数

this 可以通过 `=>` 来绑定this 指向

<font style="color:rgb(191, 65, 74);">--noImplicitThis</font> -> false 指定this 为参数，注解类型的类型方式，来注解this

```typescript
interface Card {
  suit: string;
  card: number;
}
interface Deck {
  suits: string[];
  cards: number[];
  createCardPicker(this: Deck): () => Card;
}
let deck: Deck = {
  suits: ["hearts", "spades", "clubs", "diamonds"],
  cards: Array(52),
  createCardPicker: function (this: Deck) {
    return () => {
      let pickedCard = Math.floor(Math.random() * 52);
      let pickedSuit = Math.floor(pickedCard / 13);

      return { suit: this.suits[pickedSuit], card: pickedCard % 13 };
    };
  },
};

let cardPicker = deck.createCardPicker();
let pickedCard = cardPicker();

alert("card: " + pickedCard.card + " of " + pickedCard.suit);
```

## 8、函数的重载

表意更清楚

```typescript
function reverse(x: string): string;
function reverse(x: number): number;
function reverse(x: string | number) {
  if (typeof x === "string") {
    return x.split("").reverse().join();
  }
  if (typeof x === "number") {
    return Number(x.toString().split("").reverse().join());
  }
}
```
