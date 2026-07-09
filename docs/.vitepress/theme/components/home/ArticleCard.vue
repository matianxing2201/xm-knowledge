<script setup lang="ts">
import type { Post } from '../../posts.data.ts'
import { withBase } from 'vitepress'

defineProps<{ post: Post }>()

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const catStyle: Record<string, { color: string; bg: string }> = {
  AI:   { color: 'var(--color-ai)',   bg: 'rgba(16,163,127,0.12)' },
  Java: { color: 'var(--color-java)', bg: 'rgba(237,139,0,0.12)' },
  Go:   { color: 'var(--color-go)',   bg: 'rgba(0,173,216,0.12)' },
  Web:  { color: 'var(--color-web)',  bg: 'rgba(59,130,246,0.12)' },
}
</script>

<template>
  <a :href="withBase(post.url)"
     class="group flex flex-col p-5 h-[200px] rounded-[var(--radius-card)] border border-border bg-card transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card">
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-tag)] text-[11px] font-code font-medium"
            :style="{ color: (catStyle[post.category] || {}).color, background: (catStyle[post.category] || {}).bg }">
        {{ post.category }}
      </span>
      <span class="text-[11px] font-code text-text-secondary">{{ post.readingTime }} min</span>
    </div>

    <h3 class="text-[16px] font-semibold text-text mb-2 group-hover:text-primary transition-colors duration-[180ms] leading-snug line-clamp-2">
      {{ post.title }}
    </h3>

    <p v-if="post.excerpt" class="text-[13px] text-text-secondary font-body leading-relaxed line-clamp-2 mb-3">
      {{ post.excerpt }}
    </p>

    <div class="flex items-center gap-3 text-[12px] text-text-secondary font-code mt-auto">
      <span>{{ formatDate(post.lastUpdated || post.date) }}</span>
      <span v-if="post.tags.length" class="truncate">· {{ post.tags.slice(0, 3).join(' · ') }}</span>
    </div>
  </a>
</template>