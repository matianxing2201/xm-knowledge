# xm-knowledge

基于 VitePress 的个人学习笔记知识库，涵盖 AI、Java、Go、前端等多个技术领域。

## 技术栈

- **框架**: [VitePress](https://vitepress.dev/) 1.6.4 + Vue 3.5
- **动画**: [motion-v](https://motion.vuejs.org/) — Vue 3 动画库
- **平滑滚动**: [Lenis](https://github.com/darkroomengineering/lenis)
- **工具函数**: [@vueuse/core](https://vueuse.org/)
- **图标**: [@iconify/vue](https://icon-sets.iconify.design/)
- **评论系统**: [Giscus](https://giscus.app/) — GitHub Discussions
- **RSS**: vitepress-plugin-rss
- **部署**: GitHub Actions → GitHub Pages
- **包管理**: pnpm

## 项目结构

```
xm-knowledge/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts              # VitePress 站点配置（导航、侧边栏、RSS）
│   │   ├── posts.data.ts           # 文章数据加载器
│   │   ├── config/
│   │   │   └── roadmap.ts          # 学习路线图常量
│   │   └── theme/
│   │       ├── index.ts            # 自定义主题入口
│   │       ├── Layout.vue          # 根布局（首页 / 文档页分流）
│   │       ├── style.css           # Tailwind CSS + design tokens
│   │       ├── motion-v.d.ts       # motion-v 类型声明
│   │       ├── components/
│   │       │   ├── HomePage.vue        # 首页入口（组装各 section）
│   │       │   ├── ArchivePage.vue     # 归档页（按年月分组）
│   │       │   ├── TagsPage.vue        # 标签页（标签云 + 文章筛选）
│   │       │   ├── PageStats.vue       # 页面阅读量统计
│   │       │   ├── GiscusComments.vue  # Giscus 评论组件
│   │       │   ├── FileTree.vue        # 文件树组件
│   │       │       └── home/               # 首页子组件
│   │       │           ├── NavbarSection.vue       # 顶部导航栏（透明→玻璃）
│   │       │           ├── HeroChapter.vue         # Black Keynote Hero（sticky-pin H1）
│   │       │           ├── StatsChapter.vue        # 单数字 tick 统计
│   │       │           ├── DomainStageChapter.vue  # 四域 scroll-cued 交叉渐现
│   │       │           ├── LatestChapter.vue       # 最新 3 篇极简列表
│   │       │           ├── FooterSection.vue       # 单行页脚
│   │       │           └── SearchModal.vue         # 搜索弹窗
│   │       └── composables/         # 组合式函数
│   │           ├── useArticles.ts      # 文章数据
│   │           ├── useDomains.ts       # 分类统计
│   │           ├── useLatestArticles.ts # 最新文章
│   │           ├── useHeatmap.ts       # 提交热力图
│   │           ├── useRoadmap.ts       # 学习路线
│   │           └── useStatistics.ts    # 全站统计
│   ├── ai/                           # AI 学习笔记
│   │   ├── index.md
│   │   ├── SpringAI/                 # Spring AI 笔记
│   │   └── LangChain/                # LangChain 笔记
│   ├── java/                         # Java 学习笔记
│   ├── go/                           # Go 学习笔记
│   ├── web/                          # 前端学习笔记
│   │   ├── index.md
│   │   ├── vue/                      # Vue
│   │   ├── react/                    # React
│   │   ├── javascript/               # JavaScript
│   │   ├── typescript/               # TypeScript
│   │   ├── vite/                     # Vite
│   │   ├── network/                  # 网络
│   │   ├── css3/                     # CSS3
│   │   ├── html5/                    # HTML5
│   │   └── monorepo/                 # Monorepo 与微前端
│   ├── archive.md                    # 归档页
│   └── tags.md                       # 标签页
├── .trae/skills/                   # Trae IDE 自定义 Skill
├── .github/workflows/
│   └── deploy.yml                  # CI/CD 部署流水线
├── scripts/
│   └── check-article.mjs           # 文章质量检查脚本
└── package.json
```

## 功能特性

| 功能        | 说明                                                    |
| ----------- | ------------------------------------------------------- |
| 品牌首页    | Apple Keynote 风格 Hero、滚动叙事、单屏 domain 交叉渐现 |
| 标签系统    | 标签云 + 按标签筛选文章                                 |
| 归档页      | 按年月分组展示所有文章                                  |
| 搜索        | VitePress 内置全文搜索                                  |
| Giscus 评论 | 每篇文章底部 GitHub Discussions 评论                    |
| RSS 订阅    | 自动生成 feed.xml                                       |
| 文章检查    | `pnpm check <file.md>` 检查文章规范                     |

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

访问 http://localhost:5173/xm-knowledge/

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
