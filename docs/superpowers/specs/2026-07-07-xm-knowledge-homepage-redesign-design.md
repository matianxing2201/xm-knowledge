# XM Knowledge Homepage Redesign — Design Spec

> Version: v1.0
> Date: 2026-07-07
> Status: Approved (pending user review)
> Source specs: `docs/spec/00..07-*.md`
> Terminal output: 设计总纲 + writing-plans 实现计划

---

## 0. 决策摘要

| 决策点       | 选定                                             | 理由                                   |
| ------------ | ------------------------------------------------ | -------------------------------------- |
| 交付物       | 设计总纲 + 实现计划                              | 用户拍板                               |
| 主题模式     | 暗色为主 + light token 兼容                      | 与 VitePress 文档页体验一致            |
| 组件架构     | 02 分层 + `BackgroundCanvas` 合并粒子            | 满足 05-coding-rules 的 300 行约束     |
| 动画栈       | Motion Vue 主 + Lenis 平滑滚动（去 GSAP）        | 包最小，API 最一致                     |
| 数据层       | 扩 `posts.data.ts` build-time + composables 包裹 | 零运行时开销                           |
| Roadmap 数据 | 配置文件常量                                     | 当前只一条路线，YAGNI                  |
| 落地策略     | 整体重写 `theme/components/home/`                | 个人项目无灰度压力，过渡期双份代码不值 |

---

## 1. 整体架构与目录结构

### 1.1 技术栈定格

- **VitePress**（已装 1.6.4）负责 md 路由、SFC 构建、`Layout.vue` 作为入口。
- **Vue 3 + TypeScript + `<script setup>`**（已装 vue 3.5.39）。
- **新增依赖**：
  - `tailwindcss`（v4，CSS-first 配置）
  - `@vueuse/core`（响应式工具）
  - `motion-v`（Motion Vue 官方包）
  - `lenis`（平滑滚动）
  - `@iconify/vue`（图标）
- **弃用**：GSAP（首期不引，列入未来可选项）。
- **删除**：旧 `theme/components/HomePage.vue`（472 行 scoped CSS）。
- **不引入**：Element Plus / Ant Design / pinia 或其它重量级状态管理。数据全走 composables + 本地 `ref`。

### 1.2 目录骨架

```
docs/.vitepress/
├── config.mts
├── posts.data.ts                    # 扩：+words +readingTime +category +lastUpdated
├── theme/
│   ├── index.ts                     # 注册 Layout
│   ├── Layout.vue                   # 单一入口，按 frontmatter.home 分流新 HomePage
│   ├── style.css                    # 全局 tailwind 入口 + design tokens（@theme inline）
│   ├── composables/
│   │   ├── useArticles.ts
│   │   ├── useLatestArticles.ts
│   │   ├── useStatistics.ts
│   │   ├── useRoadmap.ts
│   │   └── useDomains.ts
│   ├── config/
│   │   └── roadmap.ts               # Roadmap 常量数据
│   └── components/
│       ├── home/
│       │   ├── HomePage.vue         # 组合容器（只做布局 + Lenis init）
│       │   ├── BackgroundCanvas.vue  # mesh gradient + noise
│       │   ├── FloatingParticles.vue # BackgroundCanvas 子组件
│       │   ├── NavbarSection.vue
│       │   ├── HeroSection.vue
│       │   ├── HeroContent.vue
│       │   ├── KnowledgeCore.vue
│       │   ├── DomainSection.vue
│       │   ├── DomainCard.vue
│       │   ├── RoadmapSection.vue
│       │   ├── LatestSection.vue
│       │   ├── ArticleCard.vue
│       │   ├── StatisticsSection.vue
│       │   └── FooterSection.vue
│       └── ... (现有 ArchivePage/TagsPage/PageStats/GiscusComments 保留)
```

> 所有 design tokens（颜色 / 字体 / spacing / radius / shadow / motion）集中在 `style.css` 顶部的 `@theme inline` 块，组件里只消费 utility，不维护单独的 token TS 文件。

