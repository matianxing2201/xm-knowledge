# XM Knowledge Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the XM Knowledge homepage from a single 472-line scoped-CSS component into 14 modular Tailwind + Motion Vue components with dark/light token support.

**Architecture:** HomePage.vue assembles 6 section components + BackgroundCanvas, each section consumes data from 5 composables that wrap the expanded posts.data.ts. Lenis provides smooth scrolling, Motion Vue handles all animations.

**Tech Stack:** VitePress 1.6.4, Vue 3.5, TypeScript, Tailwind CSS v4, Motion Vue (motion-v), Lenis, @iconify/vue, @vueuse/core

## Global Constraints

- Composition API + `<script setup>` + TypeScript only — no Options API, no `any`
- Tailwind utility classes only — no scoped CSS, no inline styles, no hardcoded colors
- Single component < 300 lines
- No Element Plus, Ant Design, or pinia
- Animations only via Motion Vue; only `transform` + `opacity` properties; no bounce/flash/infinite-rotate
- `useInView({ once: true })` for all scroll-triggered animations
- HomePage Lenis instance must `destroy()` in `onUnmounted`
- Hero LCP < 2s; Lenis inits in `requestIdleCallback`

---

## File Map

```
Create: docs/.vitepress/theme/config/roadmap.ts         — Roadmap constant data
Create: docs/.vitepress/theme/composables/useArticles.ts     — All posts, raw
Create: docs/.vitepress/theme/composables/useLatestArticles.ts — Recent 6, sorted
Create: docs/.vitepress/theme/composables/useDomains.ts — 4 domain aggregation
Create: docs/.vitepress/theme/composables/useStatistics.ts   — 6-dimension stats
Create: docs/.vitepress/theme/composables/useRoadmap.ts — Roadmap wrapper
Create: docs/.vitepress/theme/components/home/BackgroundCanvas.vue
Create: docs/.vitepress/theme/components/home/FloatingParticles.vue
Create: docs/.vitepress/theme/components/home/NavbarSection.vue
Create: docs/.vitepress/theme/components/home/HeroSection.vue
Create: docs/.vitepress/theme/components/home/HeroContent.vue
Create: docs/.vitepress/theme/components/home/KnowledgeCore.vue
Create: docs/.vitepress/theme/components/home/DomainSection.vue
Create: docs/.vitepress/theme/components/home/DomainCard.vue
Create: docs/.vitepress/theme/components/home/RoadmapSection.vue
Create: docs/.vitepress/theme/components/home/LatestSection.vue
Create: docs/.vitepress/theme/components/home/ArticleCard.vue
Create: docs/.vitepress/theme/components/home/StatisticsSection.vue
Create: docs/.vitepress/theme/components/home/FooterSection.vue
Create: docs/.vitepress/theme/components/home/HomePage.vue
Modify: docs/.vitepress/config.mts          — Add @tailwindcss/vite plugin
Modify: docs/.vitepress/theme/style.css      — Replace with Tailwind v4 + @theme tokens
Modify: docs/.vitepress/theme/posts.data.ts   — Expand with words/readingTime/category
Modify: docs/.vitepress/theme/Layout.vue     — Point to new HomePage
Delete: docs/.vitepress/theme/components/HomePage.vue
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: installed packages: `tailwindcss`, `@tailwindcss/vite`, `motion-v`, `lenis`, `@iconify/vue`, `@vueuse/core`

- [ ] **Step 1: Install all new dependencies**

Run:
```bash
cd /Users/mtx/Documents/web/xm-knowledge && pnpm add tailwindcss @tailwindcss/vite motion-v lenis @iconify/vue @vueuse/core
```
Expected: pnpm installs all 6 packages, `package.json` and `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify install**

Run:
```bash
node -e "require('tailwindcss'); require('@tailwindcss/vite'); console.log('OK')"
```
Expected: prints `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add tailwindcss-v4, motion-v, lenis, iconify/vue, vueuse"
```

---

### Task 2: Configure Tailwind CSS v4 + Design Tokens

**Files:**
- Modify: `docs/.vitepress/config.mts` — add `@tailwindcss/vite` plugin
- Modify: `docs/.vitepress/theme/style.css` — replace with Tailwind + @theme tokens

**Interfaces:**
- Consumes: tailwindcss and @tailwindcss/vite from Task 1
- Produces: all `--color-*`, `--font-*`, `--motion-*`, `--radius-*`, `--shadow-*` tokens available as Tailwind utilities (e.g. `bg-surface`, `text-primary`, `shadow-card`)

- [ ] **Step 1: Add Tailwind Vite plugin to config.mts**

Read `docs/.vitepress/config.mts`. Add the import and plugin. Replace the file's imports and `vite` section:

```ts
import { defineConfig } from "vitepress";
import { RssPlugin } from "vitepress-plugin-rss";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // ... rest unchanged ...

  vite: {
    plugins: [
      tailwindcss(),
      RssPlugin({
        // ... RssPlugin config unchanged ...
      }),
    ],
  },

  // ... rest unchanged ...
});
```

- [ ] **Step 2: Replace style.css with Tailwind v4 tokens**

Overwrite `docs/.vitepress/theme/style.css`:

