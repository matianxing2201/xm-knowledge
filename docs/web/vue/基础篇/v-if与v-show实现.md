---
title: v-if / v-show 实现
date: 2022-01-01
tags:
  - Vue
---

# v-if / v-show 实现

```javascript
/**
 * 实现v-if  v-show
 *
 *
 *
 */

var Vue = (function () {
  var Vue = function (options) {
    /*
    	el与data需要暴露在实例上以便后面渲染时使用
    */
    this.$el = document.querySelector(options.el);
    this.$data = options.data();
    // 初始化
    this._init(this, options.template, options.methods);
  };

  Vue.prototype._init = function (vm, template, methods) {
    var container = document.createElement("div");
    container.innerHTML = template;
    //把template变成真是节点 以便对节点做分析

    //vue是使用正则一点一点解析 功能全 耗时长
    var showPool = new Map();
    var eventPool = new Map();

    //初始化数据 将传进来的数据 存入 实例上 对数据进行劫持
    initData(vm, showPool);

    //初始化节点池
    initPool(container, methods, showPool, eventPool);

    //绑定事件
    bindEvent(vm, eventPool);

    //分析showPool池里面的数据 判断 类型
    //如果类型是if 再根据vm实例中的data数据 如果是true 显示 显示img节点 如果 false 使用创建注释节点显示
    //如果类型是show 再根据data数据 true 或者false 来判断 是否 display 是 none 还是block
    render(vm, showPool, container);
  };

  function initData(vm, showPool) {
    var _data = vm.$data;

    for (var key in _data) {
      (function (key) {
        Object.defineProperty(vm, key, {
          get() {
            return _data[key];
          },
          set(newValue) {
            _data[key] = newValue;
            update(vm, key, showPool);
          },
        });
      })(key);
    }
  }

  function initPool(container, methods, showPool, eventPool) {
    var allNodes = container.getElementsByTagName("*"),
      node = null;

    for (var i = 0; i < allNodes.length; i++) {
      node = allNodes[i];

      var vIfProp = node.getAttribute("v-if");
      var vShowProp = node.getAttribute("v-show");
      var vEventProp = node.getAttribute("@click");

      if (vIfProp) {
        showPool.set(node, {
          type: "if",
          prop: vIfProp,
        });
        node.removeAttribute("v-if");
      } else if (vShowProp) {
        showPool.set(node, {
          type: "show",
          prop: vShowProp,
        });
        node.removeAttribute("v-show");
      }

      if (vEventProp) {
        eventPool.set(node, methods[vEventProp]);
        node.removeAttribute("@click");
      }
    }
  }

  function render(vm, showPool, container) {
    var _el = vm.$el,
      _data = vm.$data;

    for (var [node, info] of showPool) {
      switch (info.type) {
        case "if":
          info.comment = document.createComment("v-if");
          !_data[info.prop] && node.parentNode.replaceChild(info.comment, node);
          break;
        case "show":
          !_data[info.prop] && (node.style.display = "none");
          break;
        default:
          break;
      }
    }

    _el.appendChild(container);
  }

  function bindEvent(vm, eventPool) {
    for (var [node, handler] of eventPool) {
      vm[handler.name] = handler;
      node.addEventListener("click", vm[handler.name].bind(vm), false);
    }
  }

  function update(vm, key, showPool) {
    var _data = vm.$data;

    for (var [node, info] of showPool) {
      if (info.prop === key) {
        switch (info.type) {
          case "if":
            !_data[key]
              ? node.parentNode.replaceChild(info.comment, node)
              : info.comment.parentNode.replaceChild(node, info.comment);
            break;
          case "show":
            !_data[key]
              ? (node.style.display = "none")
              : (node.style.display = "");
        }
      }
    }
  }

  return Vue;
})();

var vm = new Vue({
  el: "#app",
  data() {
    return {
      isShowImg1: true,
      isShowImg2: true,
    };
  },
  /**
   * 注释节点 -> img节点替换
   *    容器装载
   *
   */
  template: `
    <div>
      <img v-if="isShowImg1" width="200" src="https://i.shangc.net/2018/0628/20180628125132284.jpg" />
      <img v-show="isShowImg2" width="200" src="https://images.chinatimes.com/newsphoto/2021-03-19/1024/20210319003325.jpg" />
    </div>
    <div>
      <button @click="showImg1">Show image 1</button>
      <button @click="showImg2">Show image 2</button>
    </div>
  `,
  methods: {
    showImg1() {
      this.isShowImg1 = !this.isShowImg1;
    },
    showImg2() {
      this.isShowImg2 = !this.isShowImg2;
    },
  },
});

console.log(vm);

/**
 * showPool
 *
 * Map {
 *   node: {
 *     type
 *     prop
 *   }
 * }
 *
 * [
 *   [
 *     dom,
 *     {
 *       type: if / show
 *       prop: isShowImg1 / isShowImg2,
 *       comment: comment
 *     }
 *   ]
 * ]
 *
 * [
 *   [
 *     dom,
 *     handler -> showImg1
 *   ]
 * ]
 */
```