### 1.3 组件树

```
HomePage
├── BackgroundCanvas            # 全页 mesh gradient + noise (fixed, z-[-1])
│   └── FloatingParticles       # 轻量粒子
├── NavbarSection
├── HeroSection
│   ├── HeroContent             # 左：标题/副标题/按钮
│   └── KnowledgeCore           # 右：四领域节点 + parallax
├── DomainSection
│   └── DomainCard
├── RoadmapSection
├── LatestSection
│   └── ArticleCard
├── StatisticsSection           # 内含 CountUp
└── FooterSection
```

### 1.4 边界约定

1. **`HomePage.vue` 只组装布局，不写业务** —— 只 import 子组件、放 `<BackgroundCanvas />`、在 `onMounted` 起 Lenis。所有数据通过 composables 在子组件里局部获取，不在 HomePage 透传 props。
2. **`BackgroundCanvas` 是固定层**：`position: fixed; inset: 0; z-index: -1; pointer-events: none;`。所有 section 透明背景叠加其上。
3. **composables 不持有响应式全局状态** —— 它们是对同步 `import posts.data` 的包装，返回 `computed`，不引入 provide/inject 或全局 store；未来接 CMS 只换 import 源即可。
4. **tokens 通过 Tailwind v4 `@theme inline` 暴露**为 utility（`bg-surface` / `text-secondary`），不手写 CSS 变量映射表，规避「禁止硬编码」与「禁止内联 CSS」双红线。
5. **Lenis 只在 `HomePage` mounted 时启动、`onUnmounted` 时 `destroy()`**，不污染 md 文档页滚动。

### 1.5 与现有代码的衔接

- `Layout.vue` 改为：`import HomePage from './components/home/HomePage.vue'`，旧 `HomePage.vue` 删除；维持现有 `frontmatter.home` 分流逻辑不动。
- `posts.data.ts` 扩字段方案见第 3 节。
- 现有 `ArchivePage.vue / TagsPage.vue / PageStats.vue / GiscusComments.vue` 保留不动。

---

## 2. 设计系统（tokens）

### 2.1 Tailwind v4 配置方式

CSS-first 配置，在 `style.css` 顶部用 `@theme inline` 暴露 token，组件里直接用 `bg-surface` / `text-secondary` / `shadow-card` 等 utility。不维护单独的 token 映射表，也不写 scoped CSS 变量。

### 2.2 颜色（dark 为主 + light 兼容）

```css
@theme inline {
  /* 默认 = dark，VitePress 加 .dark class 时这些生效 */
  --color-bg: #09090b;
  --color-surface: #111827;
  --color-card: #18181b;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-primary: #7c3aed;
  --color-secondary: #22d3ee;
  --color-text: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;

  /* light 模式色值 */
  --color-bg-light: #ffffff;
  --color-surface-light: #f9fafb;
  --color-card-light: #ffffff;
  --color-border-light: rgba(17, 17, 17, 0.08);
  --color-text-light: #18181b;
  --color-text-secondary-light: #71717a;
  /* primary/secondary/语义色两种模式共用，避免按钮主色跳变 */
}
```

切换策略：

- VitePress 主题切换会自动给 `<html>` 加 `.dark` 或 `.light`。
- 用 `:where(.dark, .dark *)` selector 双写 token，让 `--color-bg` 在 light 下指向 `--color-bg-light`。组件里只写 `bg-bg` / `bg-surface`，主题切换自然生效。
- primary 紫在两模式下都用 `#7C3AED`，secondary 青 `#22D3EE` 同理 —— 这是有意为之，避免主按钮在切模式时跳色，规范未要求主色随模式变。

### 2.3 字体

```css
@theme inline {
  --font-heading: "Geist", "HarmonyOS Sans SC", system-ui, sans-serif;
  --font-body: "Geist", "HarmonyOS Sans SC", system-ui, sans-serif;
  --font-code: "JetBrains Mono", ui-monospace, monospace;
}
```

