---
title: CSS 相关
---

# Vite CSS 相关

## CSS变量

```vue
/* 定义变量 */ :root { --primary-color: #42b983; --secondary-color: #35495e; }
/* 使用变量 */ .button { background-color: var(--primary-color); color:
var(--secondary-color); }
```

Vite 自动支持 CSS变量，无需额外配置。

## PostCSS

只需要在项目目录中创建 postcss.config.cjs。 并导出项目所需要的postcss工具配置即可

```vue
module.exports = { plugins: [ require('autoprefixer'), // 自动添加浏览器前缀
require('postcss-preset-env')({ // 使用现代CSS特性 stage: 3, features: {
'nesting-rules': true } }), ... ] }
```

## CSS Modules

CSS Modules 提供局部作用域的 CSS，避免样式冲突。只需要创建 xxx.modules.css 并在项目中引入就可以使用

## CSS预处理器

Vite内置主流预处理器，只需要安装对应的依赖

### Sass/SCSS

```vue
npm install -D sass /* variables.scss */ $primary-color: #42b983; /* 使用 */
.container { color: $primary-color; }
```

### Less

```vue
npm install -D less /* variables.less */ @primary-color: #42b983; /* 使用 */
.container { color: @primary-color; }
```
