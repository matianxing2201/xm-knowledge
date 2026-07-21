---
title: data 属性、methods 属性
date: 2022-01-01
tags:
  - Vue
---

# data 属性、methods 属性

Vue再创建实例的过程中调用data函数，返回数据对象，通过响应式包装存储在实例的$data，并且实例可以直接越过$data访问属性

直接通过应用实例添加属性或者应用实例中的$.data中添加属性都不会进行响应式

# data为什么必须是一个函数？

确保每次实例的引用都是唯一的，避免使用同一个引用。

也可以是一个对象 但是要进行一次深拷贝。

```javascript
var vm = new Vue({
  data() {
    return {
      a: 1,
      b: 2,
    };
  },
});

function Vue(opt) {
  this.$data = opt.data();

  var _this = this;

  for (var k in this.$data) {
    (function (k) {
      Object.defineProperty(_this, k, {
        get() {
          return _this.$data[k];
        },
        set(newValue) {
          _this.$data[k] = newValue;
        },
      });
    })(k);
  }
}
```

# methods属性以及实例方法挂载实现

1. Vue创建实例时，会自动为methods绑定当前实例this。保证在事件监听时，回调始终指向当前组件实例。
2. 方法要避免使用箭头函数，箭头函数会阻止Vue正确绑定组件实例this。
3. 实例中直接挂在methods中的每一个方法

```javascript
/**
*	@click="changeTitle('title name')"
* 函数名 + () 不是执行符号, 传入实参的容器
* onclick = "() => changeTitle('title name')"
*/
const App = {
    data() {
        return {
            title: 'This is title'
        }
    },
    template: `
    <h1>{{ title }}</h1>
		<h2> {{ yourTitle() }}</h2>
    <button @click="changeTitle">Change</button>
  `,
    methods: {
        changeTitle(title) {
            this.title = title
        },
      	yourTitle() {
            return 'This is your title'
        }
    }
}



实现

吧methods里面的方法 放到实例对象上
var vm = new Vue({
  data() {
    return {
      a: 1,
      b: 2
    }
  },
  methods: {
    plusA(num) {
      this.a += num
    },
    plusB(num) {
      this.b += num
    },
    total() {
      console.log(this.b + this.b);
    }
  }
})


function Vue(opt) {
  this.$data = opt.data();
  this._method = opt.methods;
  var _this = this;

  for (var k in this.$data) {
    (function(k) {
      Object.defineProperty(_this, k, {
        get() {
          return _this.$data[k]
        },
        set(newValue) {
          _this.$data[k] = newValue
        }
      })
    })(k)
  }

  for (var k in this._method) {
    _this[k] = this._method[k]
  }
}

console.log(vm);
vm.plusA(1);
vm.plusA(1);
vm.plusA(1);
vm.plusB(2);
vm.plusB(2);
vm.plusB(2);
vm.plusB(2);

vm.total()
```