字号走 Tailwind 默认 + 显式任意值，避免误读默认档位：

| 规范         | utility       |
| ------------ | ------------- |
| Hero 72px    | `text-7xl`    |
| H1 56px      | `text-[56px]` |
| H2 40px      | `text-[40px]` |
| H3 28px      | `text-[28px]` |
| Body 18px    | `text-[18px]` |
| Caption 14px | `text-sm`     |

### 2.4 Spacing（8pt grid）

直接用 Tailwind 默认（`1=4px`），不立独立 token。规范 xs/sm/md/lg/xl/xxl=8/16/24/32/48/64 → `p-2/p-4/p-6/p-8/p-12/p-16`。`hero: 160px` 用 `py-[160px]`。Section 上下 padding 用 `py-[120px]`，页面左右 padding 用 `px-[120px]`（≥1280），无 md 屏会与 12-col grid 协作。

### 2.5 Radius / Shadow

```css
@theme inline {
  --radius-lg: 24px;
  --radius-card: 14px;
  --shadow-card: 0 4px 14px rgba(0, 0, 0, 0.08);
  --shadow-card-dark: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 24px 60px -12px rgba(0, 0, 0, 0.5);
  --shadow-popover: 0 8px 30px -4px rgba(0, 0, 0, 0.35);
}
```

Hover 时卡片用 `shadow-[0_0_0_1px_var(--color-primary)]` 实现 Glow Border，不另立 glow token。

### 2.6 不入 token 的项

- Grid：12-col 直接用 Tailwind `grid grid-cols-12`，gap `gap-6`（24px）。
- 1440 / 1200 两个宽度不立 token，统一写 `max-w-[1200px] mx-auto`。
- 动画时长见第 4 节 `--motion-*` token，不和 spacing 混。

---

## 3. 数据层与 Composables

### 3.1 扩 `posts.data.ts` 新字段

当前 `posts.data.ts` 只产 `title / date / tags / url`。共需新增 4 个字段，全部 build-time 算好，零运行时开销：

| 字段          | 算法                                                                                          | 用途                                        |
| ------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `category`    | `p.url.split('/')[1]` → 映射到 `AI/Java/Go/Web`（首字母大写，`web→Web`）                      | DomainCard 统计、过滤                       |
| `words`       | strip frontmatter 后 `content.replace(/\s+/g,'').length`                                      | Statistics CountUp                          |
| `readingTime` | `Math.ceil(words / 300)`（中文阅读 300 字/分）                                                | LatestSection 卡片                          |
| `lastUpdated` | `git log -1 --format=%cd` 每篇 md 的 mtime，build 时批量同步取；失败回退到 frontmatter `date` | DomainCard "最近更新"、Footer "Last Update" |

`words` 的算法刻意从简：首期是估算，不保证精确，CountUp 视觉演示需要数字感而非精确字数；未来上 CMS 时由 CMS 给准确值。

`lastUpdated` 是唯一会拖慢 build 的字段。措施：批量读一遍 `git log --format=%cd -- <glob>`，再按文件名映射，避免每篇写一个子进程。增量 build 预计 < 1s。

### 3.2 `Post` 类型升级

```ts
export interface Post {
  title: string;
  date: string; // 原字段：frontmatter.date
  lastUpdated: string; // 新：git mtime，格式 YYYY-MM-DD
  tags: string[];
  url: string;
  category: "AI" | "Java" | "Go" | "Web";
  words: number;
  readingTime: number; // 分钟
}
```

类型放 `posts.data.ts` 顶部 export，composables 共同 import，不另起 `types/` 目录（YAGNI）。

### 3.3 Composables 契约

**1. `useArticles()` —— 全量文章**

```ts
export function useArticles(): ComputedRef<Post[]>;
```

