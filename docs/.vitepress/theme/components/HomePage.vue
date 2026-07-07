<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { data as posts } from '../posts.data.ts'

const categories = [
  { name: 'Java', icon: '☕', link: '/java/', color: '#f89820', desc: 'Spring · JVM · 并发' },
  { name: 'Go', icon: '🐹', link: '/go/', color: '#00ADD8', desc: 'Goroutine · Channel · Web' },
  { name: 'AI', icon: '🤖', link: '/ai/', color: '#10a37f', desc: 'LangChain · Agent · LLM' },
  { name: '前端', icon: '🌐', link: '/web/', color: '#3b82f6', desc: 'Vue · React · TypeScript' },
]

const postCountByCategory = computed(() => {
  const map: Record<string, number> = {}
  for (const p of posts) {
    const seg = p.url.split('/')[1]
    if (seg) {
      if (!map[seg]) map[seg] = 0
      map[seg]++
    }
  }
  return map
})

const tagCount = computed(() => {
  const tags = new Set<string>()
  for (const p of posts) {
    for (const t of p.tags) tags.add(t)
  }
  return tags.size
})

const recentPosts = computed(() =>
  posts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
)

const tagline = 'Java · Go · AI · 前端 — 个人知识库'
const displayTagline = ref('')
const showCursor = ref(true)

onMounted(() => {
  let i = 0
  const timer = setInterval(() => {
    if (i <= tagline.length) {
      displayTagline.value = tagline.slice(0, i)
      i++
    } else {
      clearInterval(timer)
      setInterval(() => {
        showCursor.value = !showCursor.value
      }, 530)
    }
  }, 60)
})

function catCount(cat: typeof categories[0]) {
  if (cat.name === '前端') return (postCountByCategory.value['web'] || 0)
  return postCountByCategory.value[cat.name.toLowerCase()] || 0
}
</script>

<template>
  <div class="home-page">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-badge">XM的知识库</div>
      <h1 class="hero-title">学习笔记</h1>
      <p class="hero-desc">
        {{ displayTagline }}<span class="cursor" :class="{ blink: showCursor }">|</span>
      </p>
      <div class="hero-actions">
        <a href="/xm-knowledge/java/" class="btn btn-primary">开始阅读</a>
        <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank" class="btn btn-outline">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </section>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-num">{{ posts.length }}</span>
        <span class="stat-label">篇文章</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ categories.length }}</span>
        <span class="stat-label">个分类</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ tagCount }}</span>
        <span class="stat-label">个标签</span>
      </div>
    </div>

    <!-- Categories -->
    <section class="section">
      <div class="section-header">
        <h2>📂 分类</h2>
        <a href="/xm-knowledge/archive.html" class="view-all">查看全部 →</a>
      </div>
      <div class="category-grid">
        <a
          v-for="cat in categories"
          :key="cat.name"
          :href="cat.link"
          class="category-card"
          :style="{ '--accent': cat.color }"
        >
          <div class="category-icon">{{ cat.icon }}</div>
          <div class="category-info">
            <span class="category-name">{{ cat.name }}</span>
            <span class="category-desc">{{ cat.desc }}</span>
          </div>
          <span class="category-count">{{ catCount(cat) }}</span>
        </a>
      </div>
    </section>

    <!-- Recent Posts -->
    <section class="section">
      <div class="section-header">
        <h2>🕐 最近更新</h2>
        <a href="/xm-knowledge/archive.html" class="view-all">查看全部 →</a>
      </div>
      <div v-if="recentPosts.length" class="post-grid">
        <a v-for="post in recentPosts" :key="post.url" :href="post.url" class="post-card">
          <span class="post-date-badge">{{ post.date.slice(5, 10) }}</span>
          <span class="post-title">{{ post.title }}</span>
          <div v-if="post.tags.length" class="post-tags">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="post-tag">{{ tag }}</span>
          </div>
        </a>
      </div>
      <div v-else class="empty-state">
        <p>📝 暂无文章，内容迁移中...</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="home-footer">
      <p>基于 <a href="https://vitepress.dev" target="_blank">VitePress</a> 构建 · 使用 GitHub Pages 托管</p>
      <p>© 2026 matianxing2201 · 保持学习，保持好奇</p>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

/* Hero */
.hero-section {
  text-align: center;
  padding: 64px 0 48px;
}

.hero-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  margin-bottom: 20px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--vp-c-brand-1) 0%, #8b5cf6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 16px;
  letter-spacing: -1px;
}

.hero-desc {
  font-size: 20px;
  color: var(--vp-c-text-2);
  margin: 0 0 36px;
  min-height: 28px;
}

.cursor {
  color: var(--vp-c-brand-1);
  font-weight: 300;
  opacity: 0;
}
.cursor.blink {
  opacity: 1;
}

.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s ease;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}
.btn-primary:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-outline {
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}
.btn-outline:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

/* Stats */
.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 24px 0;
  margin-bottom: 48px;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 28px;
  font-weight: 800;
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--vp-c-divider);
}

/* Section */
.section {
  margin-bottom: 56px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--vp-c-text-1);
}

.view-all {
  font-size: 14px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color 0.2s;
}
.view-all:hover {
  color: var(--vp-c-brand-1);
}

/* Category Cards */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (max-width: 600px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}

.category-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

.category-card:hover {
  border-color: var(--accent, var(--vp-c-brand-1));
  background: var(--vp-c-bg-elv);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.category-icon {
  font-size: 36px;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--vp-c-bg);
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.category-desc {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.category-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-bg);
  padding: 4px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* Post Grid */
.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .post-grid {
    grid-template-columns: 1fr;
  }
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-elv);
  transform: translateY(-1px);
}

.post-date-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-bg);
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 4px;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.5;
}

.post-card:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.post-tag {
  font-size: 11px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 2px 8px;
  border-radius: 6px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

/* Footer */
.home-footer {
  text-align: center;
  padding: 32px 0 16px;
  border-top: 1px solid var(--vp-c-divider);
}

.home-footer p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.home-footer a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.home-footer a:hover {
  text-decoration: underline;
}
</style>
