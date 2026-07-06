<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../posts.data.ts'

const groupedPosts = computed(() => {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const groups = new Map<string, typeof sorted>()
  for (const post of sorted) {
    const d = new Date(post.date)
    const key = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(post)
  }

  return Array.from(groups.entries())
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
</script>

<template>
  <div class="archive-page">
    <h1>归档</h1>
    <p class="archive-total">共 {{ posts.length }} 篇文章</p>

    <div
      v-for="([month, monthPosts], index) in groupedPosts"
      :key="month"
      class="archive-month"
    >
      <h2>{{ month }}</h2>
      <ul class="archive-list">
        <li v-for="post in monthPosts" :key="post.url">
          <span class="archive-date">{{ formatDate(post.date) }}</span>
          <a :href="post.url">{{ post.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.archive-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.archive-page h1 {
  margin-bottom: 8px;
}

.archive-total {
  color: var(--vp-c-text-3);
  margin-bottom: 32px;
}

.archive-month {
  margin-bottom: 24px;
}

.archive-month h2 {
  font-size: 20px;
  color: var(--vp-c-brand-1);
  margin-bottom: 12px;
}

.archive-list {
  list-style: none;
  padding: 0;
}

.archive-list li {
  padding: 8px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.archive-list li a {
  text-decoration: none;
  color: var(--vp-c-text-1);
}

.archive-list li a:hover {
  color: var(--vp-c-brand-1);
}

.archive-date {
  font-size: 14px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  min-width: 70px;
}
</style>