直接 `computed(() => posts)`，无排序、无过滤。给其他 composable 当数据源，**不对外部组件直接暴露** —— section 不应直接读全量列表，只应通过下面的语义化 composable 取。这是写进 README 的硬约束。

**2. `useLatestArticles(n = 6)` —— 最近 N 篇**

```ts
export function useLatestArticles(n = 6): ComputedRef<Post[]>;
```

`sort by date desc → slice(0, n)`。LatestSection 默认传 6。

**3. `useDomains()` —— 4 领域聚合**

```ts
export interface DomainStat {
  name: "AI" | "Java" | "Go" | "Web";
  icon: string; // Iconify name, e.g. 'ri:robot-line'
  link: string; // /ai/ 等
  accent: string; // primary 系列的 hex，给 DomainCard 的 --accent
  articleCount: number;
  lastUpdated: string; // 该域最新文章的 lastUpdated
  hotTags: string[]; // 该域内出现频次 top 3 的 tag
}
export function useDomains(): ComputedRef<DomainStat[]>;
```

icon 与 accent 在 composable 内部用一个固定的 `DOMAIN_META` 常量定义（不放 token，避免 token 既载视觉又载语义）。hotTags 用 `Map<tag, count>` 统计后取 top 3。空域也要返回 4 条（count=0、hotTags=[]），保证 DomainSection 始终 2×2 骨架稳定。

**4. `useStatistics()` —— 6 维统计**

```ts
export interface SiteStatistics {
  articles: number;
  categories: number; // 固定 4
  tags: number; // unique tag count
  words: number; // sum
  readingTime: number; // sum (分钟), 卡片显示自动转成 "Xh Ym"
  lastUpdate: string; // 全站最晚的 lastUpdated
}
export function useStatistics(): ComputedRef<SiteStatistics>;
```

返回静态 `computed`。**CountUp 动画不在这层做** —— composable 只给最终值，StatisticsSection 自己用 Motion Vue 的 `useMotionValue` + `animate` 跑数字递增。原因：composable 是数据源，动画是 UI 行为，混进来以后改动画就要动数据层。

**5. `useRoadmap()` —— 学习路线常量**

```ts
export interface RoadmapNode {
  label: string;
  desc?: string;
  status: "done" | "active" | "planned";
}
export interface Roadmap {
  id: string;
  title: string;
  nodes: RoadmapNode[];
}
export function useRoadmap(): Roadmap;
```

当前只一条路线，写在 `config/roadmap.ts`：

```ts
export const roadmap: Roadmap = {
  id: "main",
  title: "Main Roadmap",
  nodes: [
    { label: "Java", desc: "后端基础", status: "done" },
    { label: "Spring", desc: "框架", status: "done" },
    { label: "Docker", desc: "容器化", status: "done" },
    { label: "Go", desc: "云原生语言", status: "active" },
    { label: "AI", desc: "LLM 入门", status: "active" },
    { label: "Agent", desc: "智能体", status: "planned" },
    { label: "MCP", desc: "工具协议", status: "planned" },
  ],
};
```

composable 只是 `return roadmap`，包一层是为了将来改成读 frontmatter 时改动只在 composable 内部。

### 3.4 数据流示意

```
posts.data.ts (build-time)
      │
      ▼
useArticles()  ──┬── useLatestArticles()
                 ├── useDomains()
                 └── useStatistics()

useRoadmap()  ←── config/roadmap.ts (常量)

        section 组件只消费语义化 composable
        （不直接调用 useArticles）
```

### 3.5 边界与约束

1. **不引 pinia / 不用 provide-inject**。composables 是 `import posts.data` 的纯函数包装，每次调用都新建 computed；同时被多组件调用会有多个 computed 引用同一份 posts 数组，Vue 依赖图自动去重，无性能问题。
2. **不在 composables 里做副作用**（不发请求、不订 git）。所有这些都是同步纯函数，未来接 CMS 时把 `import posts` 改成异步 fetch + `ref` 即可，section 组件无需改动。
3. **frontmatter 暂不强制要求新字段**。现有 md 没写 `category`，靠 URL 推导；没写 `lastUpdated` 靠 git。这样旧文章无需批量补 frontmatter 就能上首页。

