---
title: 虚拟DOM
date: 2022-01-01
tags:
  - Vue
---

# 虚拟DOM

## 1、什么是虚拟DOM

`Virtual DOM`是对DOM的抽象，本质上是`JavaScript`对象，这个对象就是更加轻量级的对DOM的描述。

<img src="https://cdn.nlark.com/yuque/0/2022/webp/12961835/1644720209090-ebd1312b-a9a6-44af-9e4a-46c3517aa879.webp" width="473" title="" crop="0,0,1,1" id="u9c40889c" class="ne-image">

## 2、为什么需要虚拟DOM

因为在前端我们要尽可能的少操作DOM，不仅仅是DOM相对比较，更因为频繁的变动DOM会造成浏览器的回流与重绘，这些操作都会影响浏览器的性能，因此我们需要这一层抽象，在`patch`过程中竟可能一次性将差异更新到DOM中。这样保证了DOM不会出现性能很差的情况。

现在的前端框架一个基本特性就是无需手动操作DOM，一方面是因为手动操作DOM无法保证程序的性能，另一方面省略手动操作DOM操作可以大大提高开发效率。

最后，虚拟DOM最初的目的就是根号的跨平台，比如Node.js就没有DOM，如果想实现SSR（服务端渲染）name一个方式就是借助虚拟DOM，因为虚拟DOM本身是JavaScript对象。

## 3、虚拟DOM的diff

diff算法是整个虚拟DOM最核心的部分，diff的目的是比较新旧虚拟节点树找出差异并更新。

理论上`Virtual DOM`的时间复杂度高达`O(n^<sup>3</sup>)`，但实际开发中，很少会出现跨级的`DOM`变更，通常情况下DOM变更时同级的，因此在现代的各种`Virtual DOM`库都是值比较同级差异，在这种情况下时间复杂度是`O(n)`。

diff 的比较过程只会在同层级比较，不会跨级别比较

整体过程可以理解为一个层层递进的过程，每一级都是一个 vnode 数组，若children不一样，就会进入 updateChildren 函数（其主要参数为 `<font style="color:#FA8C16;">newChildren</font>` 和 `<font style="color:#FA8C16;">oldChildren</font>`，此时 `<font style="color:#FA8C16;">newChildren</font>` 和 `<font style="color:#FA8C16;">oldChildren</font>` 为同级的 vode数组）。然后逐一比较 children 里面的节点，对于 children 的 children，在循环以上步骤。源码如下：

