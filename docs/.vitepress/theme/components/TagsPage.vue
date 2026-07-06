<script setup lang="ts">
import { ref, computed } from 'vue'
import { data as posts } from '../posts.data.ts'

const selectedTag = ref<string | null>(null)

const allTags = computed(() => {
  const tagMap = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    }
  }
  return Array.from(tagMap.entries())
    .sort((a, b) => b[1] - a[1])
})

const filteredPosts = computed(() => {
  const list = selectedTag.value
    ? posts.filter((p) => p.tags.includes(selectedTag.value!))
    : posts
  return list.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
})

function toggleTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag
}
</script>

<template>
  <div class="tags-page">
    <h1>标签</h1>

    <div class="tag-cloud">
      <button
        v-for="[tag, count] in allTags"
        :key="tag"
        class="tag-item"
        :class="{ active: selectedTag === tag }"
        @click="toggleTag(tag)"
      >
        {{ tag }} ({{ count }})
      </button>
    </div>

    <div v-if="selectedTag" class="filter-info">
      筛选标签：{{ selectedTag }}
      <button class="clear-btn" @click="selectedTag = null">清除</button>
    </div>

    <ul class="post-list">
      <li v-for="post in filteredPosts" :key="post.url">
        <a :href="post.url">
          <span class="post-title">{{ post.title }}</span>
          <span class="post-date">{{ post.date }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tags-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.tags-page h1 {
  margin-bottom: 24px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.tag-item {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.tag-item:hover {
  border-color: var(--vp-c-brand-1);
}

.tag-item.active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.filter-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  cursor: pointer;
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
  text-decoration: none;
}

.post-list li a:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-title {
  color: var(--vp-c-text-1);
}

.post-date {
  font-size: 14px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  margin-left: 16px;
}
</style>