---

## 4. 动画与交互规范

### 4.1 技术栈分工

- **Motion Vue（`motion-v`）** 承担全部动画：入场、Hover/Press 微交互、scroll-driven、Spring layout、CountUp。
- **Lenis** 只做平滑滚动。在 `HomePage.onMounted` 起一个 `new Lenis()`，`requestAnimationFrame` 驱动 `raf`，`onUnmounted` 调 `destroy()`。Roadmap 的 SVG draw 仍由 Motion Vue 的 `useInView` + `pathLength` 动画完成，不引 GSAP。
- **GSAP 移除**。规范 `07-ai-context.md` 里的 GSAP 字样在总纲里改为「可选未来项」，首期不引。

### 4.2 Motion token

在 `style.css` 顶部和颜色 token 一起 `@theme inline`：

```css
@theme inline {
  --motion-hover: 180ms;
  --motion-card: 300ms;
  --motion-section: 500ms;
  --motion-hero: 800ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1); /* ease-out */
}
```

组件里统一用 Tailwind 任意值：`duration-[var(--motion-hover)] ease-[var(--motion-ease)]`，或 Motion Vue 的 `transition={{ duration: 0.18, ease: [0.22,1,0.36,1] }}`，不硬编码数字。

### 4.3 各 Section 动画签名

| Section                              | 入场                                                                  | Hover                                                             | Scroll                                                                            |
| ------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Navbar                               | Fade（800ms opacity 0→1，一次）                                       | —                                                                 | 高度 72→60px、`backdrop-blur-[16px]`、`bg-[rgba(9,9,11,.7)]`；Logo `scale-[0.96]` |
| Hero（容器）                         | 各子元素 Fade Up，delay 100ms 错开                                    | —                                                                 | 不参与滚动（100vh 自带消失）                                                      |
| HeroContent 标题/副标题/按钮         | 各自 Fade Up 800ms / delay 100ms                                      | Btn Hover `scale-1.02` 180ms                                      | —                                                                                 |
| KnowledgeCore                        | Floating 循环 `translateY -8 ↔ 8`，duration 6s `Infinity` ease in-out | 节点 Hover 时 `box-shadow` Glow 180ms，相邻节点 `scale-0.98` 回弹 | 鼠标 move → parallax `translateX/Y ±5px`（`useMotionValue` + `useSpring` 阻尼）   |
| BackgroundCanvas / FloatingParticles | Fade 1200ms（页面入场即开始）                                         | —                                                                 | 不滚动，`fixed` 固定；粒子 `requestAnimationFrame` 自循环                         |
| DomainSection 标题                   | Fade Up 500ms                                                         | —                                                                 | `useInView` 触发                                                                  |
| DomainCard × 4                       | Stagger Fade Up 300ms / 每 60ms 错开                                  | `translateY -8px` + `scale-1.02` + Glow Border，180ms             | 由 `useInView` 触发整批入场                                                       |
| RoadmapSection                       | Fade Up 500ms                                                         | 节点 Hover Glow 180ms                                             | `useInView` 触发 SVG `pathLength` 0→1 800ms；节点 stagger fade 200ms              |
| LatestSection                        | Fade Up 500ms                                                         | ArticleCard `translateY -6px` + Border Glow 180ms                 | `useInView` 触发                                                                  |
| StatisticsSection                    | Fade Up 500ms                                                         | StatItem Hover Glow 180ms                                         | `useInView` 触发；进入视口时数字 `0→value` 1500ms `ease-out` CountUp              |
| FooterSection                        | Fade 800ms                                                            | 链接 Hover 颜色变化 180ms                                         | —                                                                                 |