```javascript
while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
  if (isUndef(oldStartVnode)) {
    // 没有旧的开始
    oldStartVnode = oldCh[++oldStartIdx]; // 旧的起点右移
  } else if (isUndef(oldEndVnode)) {
    // 没有旧的结束 旧的终点左移
    oldEndVnode = oldCh[--oldEndIdx];
  } else if (sameVnode(oldStartVnode, newStartVnode)) {
    // 旧的起点，新的节点，如果相等，指针往后
    patchVnode(
      oldStartVnode,
      newStartVnode,
      insertedVnodeQueue,
      newCh,
      newStartIdx,
    );
    oldStartVnode = oldCh[++oldStartIdx];
    newStartVnode = newCh[++newStartIdx];
  } else if (sameVnode(oldEndVnode, newEndVnode)) {
    // 旧的结束，新的结束，如果相等指针往前
    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
    oldEndVnode = oldCh[--oldEndIdx];
    newEndVnode = newCh[--newEndIdx];
  } else if (sameVnode(oldStartVnode, newEndVnode)) {
    // 旧的开始，新的结束，如果相等各自向中间
    patchVnode(
      oldStartVnode,
      newEndVnode,
      insertedVnodeQueue,
      newCh,
      newEndIdx,
    );
    canMove &&
      nodeOps.insertBefore(
        parentElm,
        oldStartVnode.elm,
        nodeOps.nextSibling(oldEndVnode.elm),
      );
    oldStartVnode = oldCh[++oldStartIdx];
    newEndVnode = newCh[--newEndIdx];
  } else if (sameVnode(oldEndVnode, newStartVnode)) {
    // 旧的结束，新的开始，如果相等各自向中间
    patchVnode(
      oldEndVnode,
      newStartVnode,
      insertedVnodeQueue,
      newCh,
      newStartIdx,
    );
    canMove &&
      nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
    oldEndVnode = oldCh[--oldEndIdx];
    newStartVnode = newCh[++newStartIdx];
  } else {
    // 如果都不行，新的起点去旧的里面找key，找不到新建节点，找到了会insertBefore，然后新的起点++
    if (isUndef(oldKeyToIdx)) {
      oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
    }
    idxInOld = isDef(newStartVnode.key)
      ? oldKeyToIdx[newStartVnode.key]
      : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
    if (isUndef(idxInOld)) {
      // 如果旧节点中没有
      createElm(
        newStartVnode,
        insertedVnodeQueue,
        parentElm,
        oldStartVnode.elm,
        false,
        newCh,
        newStartIdx,
      );
    } else {
      vnodeToMove = oldCh[idxInOld];
      if (sameVnode(vnodeToMove, newStartVnode)) {
        // 如果旧的节点中有相同的节点
        patchVnode(
          vnodeToMove,
          newStartVnode,
          insertedVnodeQueue,
          newCh,
          newStartIdx,
        );
        oldCh[idxInOld] = undefined; // 对应的旧节点会变成undefined,为了防止最后removeVnodes删除掉有用的节点，因为删除的方法是通过去父级直接删掉所有对应的（相同的）子节点
        canMove &&
          nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
      } else {
        // 如果有相同key但是不相同的节点，创建新的节点
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx,
        );
      }
    }
    newStartVnode = newCh[++newStartIdx];
  }
}
if (oldStartIdx > oldEndIdx) {
  // 执行了上方的循环，新旧Vnode有以一方遍历结束，如果此时旧的起点遍历到旧的结束后面去了
  refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
  addVnodes(
    parentElm,
    refElm,
    newCh,
    newStartIdx,
    newEndIdx,
    insertedVnodeQueue,
  );
} else if (newStartIdx > newEndIdx) {
  // 如果此时新的起点遍历到新的结束后面去了,也就是新节点遍历完了，但是旧节点还有剩余，也就是旧旧节点
  removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
}
```

diff 算法是一个交叉对比的过程，大致可以简要概括为：

有新的 Vnode 数组 与旧的 Vnode数组 ，然后又四个变量充当指针分别指到两个数组的头尾。重复下面对比过程，直到两个数组中任一数组的头指针超过尾指针，循环结束。

1. 对比两个数组的头部，如果找到，把新节点 patch 到旧节点，头指针后移
2. 对比两个数组的尾部，如果找到，把新节点 patch 到就节点，尾指针前移
3. 然后互相交叉对比，旧尾新头，如果找到，把新节点 patch 到旧节点，并插入到正确位置，旧尾指针前移，旧头指针后移
4. 继续互相交叉对比，旧头新尾，如果找到，把新节点 patch 到旧节点，并插入打正确位置，新尾指针前移，旧头指针后移
5. 都没有，开始用新指针对应节点的 key 去旧数组中直接找
   1. 如果没有 key ，创建新的节点
   2. 如果有 key 并且是相同的节点，把新节点 patch 到旧节点，并插入到正确位置
   3. 如果有 key 但是不是相同的节点，创建新节点

#### 为什么要加key

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1638947455882-21826acd-df65-4788-b8c0-fa3bf2543642.png" width="1210" title="" crop="0,0,1,1" id="ubebe5630" class="ne-image">

当不加 key 时，key 都是 undefined，默认相同，此时就会按照 diff 算法的就地复用进行比较

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1638947469275-22ddcc1d-85c9-4ba2-a699-91665fe45e11.png" width="1326" title="" crop="0,0,1,1" id="ua5577fd8" class="ne-image">

以上，B 复用 A 的结构，C 复用 B 的结构，D 复用 C 的结构，E 复用 D 的结构，删除 E；如果数据有变化，再进行数据更新

> <font style="color:#FA8C16;">说明：说用是指 dom 结构复用 如果数据有更新，之后会再进行数据更新</font>

如果加上唯一标识符 key

<img src="https://cdn.nlark.com/yuque/0/2021/png/12961835/1638947683664-c53a037f-efcd-44ce-9bd3-3637e2bb576b.png" width="1318" title="" crop="0,0,1,1" id="u89dceb21" class="ne-image">

以上，B、C、D、E全部可以复用，删除 A 即可

得出 加上 key 可以最大化利用节点，较少性能消耗
