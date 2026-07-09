<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useArticles } from '../../composables/useArticles'
import { motion, animate } from 'motion-v'

const MotionDiv = motion.div
const MotionH1 = motion.h1

const articles = useArticles()
const notesCount = ref(0)
const lastUpdateStr = ref('')

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function openSearch() {
  window.dispatchEvent(new CustomEvent('xm:open-search'))
}

onMounted(() => {
  const posts = articles.value
  const count = posts.length
  animate(0, count, {
    duration: 1.2,
    ease: [0.22, 1, 0.36, 1],
    delay: 0.8,
    onUpdate: (v) => { notesCount.value = Math.round(v) },
  })
  let latest = ''
  for (const p of posts) {
    if (!latest || p.lastUpdated > latest) latest = p.lastUpdated
  }
  lastUpdateStr.value = latest ? formatDate(latest) : ''
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Badge -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }"
    >
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-code font-medium text-primary border border-primary/20 bg-primary/8 mb-5">
        <span class="w-1.5 h-1.5 rounded-full bg-primary" />
        Living Knowledge Base · 持续更新中
      </span>
    </MotionDiv>

    <!-- Identity -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }"
      class="text-[18px] text-text-secondary mb-4 font-code italic"
    >
      Hi, I'm Tianxing —
    </MotionDiv>

    <!-- Heading -->
    <MotionH1
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }"
      class="text-[64px] max-lg:text-[48px] max-sm:text-[36px] font-extrabold font-heading text-text mb-5 leading-[1.1] tracking-[-0.02em]"
    >
      <span class="block">Building AI ×</span>
      <span class="block">Go × Java × Web</span>
    </MotionH1>

    <!-- Subtitle -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }"
      class="text-[24px] max-md:text-[20px] font-body text-text-secondary mb-5"
    >
      A developer's living knowledge base.
    </MotionDiv>

    <!-- Value description -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }"
      class="mb-5 max-w-[520px]"
    >
      <p class="text-[16px] font-body text-text-secondary leading-relaxed">
        面向 AI 工程师与全栈开发者的实践型知识库。<br>
        <span class="text-primary font-code font-medium">Learning in Public.</span>
      </p>
    </MotionDiv>

    <!-- Stats line -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }"
      class="text-[13px] text-text-secondary font-code mb-8"
    >
      <span class="text-text font-semibold">{{ notesCount }}+</span> Notes
      <span class="text-border mx-1.5">·</span>
      <span v-if="lastUpdateStr">{{ lastUpdateStr }} 最近更新</span>
    </MotionDiv>

    <!-- Buttons -->
    <MotionDiv
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, delay: 0.65, ease: [0.22, 1, 0.36, 1] }"
      class="flex gap-3"
    >
      <a href="/xm-knowledge/java/" class="inline-flex items-center justify-center gap-2 w-[136px] h-12 rounded-[var(--radius-button)] bg-primary text-white text-[15px] font-code font-semibold hover:brightness-110 transition-all duration-[var(--motion-hover)]">
        开始阅读
        <svg viewBox="0 0 20 20" class="w-4 h-4" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>
      </a>
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[var(--radius-button)] border border-border text-text text-[15px] font-code font-semibold hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-[18px] h-[18px]" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
      <button class="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-button)] border border-border text-text-secondary hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-[var(--motion-hover)]"
              aria-label="Search" @click="openSearch">
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </button>
    </MotionDiv>
  </div>
</template>