CountUp 用 Motion Vue 的 `useMotionValue(0)` + `animate(to, { duration: 1.5 })` + `useTransform` 到 `Math.round`，模板里直接 `{{ display }}`，**不**自己写 `setInterval`（旧 `HomePage.vue` 那种打字机模式废弃）。

### 4.4 禁止清单

- 过度动画、Bounce、Flash、无限旋转 全禁。
- 动画只动 `transform` + `opacity`，不动 width/height/top/left，GPU 加速。
- 不写 `window.addEventListener('scroll', …)`，scroll-driven 一律走 Motion Vue 的 `useInView` / `useScroll`，配合 Lenis 同步。
- 入场动画用 `useInView({ once: true })`，回头滚动不重放。

### 4.5 性能护栏

- BackgroundCanvas / FloatingParticles 用 `will-change: transform`、`transform: translateZ(0)`，但**只挂在 HomePage 生命周期内**，不在全局 Layout 上常驻。
- KnowledgeCore 的 parallax 用 `useSpring` 阻尼（stiffness 100、damping 20），鼠标停下后位移 100ms 内回正。
- 所有 `useInView` 触发的动画 `once: true`，IntersectionObserver 自动 disconnect。

---

## 5. 各 Section 详细布局 + 响应式 + 性能

所有 section 共用：

- 容器 `max-w-[1200px] mx-auto px-[120px]`（≥1280）；Tablet `px-12`；Mobile `px-6`。
- 上下 padding `py-[120px]`；Tablet/Mobile 缩到 `py-[80px]`。
- section 标题统一 `text-[40px] font-heading font-bold`，副标题 `text-[18px] text-secondary`。
- 卡片基类：`bg-card border border-border rounded-card shadow-card transition-transform duration-[var(--motion-card)] ease-[var(--motion-ease)]`。

### 5.1 NavbarSection

```
fixed top-0 inset-x-0 z-50
原高 h-[72px]  → 滚 100px 后 h-[60px] + backdrop-blur-[16px] + bg-[rgba(9,9,11,.7)]
```

- 左：Logo `w-8 h-8`，文字 `XM Knowledge` `text-sm font-semibold`。
- 中：导航 `Home / AI / Java / Go / Web / Archive / Tags`（规范给的清单含 Search，但 search panel 非首期功能，先占总位、不接逻辑）。
- 右：GitHub Icon（`@iconify/simple-icons:github`）+ Search Button（占位，禁用状态）。
- 滚动触发用 Motion Vue 的 `useScroll()` + `useTransform(scrollY, [0,100], [72,60])` 高度，blur 通过 `scrollY > 100` 的 `ref<boolean>` 切 class。
- Mobile：汉堡菜单，点击展开下拉 `flex-col`，items 入场用 stagger 100ms。
- Light 模式：`bg-[rgba(255,255,255,.7)]` + 文字 `var(--color-text-light)`，blur 保持 16px。

### 5.2 HeroSection

```
min-h-screen  flex  items-center  gap-12
左 flex-1   HeroContent
右 w-[420px] KnowledgeCore
```

Hero（容器）整段 `useScroll` 实现轻微 fade-out 当向下滚，optional，首期可不做。

**HeroContent**（左栏）：

- Badge `XM 的知识库` chip 样式。
- H1 `XM Knowledge` `text-[72px] font-heading font-extrabold`，渐变文字 `bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`（去掉旧的打字机和 cursor）。
- 副标题 `A developer's living knowledge base.` `text-[28px] text-secondary`。
- 介 `持续整理 AI、Java、Go、Web 等领域的学习笔记与实践经验。` `text-[18px] text-secondary`。
- 按钮 `flex gap-3 mt-8`：`Start Reading` → `/java/` primary 实心；`GitHub` outline。
- 入场：badge → title → subtitle → desc → buttons 顺序 stagger 120ms。

**KnowledgeCore**（右栏）：

