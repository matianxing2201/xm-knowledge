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
