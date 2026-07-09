---
title: 案例：将 Vue 和 React 项目及 UI 集成到 Monorepo 架构中
date: 2026-07-08
tags:
  - Monorepo
  - Vue
  - React
  - 案例
---

## 初始化项目结构

```javascript
├── package.json
├── pnpm-workspace.yaml  # 工作区配置文件
├── apps/        # 应用层目录（可选）
│   ├── home/    # protal 门户页
│   └── manager/ # 管理页面
├── packages/    # 子包目录
│   ├── react-ui/    # react UI组件模拟
│   └── vue-ui/      # vue UI组件模拟

```

## 配置Workspace与创建子包

在项目根目录创建 `pnpm-workspace.yaml`

```javascript
packages:
  - 'packages/*'  # 核心包目录 可以是公共组件 utils build axios 等等
  - 'apps/*'      # 应用层
```

创建子包（示例 react-ui/ vue-ui）

```javascript
mkdir -p packages/react-ui
cd packages/react-ui
pnpm init

mkdir -p packages/vue-ui
cd packages/vue-ui
pnpm init
```

修改子包配置

```javascript
{
  "name": "@monorepo/react-ui", // 使用命名空间防止冲突
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "private": true,              // 私有包
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}

```

```javascript
{
  "name": "@monorepo/vue-ui",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "private": true,
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}

```

## 搭建项目并依赖安装

```vue
├── package.json ├── index.html ├── vite.config.js ├── src │ ├── App.jsx │ └──
main.jsx
```

```vue
├── package.json ├── index.html ├── vite.config.js ├── src │ ├── App.vue │ └──
main.js
```

安装公共依赖

```javascript
pnpm add react react-dom vue -w  # -w 表示安装在根目录（公共依赖）
pnpm add @vitejs/plugin-react @vitejs/plugin-vue vite -Dw  # -Dw 表示安装在根目录开发环境依赖（公共依赖）
```

子包之间相互引用

```javascript
pnpm add @monorepo/react-ui --workspace
```

```javascript
pnpm add @monorepo/vue-ui --workspace
```

此时依赖关系会被自动处理

![依赖管理示意](/images/web/monorepo/web-monorepo-07.png)

![依赖关系示意](/images/web/monorepo/web-monorepo-08.png)

## vue&React Button组件编写

```vue
<!-- 
Button的SFC 
因为在全局workspace安装过vue 所以子项目可以使用defineProps 
并在vue-ui 下入口文件 导出 MyButton
-->

<template>
  <button :class="type">
    <slot></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: "primary",
    validator: (value) => {
      return ["primary", "success", "wran", "danger"].includes(value);
    },
  },
});
</script>
<style scoped>
.primary {
  background: blue;
  color: #fff;
}
.success {
  background: green;
  color: #fff;
}
.wran {
  background: orange;
  color: #000;
}
.danger {
  background: red;
  color: #fff;
}
</style>
```

```vue
import './Button.css' export default function Button({type, children}) { let
_type = "primary"; if([ 'primary', 'success', 'wran', 'danger' ].includes(type))
{ _type = type } return (
<div>
      <button className={ _type }>{ children }</button>
    </div>
); }
```

## 在apps下子应用引入自定的UI库项目

```vue
import { MyButton } from "@monorepo/react-ui"; export default function App() {
return (
<div>
    <h1>Hello React</h1>
    <MyButton type='success'>hello</MyButton>
    </div>
); }
```

```vue
<template>
  <div>
    <h1>Hello Vue</h1>
    <my-button :type="'success'">success</my-button>
  </div>
</template>

<script setup>
import { MyButton } from "@monorepo/vue-ui";
</script>
<style scoped></style>
```

## 运行

在根目录的package.json中添加脚本

#### **关键配置说明**

1. `--filter` 或者 `-F`：精准控制操作目标子包
2. `workspace:*`：表示使用本地工作区最新版本
3. `-w`：强制安装在根目录（公共开发依赖）
4. `-r`：递归执行所有子包中的命令

```vue
"scripts": { "dev:home": "pnpm run -F @monorepo/home dev", "dev:manager": "pnpm
run -F @monorepo/manager dev" },
```

执行指令即可显示引入对应UI库的button样式