- 容器 `relative w-[420px] h-[420px]`。
- SVG 四个节点 `[AI, Java ● Web, Go]` 的菱形布局，中心 `●` 是"现在"标记。
- 各节点 `a` 包裹的卡片，icon `Iconify`，label `text-secondary text-sm`，Hover 时 Glow `box-shadow: 0 0 24px var(--color-primary)`。
- 容器整段 `motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}`，即规范要求的 Floating 6s 循环。
- Parallax：`onMouseMove` 计算相对中心偏移，`useMotionValue` 给 `rotateX/Y ±5deg`，用 `useSpring` 阻尼。
- Mobile（≤767）：右栏整体隐藏（`hidden md:block`），Hero 改单栏上下布局，KnowledgeCore 不出现。

### 5.3 DomainSection

- `grid grid-cols-2 gap-6`（Desktop）；Tablet 继续 2 列；Mobile 1 列。
- 4 个 `DomainCard`。
- 卡片结构：顶部 icon（48×48 圆角方块，背景 `bg-primary/10`，图标用 `Iconify`：AI `ri:robot-line`、Java `mdi:coffee`、Go `mdi:language-go`、Web `mdi:web`，全部用 `accent` 色覆盖），下方 `category-name`、`category-desc`、`{{articleCount}} articles · updated {{lastUpdated}}`、热门 tags（3 个 chip），底部 `Continue →`。
- Hover：`translate-y-[-8px] scale-[1.02]`，Glow border `shadow-[0_0_0_1px_var(--color-primary),0_8px_32px_-8px_var(--color-primary)]`。
- 入场：`useInView` once，stagger 60ms。

### 5.4 RoadmapSection

- 单一路线，水平展开（非时间轴）。
- 容器 `relative overflow-x-auto`，内部 SVG `w-full h-[160px]`。
- SVG `<path>` 走 S 形曲线连接节点，节点在 path 上等距排布。
- 滚动到视口：`pathLength 0→1` 800ms；节点 stagger fade 200ms，status 标识：done `border-primary bg-primary/20`、active `border-primary bg-primary text-white pulse-glow`、planned `border-border/bg-card`。
- 上面标签 `label`，下面 `desc` `text-xs text-secondary`。
- Mobile：横向滚动 `overflow-x-auto`，节点间距缩到 `min-w-[120px]`。

### 5.5 LatestSection

- `grid grid-cols-3 gap-6`（Desktop）；Tablet 2 列；Mobile 1 列。
- 卡片：标题 `text-[18px] font-semibold`，分类 chip + 日期 `text-sm text-secondary`，阅读时间 `text-xs text-secondary`（右下角），tags 最多 2 个。
- Hover：`translate-y-[-6px]` + Glow Border。
- 空状态（无文章）：显示 `empty-state` 提示 `📝 暂无文章，内容迁移中...`，走 Tailwind utility。

### 5.6 StatisticsSection

- `grid grid-cols-3 gap-6`（Desktop）；Tablet 2 列；Mobile 2 列（保证 6 格排得开）。
- 6 个：Articles / Categories / Tags / Words / Reading Time / Last Update。
- 卡片 `aspect-[3/2]` 居中：数字 `text-[48px] font-bold text-primary` CountUp，标签 `text-sm text-secondary uppercase tracking-wider`。
- Reading Time 显示 `5h 30m`，在 composable 给分钟，组件层 `Math.floor(m/60) + 'h ' + (m%60) + 'm'`。
- Last Update 直接显示日期字符串，不 CountUp。

### 5.7 FooterSection

- `border-t border-border py-16`。
- 左：GitHub / RSS / License 链接 + Copyright。
- 右/底部：当前学习 chip（MCP / Agent / LangGraph）+ 一句话 `Build continuously. Learn continuously.`。
- RSS 用现有 `vitepress-plugin-rss` 配置生成，footer 链接指向 `/rss.xml`。

### 5.8 响应式断点

