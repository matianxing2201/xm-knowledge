# XM Knowledge

基于 VitePress 的个人内容站点，记录技术学习、项目实践与持续写作。首页以文章为核心，也为后续的生活记录与个人思考留出空间。

作者：[Matianxing](https://github.com/matianxing2201)（[@matianxing2201](https://github.com/matianxing2201)）

## 技术栈

- **站点框架**：[VitePress](https://vitepress.dev/) 1.6.4 + Vue 3.5
- **动画**：[Motion for Vue](https://motion.vuejs.org/)
- **平滑滚动**：[Lenis](https://github.com/darkroomengineering/lenis)
- **工具函数**：[@vueuse/core](https://vueuse.org/)
- **图标**：[@iconify/vue](https://icon-sets.iconify.design/)
- **评论**：[Giscus](https://giscus.app/)（GitHub Discussions）
- **RSS**：vitepress-plugin-rss
- **部署**：GitHub Actions → GitHub Pages
- **包管理**：pnpm

## 首页与功能

首页围绕文章发现和作者介绍设计，包含精选文章、主题入口、搜索与明暗主题切换。顶部导航提供「文章 / 项目 / 关于」三个入口；「关于」区域链接到作者的 [GitHub 个人主页](https://github.com/matianxing2201)，并单独提供 [XM Knowledge 项目仓库](https://github.com/matianxing2201/xm-knowledge)。

| 功能 | 说明 |
| --- | --- |
| 内容首页 | 展示精选文章、主题入口与作者信息 |
| 搜索与主题 | 提供全文搜索和明暗主题切换 |
| 文章归档 | 按年月浏览文章 |
| 标签系统 | 浏览标签并筛选文章 |
| Giscus 评论 | 文章页使用 GitHub Discussions 评论 |
| RSS | 自动生成 `feed.xml` |
| 文章检查 | `pnpm check <file.md>` 检查文章规范 |

## 项目结构

```text
xm-knowledge/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts                    # VitePress 站点配置
│   │   ├── posts.data.ts                 # 文章数据加载器
│   │   └── theme/
│   │       ├── Layout.vue                # 首页与文档页布局分流
│   │       └── components/
│   │           ├── home/
│   │           │   ├── HomePage.vue       # 首页与文章精选
│   │           │   ├── NavbarSection.vue  # 导航、搜索与主题切换
│   │           │   └── ...                # 其他首页区块
│   │           ├── ArchivePage.vue        # 文章归档
│   │           ├── TagsPage.vue           # 标签页
│   │           └── GiscusComments.vue     # 评论组件
│   ├── ai/                               # AI 相关内容
│   ├── app/                              # 应用开发与发布
│   ├── docker/                           # Docker 内容
│   ├── go/                               # Go 内容
│   ├── java/                             # Java 内容
│   ├── web/                              # Web 与前端内容
│   ├── archive.md                        # 归档页
│   └── tags.md                           # 标签页
├── .github/workflows/deploy.yml          # GitHub Pages 部署流程
├── scripts/check-article.mjs             # 文章质量检查
└── package.json
```

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

本地启动后，按终端输出的地址访问站点。

### 构建与预览

```bash
pnpm docs:build
pnpm docs:preview
```

### 文章质量检查

```bash
pnpm check docs/java/your-article.md
```

检查规则包括：H1 标题唯一且存在、不使用 H5/H6 标题、包含必需 Frontmatter、代码块标注语言，并提示外部图片 URL。

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
