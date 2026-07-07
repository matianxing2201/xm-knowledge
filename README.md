# xm-knowledge

基于 VitePress 的个人学习笔记知识库，涵盖 Java、Go、AI、前端等多个技术领域。

## 技术栈

- **框架**: [VitePress](https://vitepress.dev/) 1.6.4 + Vue 3.5
- **包管理**: pnpm
- **部署**: GitHub Actions → GitHub Pages
- **评论系统**: Giscus
- **访问统计**: 不蒜子 (busuanzi)
- **RSS**: vitepress-plugin-rss

## 项目结构

```
xm-knowledge/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts          # VitePress 站点配置（导航、侧边栏、RSS 等）
│   │   └── theme/
│   │       ├── index.ts        # 自定义主题入口
│   │       ├── Layout.vue      # 布局（注入 Giscus 评论 + 页面统计）
│   │       ├── style.css       # 品牌色自定义
│   │       └── components/
│   │           ├── HomePage.vue       # 首页（分类卡片 + 最近更新）
│   │           ├── TagsPage.vue       # 标签页（标签云 + 文章筛选）
│   │           ├── ArchivePage.vue    # 归档页（按月分组）
│   │           ├── GiscusComments.vue # Giscus 评论组件
│   │           └── PageStats.vue      # 页面阅读量统计
│   ├── java/         # Java 学习笔记
│   ├── go/           # Go 学习笔记
│   ├── ai/           # AI 学习笔记（Spring AI、LangChain、LangGraph）
│   ├── web/          # 前端学习笔记
│   │   ├── vue/      #   Vue（基础、组件、路由、Vuex、Axios 等）
│   │   ├── react/    #   React（核心概念、Hook、高级指引）
│   │   ├── javascript/  # JavaScript（ES6+、函数式编程、正则、DOM）
│   │   ├── node/     #   Node.js 核心模块
│   │   ├── typescript/  # TypeScript（泛型、接口、类、函数）
│   │   ├── vite/     #   Vite（插件机制、依赖预构建、钩子）
│   │   ├── network/  #   网络（HTTP、TCP、DNS、跨域、AJAX）
│   │   ├── css3/     #   CSS3（Flex、BFC、响应式、动画）
│   │   ├── html5/    #   HTML5（File、Canvas、WebSocket）
│   │   └── monorepo/ #   Monorepo 与微前端
│   ├── index.md      # 站点首页
│   ├── tags.md       # 标签页
│   └── archive.md    # 归档页
├── scripts/
│   └── check-article.mjs  # 文章质量检查脚本
├── .github/workflows/
│   └── deploy.yml    # CI/CD 部署流水线
└── package.json
```

## 功能特性

| 功能        | 说明                                     |
| ----------- | ---------------------------------------- |
| 自定义首页  | 分类卡片导航 + 最近更新文章列表          |
| 标签系统    | 标签云 + 按标签筛选文章                  |
| 归档页      | 按年月分组展示所有文章                   |
| 本地搜索    | VitePress 内置全文搜索                   |
| Giscus 评论 | 每篇文章底部集成 GitHub Discussions 评论 |
| 阅读量统计  | 不蒜子 (busuanzi) 页面 PV 统计           |
| RSS 订阅    | 自动生成 feed.xml                        |
| 文章检查    | `pnpm check <file.md>` 检查文章规范      |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm docs:dev
```

### 构建

```bash
pnpm docs:build
```

### 预览构建产物

```bash
pnpm docs:preview
```

### 文章质量检查

```bash
pnpm check docs/java/your-article.md
```

检查规则：

- H1 标题唯一且存在
- 不允许 H5/H6 级标题（最高 H4）
- 必须包含 Frontmatter（`title` 必填，`tags` 和 `date` 建议填写）
- 代码块必须标注语言
- 外部图片 URL 会给出警告

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