|                 | Desktop     | Tablet                     | Mobile                     |
| --------------- | ----------- | -------------------------- | -------------------------- |
| 断点            | ≥1280       | 768~1279                   | ≤767                       |
| 容器 px         | 120         | 48                         | 24                         |
| section py      | 120         | 80                         | 80                         |
| Navbar          | 7-item 横排 | 折叠为汉堡                 | 汉堡                       |
| Hero            | 左右双栏    | 单栏（KnowledgeCore 显示） | 单栏（KnowledgeCore 隐藏） |
| DomainCard grid | 2×2         | 2×2                        | 1 列                       |
| Roadmap         | SVG 完整宽  | 横滚                       | 横滚                       |
| LatestArticle   | 3 列        | 2 列                       | 1 列                       |
| Statistics      | 3×2         | 3×2                        | 2×3                        |
| Title sizes     | 40px        | 32px                       | 28px（任意值）             |

### 5.9 性能要求

- Hero 首屏 **LCP < 2s**。实现：KnowledgeCore 用 inline SVG 不依赖请求；字体 `font-display: swap` 通过 Tailwind 默认；重要 icons 改用 local SVG 不走 Iconify CDN。Lenis 在 `requestIdleCallback` 之后才 init，不阻塞 LCP。
- 所有 `useInView` 触发的 section 动画 `once: true`。
- 图片资源懒加载：首期首页没有 `<img>`（KnowledgeCore 是 SVG、DomainCard 是 icon font），此条自动满足。
- 禁止 `transform/opacity` 之外属性的任何动画。
- BackgroundCanvas 内嵌 CSS mesh gradient，不请求图片；noise 用 SVG `<filter>` 内联，零网络。
- Lenis 实例必须在 `HomePage.onUnmounted` `destroy()`，不污染 md 文档页滚动。

---

## 6. 落地策略

**整体重写**：在 `theme/components/home/` 下全新写一套，在 `Layout.vue` 里把对旧 `HomePage.vue` 的指向替换为新 `home/HomePage.vue`，旧文件直接删。

理由：个人项目无线上灰度压力；旧 `HomePage.vue` 472 行 scoped CSS 无法复用；增量替换省下的安全边际抵不过两套并存的心智负担；git 一键回滚已足够保底。

writing-plans 按此策略产出任务序列：先建目录骨架 + design tokens + composables 骨架（让 dev server 能跑空架），再逐 section 填充，最后一次性切 `Layout.vue` 指向。

---

## 7. 未来规划（预留，不在本期实现）

规范 `01` 第 19 章列出的扩展项，本期仅保证架构可扩展，不实现：

- AI Search / RAG 检索
- Knowledge Graph（KnowledgeCore 已为它预留独立组件）
- Reading Progress / Reading Heatmap
- GitHub Contribution
- AI Chat Assistant
- MCP 集成
- Search 面板（Navbar 已占位禁用按钮）

---

## 8. 与原规范的差异说明

本总纲相对 `docs/spec/00..07` 的差异：

1. **GSAP 移除**：`07-ai-context.md` 列了 GSAP，本期不引；如未来 Roadmap SVG draw 需要更精细控制再评估。
2. **组件架构合并**：`01` 给平铺 10 组件，`02` 给分层 + `FloatingParticles`，本总纲合并为 02 分层 + `BackgroundCanvas` 包 `FloatingParticles`，统一背景入口。
3. **设计 token 补完**：`04-design-system.md` 只列 token 名未给色值，本总纲补齐 dark + light 完整色值与 Tailwind v4 注入方式。
4. **数据层细化**：原规范只提「数据统一 composables」未给契约，本总纲定义 5 个 composable 签名 + `posts.data.ts` 扩字段算法。
5. **CountUp 实现方式**：原规范未指定，本总纲定为 Motion Vue `useMotionValue`，禁止 `setInterval`。
6. **打字机效果废除**：旧 `HomePage.vue` 的 `setInterval` 打字机 + cursor 在新设计中移除，Hero 副标题直接静态显示。
7. **轻量状态管理**：明确不引 pinia / 不用 provide-inject，数据层走 composables + 本地 `ref`。