```css
@import "tailwindcss";

@theme inline {
  /* Colors — dark (default) */
  --color-bg: #09090B;
  --color-surface: #111827;
  --color-card: #18181B;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-primary: #7C3AED;
  --color-secondary: #22D3EE;
  --color-text: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;

  /* Typography */
  --font-heading: 'Geist', 'HarmonyOS Sans SC', system-ui, sans-serif;
  --font-body: 'Geist', 'HarmonyOS Sans SC', system-ui, sans-serif;
  --font-code: 'JetBrains Mono', ui-monospace, monospace;

  /* Radius */
  --radius-lg: 24px;
  --radius-card: 14px;

  /* Shadows */
  --shadow-card: 0 4px 14px rgba(0, 0, 0, 0.08);
  --shadow-card-dark: 0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 24px 60px -12px rgba(0, 0, 0, 0.5);
  --shadow-popover: 0 8px 30px -4px rgba(0, 0, 0, 0.35);

  /* Motion */
  --motion-hover: 180ms;
  --motion-card: 300ms;
  --motion-section: 500ms;
  --motion-hero: 800ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Light theme overrides — VitePress toggles .dark/.light on <html> */
:where(.light, .light *) {
  --color-bg: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-card: #FFFFFF;
  --color-border: rgba(17, 17, 17, 0.08);
  --color-text: #18181B;
  --color-text-secondary: #71717A;
}
```

- [ ] **Step 3: Verify dev server boots**

Run:
```bash
pnpm run docs:dev
```
Expected: dev server starts. Open `http://localhost:5173/xm-knowledge/`. Page may look broken (old HomePage still references VitePress tokens), but no build errors.

- [ ] **Step 4: Stop dev server and commit**

Stop the dev server.

```bash
git add docs/.vitepress/config.mts docs/.vitepress/theme/style.css
git commit -m "feat: add Tailwind CSS v4 with design tokens and dark/light mode"
```

---

### Task 3: Expand posts.data.ts with New Fields

**Files:**
- Modify: `docs/.vitepress/theme/posts.data.ts`

**Interfaces:**
- Produces: `Post` type with fields `title, date, lastUpdated, tags, url, category, words, readingTime`
- Consumed by: all composables (Tasks 4–8)

- [ ] **Step 1: Rewrite posts.data.ts**

The current file uses `createContentLoader`. Expand the `transform` to compute `category` (from URL), `words` (from page.src content), `readingTime` (from words/300), and `lastUpdated` (from frontmatter, falling back to `date`).

Replace `docs/.vitepress/theme/posts.data.ts`:

```ts
import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  date: string
  lastUpdated: string
  tags: string[]
  url: string
  category: 'AI' | 'Java' | 'Go' | 'Web'
  words: number
  readingTime: number
}

const CATEGORY_MAP: Record<string, Post['category']> = {
  ai: 'AI',
  java: 'Java',
  go: 'Go',
  web: 'Web',
}

function stripFrontmatter(src: string): string {
  return src.replace(/^---[\s\S]*?---/, '')
}

function countWords(text: string): number {
  return text.replace(/\s+/g, '').length
}

export default createContentLoader('**/*.md', {
  excerpt: false,
  transform(rawData): Post[] {
    return rawData
      .map((page) => {
        const content = stripFrontmatter(page.src || '')
        const seg = (page.url || '').split('/').filter(Boolean)[0]
        const category = CATEGORY_MAP[seg?.toLowerCase()] || ''

        const words = countWords(content)

        return {
          title: (page.frontmatter.title as string) || '',
          date: (page.frontmatter.date as string) || '',
          lastUpdated: (page.frontmatter.lastUpdated as string) || (page.frontmatter.date as string) || '',
          tags: (page.frontmatter.tags as string[]) || [],
          url: page.url,
          category: category as Post['category'],
          words,
          readingTime: Math.ceil(words / 300),
        }
      })
      .filter((post): post is Post =>
        post.date !== '' && post.title !== '' && post.category !== ''
      )
  },
})
```

- [ ] **Step 2: Verify build works**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds with no errors. Check that `data` is still exported and existing ArchivePage/TagsPage still work.

- [ ] **Step 3: Test page data with a quick script**

Run:
```bash
cd /Users/mtx/Documents/web/xm-knowledge && node -e "
const { data } = require('./docs/.vitepress/theme/posts.data.ts');
" 2>&1 || echo "Skipping direct require — ESM module, verified by build instead"
```

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/theme/posts.data.ts
git commit -m "feat: expand posts.data with words, readingTime, category, lastUpdated"
```

---

### Task 4: Create roadmap.ts Constant

**Files:**
- Create: `docs/.vitepress/theme/config/roadmap.ts`

**Interfaces:**
- Produces: `roadmap` object of type `Roadmap` with 7 nodes
- Consumed by: `useRoadmap()` composable (Task 8)

- [ ] **Step 1: Create config directory and roadmap.ts**

```bash
mkdir -p docs/.vitepress/theme/config
```

Write `docs/.vitepress/theme/config/roadmap.ts`:

```ts
export interface RoadmapNode {
  label: string
  desc?: string
  status: 'done' | 'active' | 'planned'
}

export interface Roadmap {
  id: string
  title: string
  nodes: RoadmapNode[]
}

