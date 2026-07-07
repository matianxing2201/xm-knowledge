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
</script>

<template>
  <a :href="withBase(post.url)" class="group block p-6 rounded-card border border-border bg-card transition-all duration-[var(--motion-card)] ease-[var(--motion-ease)] hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_var(--color-primary)]">
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
      <span>{{ formatDate(post.date) }}</span>
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
