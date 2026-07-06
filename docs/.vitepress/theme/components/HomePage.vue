<script setup lang="ts">
import { data as posts } from '../posts.data.ts'

const categories = [
  { name: 'Java', icon: '☕', link: '/java/', color: '#f89820' },
  { name: 'Go', icon: '🐹', link: '/go/', color: '#00ADD8' },
  { name: 'AI', icon: '🤖', link: '/ai/', color: '#10a37f' },
  { name: '前端', icon: '🌐', link: '/web/', color: '#3b82f6' },
]

const recentPosts = posts
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 10)
</script>

<template>
  <div class="home-page">
    <section class="hero-section">
      <h1>学习笔记</h1>
      <p class="hero-desc">Java · Go · AI · 前端 — 个人知识库</p>
    </section>

    <section class="categories">
      <h2>分类</h2>
      <div class="category-grid">
        <a
          v-for="cat in categories"
          :key="cat.name"
          :href="cat.link"
          class="category-card"
        >
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </a>
      </div>
    </section>

    <section class="recent-posts">
      <h2>最近更新</h2>
      <ul class="post-list">
        <li v-for="post in recentPosts" :key="post.url">
          <a :href="post.url">
            <span class="post-title">{{ post.title }}</span>
            <span class="post-date">{{ post.date }}</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.hero-section {
  text-align: center;
  padding: 40px 0 32px;
}

.hero-section h1 {
  font-size: 48px;
  background: linear-gradient(120deg, var(--vp-c-brand-1) 30%, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 12px;
}

.hero-desc {
  font-size: 20px;
  color: var(--vp-c-text-2);
}

.categories {
  margin-bottom: 48px;
}

.categories h2,
.recent-posts h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: all 0.2s;
}

.category-card:hover {
  background: var(--vp-c-brand-soft);
  transform: translateY(-2px);
}

.category-icon {
  font-size: 32px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.post-list {
  list-style: none;
  padding: 0;
}

.post-list li {
  padding: 10px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.post-list li a {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
}

.post-list li a:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-title {
  font-size: 16px;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
}

.post-date {
  font-size: 14px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  margin-left: 16px;
}
</style>