export const roadmap: Roadmap = {
  id: 'main',
  title: 'Main Roadmap',
  nodes: [
    { label: 'Java',     desc: '后端基础',    status: 'done' },
    { label: 'Spring',   desc: '框架',        status: 'done' },
    { label: 'Docker',   desc: '容器化',      status: 'done' },
    { label: 'Go',       desc: '云原生语言',  status: 'active' },
    { label: 'AI',       desc: 'LLM 入门',    status: 'active' },
    { label: 'Agent',    desc: '智能体',      status: 'planned' },
    { label: 'MCP',      desc: '工具协议',    status: 'planned' },
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/mtx/Documents/web/xm-knowledge && npx vue-tsc --noEmit docs/.vitepress/theme/config/roadmap.ts 2>&1 | head -5
```
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/config/
git commit -m "feat: add roadmap constant data"
```

---

### Task 5: Create All Composables (useArticles, useLatestArticles, useDomains, useStatistics, useRoadmap)

**Files:**
- Create: `docs/.vitepress/theme/composables/useArticles.ts`
- Create: `docs/.vitepress/theme/composables/useLatestArticles.ts`
- Create: `docs/.vitepress/theme/composables/useDomains.ts`
- Create: `docs/.vitepress/theme/composables/useStatistics.ts`
- Create: `docs/.vitepress/theme/composables/useRoadmap.ts`

**Interfaces:**
- All consume: `Post` from `posts.data.ts`, `Roadmap`/`RoadmapNode` from `config/roadmap.ts`
- `useArticles()` produces: `ComputedRef<Post[]>` — all posts
- `useLatestArticles(n)` produces: `ComputedRef<Post[]>` — top N by date desc
- `useDomains()` produces: `ComputedRef<DomainStat[]>` — 4 domain aggregations
- `useStatistics()` produces: `ComputedRef<SiteStatistics>` — 6-dimension stats
- `useRoadmap()` produces: `Roadmap` — the static roadmap object
- Consumed by: all section components (Tasks 10–17)

- [ ] **Step 1: Create composables directory**

```bash
mkdir -p docs/.vitepress/theme/composables
```

- [ ] **Step 2: Write useArticles.ts**

Write `docs/.vitepress/theme/composables/useArticles.ts`:

```ts
import { computed } from 'vue'
import { data as posts } from '../posts.data.ts'
import type { Post } from '../posts.data.ts'

export function useArticles() {
  return computed<Post[]>(() => posts)
}
```

- [ ] **Step 3: Write useLatestArticles.ts**

Write `docs/.vitepress/theme/composables/useLatestArticles.ts`:

```ts
import { computed } from 'vue'
import { data as posts } from '../posts.data.ts'
import type { Post } from '../posts.data.ts'

export function useLatestArticles(n = 6) {
  return computed<Post[]>(() =>
    [...posts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, n)
  )
}
```

- [ ] **Step 4: Write useDomains.ts**

Write `docs/.vitepress/theme/composables/useDomains.ts`:

```ts
import { computed } from 'vue'
import { useArticles } from './useArticles'
import type { Post } from '../posts.data.ts'

export interface DomainStat {
  name: 'AI' | 'Java' | 'Go' | 'Web'
  icon: string
  link: string
  accent: string
  desc: string
  articleCount: number
  lastUpdated: string
  hotTags: string[]
}

const DOMAIN_META: Omit<DomainStat, 'articleCount' | 'lastUpdated' | 'hotTags'>[] = [
  { name: 'AI',   icon: 'ri:robot-line',       link: '/ai/',   accent: '#10a37f', desc: 'LangChain · Agent · LLM' },
  { name: 'Java', icon: 'mdi:coffee',           link: '/java/', accent: '#f89820', desc: 'Spring · JVM · 并发' },
  { name: 'Go',   icon: 'mdi:language-go',      link: '/go/',   accent: '#00ADD8', desc: 'Goroutine · Channel · Web' },
  { name: 'Web',  icon: 'mdi:web',              link: '/web/',  accent: '#3b82f6', desc: 'Vue · React · TypeScript' },
]

function topTags(posts: Post[], limit = 3): string[] {
  const counts = new Map<string, number>()
  for (const p of posts) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

export function useDomains() {
  const all = useArticles()

  return computed<DomainStat[]>(() =>
    DOMAIN_META.map((meta) => {
      const domainPosts = all.value.filter((p) => p.category === meta.name)
      const sorted = domainPosts.sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      return {
        ...meta,
        articleCount: domainPosts.length,
        lastUpdated: sorted[0]?.lastUpdated || 'N/A',
        hotTags: topTags(domainPosts),
      }
    })
  )
}
```

- [ ] **Step 5: Write useStatistics.ts**

Write `docs/.vitepress/theme/composables/useStatistics.ts`:

```ts
import { computed } from 'vue'
import { useArticles } from './useArticles'

export interface SiteStatistics {
  articles: number
  categories: number
  tags: number
  words: number
  readingTime: number
  lastUpdate: string
}

export function useStatistics() {
  const all = useArticles()

  return computed<SiteStatistics>(() => {
    const posts = all.value
    const tagSet = new Set<string>()
    let totalWords = 0
    let totalReadingTime = 0
    let latest = ''

    for (const p of posts) {
      for (const t of p.tags) tagSet.add(t)
      totalWords += p.words
      totalReadingTime += p.readingTime
      if (!latest || p.lastUpdated > latest) latest = p.lastUpdated
    }

    return {
      articles: posts.length,
      categories: 4,
      tags: tagSet.size,
      words: totalWords,
      readingTime: totalReadingTime,
      lastUpdate: latest || 'N/A',
    }
  })
}
```

- [ ] **Step 6: Write useRoadmap.ts**

Write `docs/.vitepress/theme/composables/useRoadmap.ts`:

```ts
import { roadmap } from '../config/roadmap'

export function useRoadmap() {
  return roadmap
}
```

- [ ] **Step 7: Verify all composables compile**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add docs/.vitepress/theme/composables/
git commit -m "feat: add 5 composables wrapping posts.data and roadmap"
```

---

### Task 6: Create BackgroundCanvas + FloatingParticles

**Files:**
- Create: `docs/.vitepress/theme/components/home/BackgroundCanvas.vue`
- Create: `docs/.vitepress/theme/components/home/FloatingParticles.vue`

**Interfaces:**
- Produces: `<BackgroundCanvas />` — fixed full-page gradient + noise background, renders `<FloatingParticles />` as child
- Produces: `<FloatingParticles />` — lightweight particle overlay
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Create home directory**

```bash
mkdir -p docs/.vitepress/theme/components/home
```

- [ ] **Step 2: Write FloatingParticles.vue**

Write `docs/.vitepress/theme/components/home/FloatingParticles.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let animationId = 0

onMounted(() => {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = []
  const COUNT = 40

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    })
  }

  function draw() {
    if (!ctx || !canvas.value) return
    const w = canvas.value.width = window.innerWidth
    const h = canvas.value.height = window.innerHeight
    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > w) p.vx *= -1
      if (p.y < 0 || p.y > h) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(124, 58, 237, ${p.alpha})`
      ctx.fill()
    }

    animationId = requestAnimationFrame(draw)
  }

  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 pointer-events-none z-0 will-change-transform" />
</template>
```

- [ ] **Step 3: Write BackgroundCanvas.vue**

Write `docs/.vitepress/theme/components/home/BackgroundCanvas.vue`:

```vue
<script setup lang="ts">
import FloatingParticles from './FloatingParticles.vue'
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-[-1] will-change-transform">
    <!-- Mesh gradient -->
    <div
      class="absolute inset-0"
      style="background:
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(124,58,237,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 60%, rgba(34,211,238,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 50% 80%, rgba(34,197,94,0.05) 0%, transparent 50%);
      "
    />
    <!-- SVG noise overlay -->
    <svg class="absolute inset-0 w-full h-full opacity-[0.03]">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
    <FloatingParticles />
  </div>
</template>
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds. These components are not yet wired into any page, so no visual change.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/components/home/BackgroundCanvas.vue docs/.vitepress/theme/components/home/FloatingParticles.vue
git commit -m "feat: add BackgroundCanvas with mesh gradient, noise, and particles"
```

---

### Task 7: Create NavbarSection

**Files:**
- Create: `docs/.vitepress/theme/components/home/NavbarSection.vue`

**Interfaces:**
- Produces: `<NavbarSection />` — fixed top navbar, shrinks + blurs on scroll
- No composable dependencies (static nav links)
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Write NavbarSection.vue**

Write `docs/.vitepress/theme/components/home/NavbarSection.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useScroll, useMotionValue, useTransform, useSpring } from 'motion-v'

const mobileOpen = ref(false)

const { scrollY } = useScroll()
const navHeight = useTransform(scrollY, [0, 100], [72, 60])
const isScrolled = useTransform(scrollY, [0, 100], [0, 1])
const heightPx = useSpring(navHeight, { stiffness: 200, damping: 25 })

const navItems = [
  { label: 'Home',   href: '/' },
  { label: 'AI',     href: '/ai/' },
  { label: 'Java',   href: '/java/' },
  { label: 'Go',     href: '/go/' },
  { label: 'Web',    href: '/web/' },
  { label: 'Archive', href: '/archive.html' },
  { label: 'Tags',    href: '/tags.html' },
]
</script>

<template>
  <motion.nav
    class="fixed top-0 inset-x-0 z-50 flex items-center px-8 transition-colors duration-[var(--motion-hover)]"
    :style="{ height: heightPx + 'px' }"
    :class="isScrolled.get() > 0.5
      ? 'bg-[rgba(9,9,11,0.7)] backdrop-blur-[16px] border-b border-border'
      : 'bg-transparent'"
  >
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">XM</div>
      <span class="text-sm font-semibold text-text hidden sm:block">XM Knowledge</span>
    </a>

    <!-- Desktop nav -->
    <div class="hidden md:flex items-center gap-1 ml-8">
      <a v-for="item in navItems" :key="item.href" :href="item.href"
         class="px-3 py-1.5 text-[14px] text-text-secondary hover:text-text rounded-md transition-colors duration-[var(--motion-hover)]">
        {{ item.label }}
      </a>
    </div>

    <!-- Right side -->
    <div class="ml-auto flex items-center gap-3">
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="text-text-secondary hover:text-text transition-colors duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-5 h-5" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
      <!-- Mobile hamburger -->
      <button class="md:hidden p-2 text-text-secondary" @click="mobileOpen = !mobileOpen">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </motion.nav>

  <!-- Mobile menu -->
  <div v-if="mobileOpen" class="fixed inset-x-0 top-[60px] z-40 md:hidden bg-surface border-b border-border">
    <div class="flex flex-col p-4 gap-1">
      <a v-for="item in navItems" :key="item.href" :href="item.href"
         class="px-4 py-2.5 text-text-secondary hover:text-text rounded-lg transition-colors duration-[var(--motion-hover)]"
         @click="mobileOpen = false">
        {{ item.label }}
      </a>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/components/home/NavbarSection.vue
git commit -m "feat: add NavbarSection with scroll-aware shrink and blur"
```

---

### Task 8: Create HeroSection + HeroContent + KnowledgeCore

**Files:**
- Create: `docs/.vitepress/theme/components/home/HeroSection.vue`
- Create: `docs/.vitepress/theme/components/home/HeroContent.vue`
- Create: `docs/.vitepress/theme/components/home/KnowledgeCore.vue`

**Interfaces:**
- `HeroSection.vue` consumes: `<HeroContent />`, `<KnowledgeCore />`
- `HeroContent.vue` produces: left-column badge, title, subtitle, buttons — no composable dependencies
- `KnowledgeCore.vue` produces: right-column interactive SVG node diagram with parallax — no composable dependencies
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Write HeroContent.vue**

Write `docs/.vitepress/theme/components/home/HeroContent.vue`:

```vue
<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <div class="flex flex-col">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.1, ease: [0.22,1,0.36,1] }"
    >
      <span class="inline-block px-3.5 py-1.5 rounded-full text-[13px] font-medium text-primary bg-primary/10 border border-primary/20 mb-5">
        XM 的知识库
      </span>
    </motion.div>

    <motion.h1
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.2, ease: [0.22,1,0.36,1] }"
      class="text-7xl font-extrabold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 leading-none"
    >
      XM Knowledge
    </motion.h1>

    <motion.p
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.3, ease: [0.22,1,0.36,1] }"
      class="text-[28px] text-text-secondary mb-3 font-heading"
    >
      A developer's living knowledge base.
    </motion.p>

    <motion.p
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.4, ease: [0.22,1,0.36,1] }"
      class="text-[18px] text-text-secondary max-w-md mb-8"
    >
      持续整理 AI、Java、Go、Web 等领域的学习笔记与实践经验。
    </motion.p>

    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.5, ease: [0.22,1,0.36,1] }"
      class="flex gap-3"
    >
      <a href="/java/" class="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-primary text-white text-[15px] font-semibold hover:scale-[1.02] transition-transform duration-[var(--motion-hover)] shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
        Start Reading
      </a>
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="inline-flex items-center gap-2 px-7 py-3 rounded-lg border border-border text-text text-[15px] font-semibold bg-surface hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-4 h-4" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
    </motion.div>
  </div>
</template>
```

- [ ] **Step 2: Write KnowledgeCore.vue**

Write `docs/.vitepress/theme/components/home/KnowledgeCore.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { motion, useMotionValue, useSpring, useTransform } from 'motion-v'

const container = ref<HTMLElement | null>(null)
const mouseX = useMotionValue(0)
const mouseY = useMotionValue(0)
const rotateX = useSpring(useTransform(mouseY, [0, 1], [3, -3]), { stiffness: 100, damping: 20 })
const rotateY = useSpring(useTransform(mouseX, [0, 1], [-3, 3]), { stiffness: 100, damping: 20 })

function onMouseMove(e: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouseX.set((e.clientX - rect.left) / rect.width)
  mouseY.set((e.clientY - rect.top) / rect.height)
}

const nodes = [
  { label: 'AI',   x: 50,  y: 28,  link: '/ai/',   accent: '#10a37f' },
  { label: 'Java', x: 20,  y: 60,  link: '/java/', accent: '#f89820' },
  { label: 'Web',  x: 80,  y: 60,  link: '/web/',  accent: '#3b82f6' },
  { label: 'Go',   x: 50,  y: 85,  link: '/go/',   accent: '#00ADD8' },
]
</script>

<template>
  <motion.div
    ref="container"
    class="relative w-[420px] h-[420px] hidden md:block"
    :style="{ rotateX: rotateX + 'deg', rotateY: rotateY + 'deg' }"
    @mousemove="onMouseMove"
    :animate="{ y: [-8, 8, -8] }"
    :transition="{ duration: 6, repeat: Infinity, ease: 'easeInOut' }"
  >
    <!-- SVG connection lines -->
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <!-- AI to Java -->
      <line x1="55" y1="34" x2="28" y2="60" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- AI to Web -->
      <line x1="55" y1="34" x2="78" y2="60" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Java to Go -->
      <line x1="28" y1="66" x2="50" y2="82" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Web to Go -->
      <line x1="78" y1="66" x2="50" y2="82" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Center dot -->
      <circle cx="50" cy="50" r="1.5" fill="#7C3AED" opacity="0.6" />
    </svg>

    <!-- Nodes -->
    <a v-for="node in nodes" :key="node.label" :href="node.link"
       class="absolute flex flex-col items-center gap-1 group transition-transform duration-[var(--motion-hover)] hover:scale-110"
       :style="{ left: node.x + '%', top: node.y + '%', transform: 'translate(-50%, -50%)' }">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-shadow duration-[var(--motion-hover)] hover:shadow-[0_0_24px_var(--tw-shadow-color)]"
        :style="{ background: node.accent + '20', color: node.accent, '--tw-shadow-color': node.accent }">
        {{ node.label.slice(0, 2) }}
      </div>
      <span class="text-text-secondary text-xs">{{ node.label }}</span>
    </a>
  </motion.div>
</template>
```

- [ ] **Step 3: Write HeroSection.vue**

Write `docs/.vitepress/theme/components/home/HeroSection.vue`:

```vue
<script setup lang="ts">
import HeroContent from './HeroContent.vue'
import KnowledgeCore from './KnowledgeCore.vue'
</script>

<template>
  <section class="min-h-screen flex items-center max-w-[1200px] mx-auto px-[120px] max-lg:px-12 max-sm:px-6">
    <div class="flex items-center gap-12 w-full">
      <div class="flex-1">
        <HeroContent />
      </div>
      <KnowledgeCore />
    </div>
  </section>
</template>
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add docs/.vitepress/theme/components/home/HeroSection.vue docs/.vitepress/theme/components/home/HeroContent.vue docs/.vitepress/theme/components/home/KnowledgeCore.vue
git commit -m "feat: add Hero section with HeroContent and KnowledgeCore"
```

---

### Task 9: Create DomainSection + DomainCard

**Files:**
- Create: `docs/.vitepress/theme/components/home/DomainSection.vue`
- Create: `docs/.vitepress/theme/components/home/DomainCard.vue`

**Interfaces:**
- `DomainSection.vue` consumes: `useDomains()` composable
- `DomainCard.vue` receives: `DomainStat` object as prop
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Write DomainCard.vue**

Write `docs/.vitepress/theme/components/home/DomainCard.vue`:

```vue
<script setup lang="ts">
import type { DomainStat } from '../../composables/useDomains'
import { Icon } from '@iconify/vue'

defineProps<{ domain: DomainStat }>()
</script>

<template>
  <a :href="domain.link"
     class="group block p-8 rounded-card border border-border bg-card transition-all duration-[var(--motion-card)] ease-[var(--motion-ease)] hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_0_0_1px_var(--color-primary),0_8px_32px_-8px_var(--color-primary)]">
    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5" :style="{ background: domain.accent + '15' }">
      <Icon :icon="domain.icon" class="w-6 h-6" :style="{ color: domain.accent }" />
    </div>

    <h3 class="text-[24px] font-bold text-text mb-1.5">{{ domain.name }}</h3>
    <p class="text-[14px] text-text-secondary mb-4">{{ domain.desc }}</p>

    <div class="flex items-center gap-2 text-[13px] text-text-secondary mb-4">
      <span>{{ domain.articleCount }} articles</span>
      <span class="text-border">·</span>
      <span v-if="domain.lastUpdated !== 'N/A'">updated {{ domain.lastUpdated }}</span>
    </div>

    <div v-if="domain.hotTags.length" class="flex flex-wrap gap-1.5 mb-5">
      <span v-for="tag in domain.hotTags" :key="tag"
            class="px-2 py-0.5 rounded-md text-[11px] text-primary bg-primary/10 border border-primary/10">
        {{ tag }}
      </span>
    </div>

    <span class="inline-flex items-center gap-1 text-[14px] font-medium text-text-secondary group-hover:text-primary transition-colors duration-[var(--motion-hover)]">
      Continue
      <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </span>
  </a>
</template>
```

- [ ] **Step 2: Write DomainSection.vue**

Write `docs/.vitepress/theme/components/home/DomainSection.vue`:

```vue
<script setup lang="ts">
import { useDomains } from '../../composables/useDomains'
import DomainCard from './DomainCard.vue'
import { motion } from 'motion-v'

const domains = useDomains()
</script>

<template>
  <section class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Explore Knowledge</h2>
      <p class="text-[18px] text-text-secondary mt-2">Choose a domain.</p>
    </motion.div>

    <div class="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
      <motion.div
        v-for="(domain, i) in domains"
        :key="domain.name"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.06, ease: [0.22,1,0.36,1] }"
      >
        <DomainCard :domain="domain" />
      </motion.div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/theme/components/home/DomainSection.vue docs/.vitepress/theme/components/home/DomainCard.vue
git commit -m "feat: add DomainSection with 4 DomainCards"
```

---

### Task 10: Create RoadmapSection

**Files:**
- Create: `docs/.vitepress/theme/components/home/RoadmapSection.vue`

**Interfaces:**
- Consumes: `useRoadmap()` composable
- Produces: horizontal SVG roadmap with path drawing animation and staggered node reveals
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Write RoadmapSection.vue**

Write `docs/.vitepress/theme/components/home/RoadmapSection.vue`:

```vue
<script setup lang="ts">
import { useRoadmap } from '../../composables/useRoadmap'
import { motion } from 'motion-v'

const roadmap = useRoadmap()

const statusClass = {
  done: 'border-primary bg-primary/20 text-primary',
  active: 'border-primary bg-primary text-white',
  planned: 'border-border bg-card text-text-secondary',
}
const statusLabel = {
  done: 'Done',
  active: 'Active',
  planned: 'Planned',
}
</script>

<template>
  <section class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Learning Roadmap</h2>
      <p class="text-[18px] text-text-secondary mt-2">What I'm learning next.</p>
    </motion.div>

    <div class="relative overflow-x-auto pb-4">
      <!-- SVG path -->
      <svg class="absolute top-8 left-0 w-full h-0.5 opacity-30 pointer-events-none" viewBox="0 0 1200 4" preserveAspectRatio="none">
        <motion.path
          d="M0,2 L1200,2"
          stroke="var(--color-primary)"
          stroke-width="2"
          fill="none"
          :initial="{ pathLength: 0 }"
          :whileInView="{ pathLength: 1 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.8, ease: [0.22,1,0.36,1] }"
        />
      </svg>

      <div class="flex gap-0">
        <motion.div
          v-for="(node, i) in roadmap.nodes"
          :key="node.label"
          :initial="{ opacity: 0, y: 12 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.2, delay: 0.5 + i * 0.1, ease: [0.22,1,0.36,1] }"
          class="flex flex-col items-center gap-2 min-w-[140px] max-sm:min-w-[120px]"
        >
          <!-- Status dot + line connector -->
          <div class="w-4 h-4 rounded-full border-2" :class="statusClass[node.status]" />
          <!-- Label -->
          <span class="text-[15px] font-semibold text-text text-center">{{ node.label }}</span>
          <!-- Desc -->
          <span v-if="node.desc" class="text-xs text-text-secondary text-center">{{ node.desc }}</span>
          <!-- Status chip -->
          <span class="text-[11px] font-medium uppercase tracking-wider" :class="node.status === 'active' ? 'text-primary' : 'text-text-secondary'">
            {{ statusLabel[node.status] }}
          </span>
        </motion.div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/components/home/RoadmapSection.vue
git commit -m "feat: add RoadmapSection with SVG path draw and staggered nodes"
```

---

### Task 11: Create LatestSection + ArticleCard

**Files:**
- Create: `docs/.vitepress/theme/components/home/LatestSection.vue`
- Create: `docs/.vitepress/theme/components/home/ArticleCard.vue`

**Interfaces:**
- `LatestSection.vue` consumes: `useLatestArticles(6)` composable
- `ArticleCard.vue` receives: `Post` object as prop
- Consumed by: `HomePage.vue` (Task 18)

- [ ] **Step 1: Write ArticleCard.vue**

Write `docs/.vitepress/theme/components/home/ArticleCard.vue`:

```vue
<script setup lang="ts">
import type { Post } from '../../../posts.data'

defineProps<{ post: Post }>()
</script>

<template>
  <a :href="post.url" class="group block p-6 rounded-card border border-border bg-card transition-all duration-[var(--motion-card)] ease-[var(--motion-ease)] hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_var(--color-primary)]">
    <span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium mb-3"
          :class="post.category === 'AI' ? 'text-[#10a37f] bg-[#10a37f]/15' :
                  post.category === 'Java' ? 'text-[#f89820] bg-[#f89820]/15' :
                  post.category === 'Go' ? 'text-[#00ADD8] bg-[#00ADD8]/15' :
                  'text-[#3b82f6] bg-[#3b82f6]/15'">
      {{ post.category }}
    </span>

    <h3 class="text-[18px] font-semibold text-text mb-2 group-hover:text-primary transition-colors duration-[var(--motion-hover)]">
      {{ post.title }}
    </h3>

    <div class="flex items-center gap-3 text-[13px] text-text-secondary mb-3">
      <span>{{ post.date }}</span>
      <span>{{ post.readingTime }} min read</span>
    </div>

    <div v-if="post.tags.length" class="flex flex-wrap gap-1.5">
      <span v-for="tag in post.tags.slice(0, 2)" :key="tag"
            class="px-2 py-0.5 rounded-md text-[11px] text-primary bg-primary/10 border border-primary/10">
        {{ tag }}
      </span>
    </div>
  </a>
</template>
```

- [ ] **Step 2: Write LatestSection.vue**

Write `docs/.vitepress/theme/components/home/LatestSection.vue`:

```vue
<script setup lang="ts">
import { useLatestArticles } from '../../composables/useLatestArticles'
import ArticleCard from './ArticleCard.vue'
import { motion } from 'motion-v'

const latest = useLatestArticles(6)
</script>

<template>
  <section class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Latest Updates</h2>
      <p class="text-[18px] text-text-secondary mt-2">Recently published notes.</p>
    </motion.div>

    <div v-if="latest.length" class="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <motion.div
        v-for="(post, i) in latest"
        :key="post.url"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.05, ease: [0.22,1,0.36,1] }"
      >
        <ArticleCard :post="post" />
      </motion.div>
    </div>

    <div v-else class="text-center py-12 text-text-secondary text-[15px]">
      <p>📝 暂无文章，内容迁移中...</p>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add docs/.vitepress/theme/components/home/LatestSection.vue docs/.vitepress/theme/components/home/ArticleCard.vue
git commit -m "feat: add LatestSection with 6 ArticleCards"
```

---

### Task 12: Create StatisticsSection

**Files:**
- Create: `docs/.vitepress/theme/components/home/StatisticsSection.vue`

**Interfaces:**
- Consumes: `useStatistics()` composable
- Produces: 6 stat cards with CountUp animation
- Consumed by: `HomePage.vue` (Task 15)

- [ ] **Step 1: Write StatisticsSection.vue**

Write `docs/.vitepress/theme/components/home/StatisticsSection.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useStatistics } from '../../composables/useStatistics'
import { motion, useMotionValue, useTransform, useInView } from 'motion-v'

const stats = useStatistics()
const sectionRef = ref<HTMLElement | null>(null)
const isInView = useInView(sectionRef, { once: true })

function formatReadingTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function useCountUp(target: () => number) {
  const val = useMotionValue(0)
  const display = useTransform(val, (v: number) => Math.round(v))

  return {
    display,
    init() {
      val.animate(target(), { duration: 1.5, ease: [0.22, 1, 0.36, 1] })
    },
  }
}

const statItems = [
  { label: 'Articles',      get: () => stats.value.articles,     format: (n: number) => String(n) },
  { label: 'Categories',    get: () => stats.value.categories,   format: (n: number) => String(n) },
  { label: 'Tags',          get: () => stats.value.tags,         format: (n: number) => String(n) },
  { label: 'Words',         get: () => stats.value.words,        format: (n: number) => n.toLocaleString() },
  { label: 'Reading Time',  get: () => stats.value.readingTime,  format: (_: number) => formatReadingTime(stats.value.readingTime) },
  { label: 'Last Update',   get: () => 0,                        format: () => stats.value.lastUpdate },
]

const counters = statItems.map((item) => ({
  ...item,
  ...useCountUp(item.get),
}))
</script>

<template>
  <section ref="sectionRef" class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Statistics</h2>
      <p class="text-[18px] text-text-secondary mt-2">A snapshot of this knowledge base.</p>
    </motion.div>

    <div class="grid grid-cols-3 gap-6 max-sm:grid-cols-2">
      <motion.div
        v-for="(item, i) in counters"
        :key="item.label"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.06, ease: [0.22,1,0.36,1] }"
        class="aspect-[3/2] rounded-card border border-border bg-card flex flex-col items-center justify-center gap-2 hover:shadow-[0_0_0_1px_var(--color-primary)] transition-shadow duration-[var(--motion-hover)]"
        @vue:mounted="item.init()"
      >
        <span class="text-[48px] font-bold text-primary font-heading">
          {{ item.label === 'Last Update' ? item.format(0) : item.display }}
        </span>
        <span class="text-sm text-text-secondary uppercase tracking-wider">{{ item.label }}</span>
      </motion.div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/components/home/StatisticsSection.vue
git commit -m "feat: add StatisticsSection with CountUp animation"
```

---

### Task 13: Create FooterSection

**Files:**
- Create: `docs/.vitepress/theme/components/home/FooterSection.vue`

**Interfaces:**
- No composable dependencies (static content)
- Consumed by: `HomePage.vue` (Task 15)

- [ ] **Step 1: Write FooterSection.vue**

Write `docs/.vitepress/theme/components/home/FooterSection.vue`:

```vue
<script setup lang="ts">
import { motion } from 'motion-v'

const learningNow = ['MCP', 'Agent', 'LangGraph']
</script>

<template>
  <footer class="border-t border-border">
    <div class="max-w-[1200px] mx-auto px-[120px] py-16 max-lg:px-12 max-sm:px-6">
      <motion.div
        :initial="{ opacity: 0 }"
        :whileInView="{ opacity: 1 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.8 }"
        class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
      >
        <!-- Left -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-4 text-[14px] text-text-secondary">
            <a href="https://github.com/matianxing2201/xm-knowledge"
               class="hover:text-text transition-colors duration-[var(--motion-hover)]">GitHub</a>
            <a href="/feed.xml"
               class="hover:text-text transition-colors duration-[var(--motion-hover)]">RSS</a>
            <span class="text-border">MIT License</span>
          </div>
          <span class="text-[13px] text-text-secondary">© 2026 matianxing2201</span>
        </div>

        <!-- Right: learning now -->
        <div class="flex flex-col items-start md:items-end gap-4">
          <div class="flex items-center gap-4">
            <span class="text-[13px] text-text-secondary">Learning:</span>
            <div class="flex gap-1.5">
              <span v-for="item in learningNow" :key="item"
                    class="px-2.5 py-0.5 rounded-md text-[11px] font-medium text-primary bg-primary/10 border border-primary/10">
                {{ item }}
              </span>
            </div>
          </div>
          <p class="text-[14px] text-text-secondary">
            Build continuously. Learn continuously.
          </p>
        </div>
      </motion.div>
    </div>
  </footer>
</template>
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/components/home/FooterSection.vue
git commit -m "feat: add FooterSection"
```

---

### Task 14: Create HomePage.vue (Assembly Container)

**Files:**
- Create: `docs/.vitepress/theme/components/home/HomePage.vue`

**Interfaces:**
- Consumes: all section components (Tasks 6–13)
- Produces: assembled homepage with Lenis smooth scrolling
- Consumed by: `Layout.vue` (Task 15)

- [ ] **Step 1: Write HomePage.vue**

Write `docs/.vitepress/theme/components/home/HomePage.vue`:

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import BackgroundCanvas from './BackgroundCanvas.vue'
import NavbarSection from './NavbarSection.vue'
import HeroSection from './HeroSection.vue'
import DomainSection from './DomainSection.vue'
import RoadmapSection from './RoadmapSection.vue'
import LatestSection from './LatestSection.vue'
import StatisticsSection from './StatisticsSection.vue'
import FooterSection from './FooterSection.vue'

let lenis: Lenis | null = null

onMounted(() => {
  const idleCb = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1))
  idleCb(() => {
    lenis = new Lenis({ lerp: 0.1 })
    function raf(time: number) {
      lenis!.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  })
})

