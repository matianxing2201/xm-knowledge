<script setup lang="ts">
import type { DomainStat } from '../../composables/useDomains'
import { Icon } from '@iconify/vue'
import { withBase } from 'vitepress'

const props = defineProps<{ domain: DomainStat; large?: boolean }>()

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>

<template>
  <a :href="withBase(domain.link)"
     class="group relative flex flex-col p-5 rounded-[var(--radius-card)] border border-border bg-card transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-card h-full">
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-start gap-3 min-w-0">
        <div class="rounded-xl flex items-center justify-center shrink-0 transition-transform duration-[180ms] group-hover:-translate-y-0.5"
             :class="large ? 'w-11 h-11' : 'w-10 h-10'"
             :style="{ background: domain.accent + '15' }">
          <Icon :icon="domain.icon" :class="large ? 'w-6 h-6' : 'w-5 h-5'" :style="{ color: domain.accent }" />
        </div>
        <div class="min-w-0">
          <h3 class="font-bold text-text font-heading" :class="large ? 'text-[22px]' : 'text-[18px]'">
            {{ domain.name }}
          </h3>
          <p class="text-text-secondary font-body" :class="large ? 'text-[14px]' : 'text-[13px]'">
            {{ domain.desc }}
          </p>
        </div>
      </div>
      <span class="shrink-0 text-[11px] font-code px-2 py-0.5 rounded-full border border-border text-text-secondary bg-surface">
        {{ domain.articleCount }}
      </span>
    </div>

    <div class="flex items-center gap-3 text-[12px] text-text-secondary font-code mb-3">
      <span>{{ domain.tagCount }} tags</span>
      <span class="text-border">·</span>
      <span v-if="domain.lastUpdated !== 'N/A'">updated {{ formatDate(domain.lastUpdated) }}</span>
    </div>

    <div v-if="domain.recentPosts.length" class="flex flex-col gap-1 mb-4">
      <span class="text-[10px] uppercase tracking-[0.08em] text-text-secondary font-code">Recent</span>
      <div class="flex flex-col gap-0.5">
        <span v-for="post in domain.recentPosts.slice(0, 2)" :key="post.url"
              class="text-[12px] text-text-secondary font-body truncate group-hover:text-text transition-colors">
          {{ post.title }}
        </span>
      </div>
    </div>

    <div v-if="domain.hotTags.length" class="flex flex-wrap gap-1.5 mt-auto">
      <span v-for="tag in domain.hotTags" :key="tag"
            class="px-2 py-0.5 rounded-[var(--radius-tag)] text-[11px] font-code font-medium"
            :style="{ color: domain.accent, background: domain.accent + '12' }">
        {{ tag }}
      </span>
    </div>
  </a>
</template>