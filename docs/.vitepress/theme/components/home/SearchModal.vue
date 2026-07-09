<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useArticles } from '../../composables/useArticles'
import { withBase } from 'vitepress'
import { motion } from 'motion-v'

const MotionDiv = motion.div

const show = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)
const articles = useArticles()

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return articles.value
    .filter((p) => {
      const text = `${p.title} ${p.tags.join(' ')} ${p.category}`.toLowerCase()
      return text.includes(q)
    })
    .slice(0, 8)
})

watch(results, () => { selectedIndex.value = 0 })

function open() {
  show.value = true
  query.value = ''
  nextTick(() => inputRef.value?.focus())
}

function close() {
  show.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!show.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (results.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const post = results.value[selectedIndex.value]
    if (post) window.location.href = withBase(post.url)
  }
}

function onDocKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open()
  }
}

function highlight(text: string, q: string): string {
  if (!q) return text
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

onMounted(() => {
  window.addEventListener('keydown', onDocKey)
  window.addEventListener('xm:open-search', open)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onDocKey)
  window.removeEventListener('xm:open-search', open)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" @click="close">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <MotionDiv
          class="relative w-full max-w-[640px] mx-4 rounded-[var(--radius-card)] border border-border bg-card shadow-modal overflow-hidden"
          :initial="{ opacity: 0, y: -16, scale: 0.98 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          @click.stop
        >
          <!-- Input -->
          <div class="flex items-center gap-3 px-4 h-14 border-b border-border">
            <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Search notes, tags, domains..."
              class="flex-1 bg-transparent text-[16px] text-text placeholder:text-text-secondary outline-none font-body"
              @keydown="onKeydown"
            >
            <button class="px-2 py-1 rounded text-[11px] font-code text-text-secondary border border-border hover:text-text hover:border-primary/40 transition-colors" @click="close">
              ESC
            </button>
          </div>

          <!-- Results -->
          <div class="max-h-[420px] overflow-y-auto py-2" @mousemove="selectedIndex = -1">
            <template v-if="results.length">
              <a
                v-for="(post, i) in results"
                :key="post.url"
                :href="withBase(post.url)"
                class="flex flex-col gap-0.5 px-4 py-3 mx-2 rounded-lg transition-colors duration-[var(--motion-hover)]"
                :class="i === selectedIndex ? 'bg-primary/10' : 'hover:bg-surface'"
                @mouseenter="selectedIndex = i"
              >
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-code px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{ post.category }}</span>
                  <span class="text-[13px] font-semibold text-text font-body" v-html="highlight(post.title, query)" />
                </div>
                <div class="flex items-center gap-3 text-[12px] text-text-secondary font-code mt-1">
                  <span>{{ post.date }}</span>
                  <span>{{ post.readingTime }} min read</span>
                  <span v-if="post.tags.length" class="truncate">{{ post.tags.slice(0, 4).join(' · ') }}</span>
                </div>
              </a>
            </template>

            <div v-else-if="query.trim()" class="px-4 py-10 text-center text-[14px] text-text-secondary font-body">
              没有找到匹配 “<span class="text-text font-medium">{{ query.trim() }}</span>” 的笔记
            </div>

            <div v-else class="px-4 py-8 text-center text-[13px] text-text-secondary font-code">
              输入关键词开始搜索 · ↑↓ 选择 · Enter 打开
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 h-9 border-t border-border bg-surface/50 text-[11px] text-text-secondary font-code">
            <span>{{ articles.length }} notes indexed</span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 rounded border border-border">↑↓</kbd>
              <span>navigate</span>
              <kbd class="px-1 rounded border border-border ml-2">↵</kbd>
              <span>select</span>
            </span>
          </div>
        </MotionDiv>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.2s ease;
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
.search-fade-enter-active :deep(.relative),
.search-fade-leave-active :deep(.relative) {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
}
.search-fade-enter-from :deep(.relative),
.search-fade-leave-to :deep(.relative) {
  transform: translateY(-8px);
  opacity: 0;
}

:deep(.search-highlight) {
  color: var(--color-primary);
  background: transparent;
  font-weight: 600;
}

:deep(mark) {
  background: transparent;
}
</style>