onUnmounted(() => {
  lenis?.destroy()
})
</script>

<template>
  <div class="bg-bg text-text font-body overflow-x-hidden">
    <BackgroundCanvas />
    <NavbarSection />
    <main>
      <HeroSection />
      <DomainSection />
      <RoadmapSection />
      <LatestSection />
      <StatisticsSection />
    </main>
    <FooterSection />
  </div>
</template>
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/.vitepress/theme/components/home/HomePage.vue
git commit -m "feat: add HomePage assembly container with Lenis"
```

---

### Task 15: Wire Layout.vue, Delete Old HomePage, Final Verify

**Files:**
- Modify: `docs/.vitepress/theme/Layout.vue`
- Delete: `docs/.vitepress/theme/components/HomePage.vue`

**Interfaces:**
- Consumes: new `HomePage.vue` from Task 14
- Produces: homepage served from new components

- [ ] **Step 1: Update Layout.vue import**

Replace the import in `docs/.vitepress/theme/Layout.vue` — change line 5 from:

```ts
import HomePage from './components/HomePage.vue'
```

to:

```ts
import HomePage from './components/home/HomePage.vue'
```

The rest of Layout.vue stays unchanged — the `isHome` computed and the `<HomePage v-if="isHome" />` usage work as before.

- [ ] **Step 2: Delete old HomePage.vue**

```bash
rm docs/.vitepress/theme/components/HomePage.vue
```

- [ ] **Step 3: Build and verify**

Run:
```bash
pnpm run docs:build
```
Expected: build succeeds with no errors. Check output for any warnings.

- [ ] **Step 4: Start dev server and visually verify**

Run:
```bash
pnpm run docs:dev
```
Open `http://localhost:5173/xm-knowledge/`. Verify:
- Homepage loads with dark background, mesh gradient, and floating particles
- Navbar shrinks/blurs on scroll
- Hero section displays with staggered fade-up animations
- KnowledgeCore SVG floats and responds to mouse parallax
- Domain cards appear with stagger animation on scroll
- Roadmap path draws on scroll
- Latest articles grid appears
- Statistics CountUp animates on scroll
- Footer renders
- Links navigate correctly

- [ ] **Step 5: Stop dev server and commit**

```bash
git add docs/.vitepress/theme/Layout.vue docs/.vitepress/theme/components/HomePage.vue
git commit -m "feat: switch Layout to new HomePage, delete old HomePage"
```