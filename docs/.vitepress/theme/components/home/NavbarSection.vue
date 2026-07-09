<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'

const mobileOpen = ref(false)

const navItems = [
  { label: '首页', href: withBase('/') },
  { label: '前端', href: withBase('/web/') },
  { label: 'Java', href: withBase('/java/') },
  { label: 'AI', href: withBase('/ai/SpringAI/') },
  { label: 'Go', href: withBase('/go/') },
  { label: '标签', href: withBase('/tags.html') },
  { label: '归档', href: withBase('/archive.html') },
]

const isMac = ref(false)

function openSearch() {
  window.dispatchEvent(new CustomEvent('xm:open-search'))
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => {
  isMac.value = navigator.platform.toLowerCase().includes('mac')
  document.addEventListener('keydown', onGlobalKey)
})
onUnmounted(() => document.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 h-[60px] border-b border-border transition-colors duration-200"
          :class="$route ? '' : ''">
    <nav class="h-full max-w-[var(--page-max)] mx-auto px-[var(--gutter-desktop)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)] flex items-center justify-between">
      <!-- Logo -->
      <a href="/xm-knowledge/" class="w-[120px] font-code text-[16px] font-bold text-text tracking-tight">
        XM.
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-1">
        <a v-for="item in navItems" :key="item.href" :href="item.href"
           class="px-3 py-1.5 text-[14px] font-code font-medium text-text-secondary hover:text-text transition-colors duration-[var(--motion-hover)]">
          {{ item.label }}
        </a>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          class="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-[var(--radius-button)] border border-border bg-surface text-[12px] font-code text-text-secondary hover:text-text hover:border-primary/40 hover:bg-card transition-all duration-[var(--motion-hover)]"
          @click="openSearch"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span class="hidden lg:inline">Search</span>
          <span class="hidden lg:inline ml-1.5 px-1 rounded border border-border text-[10px] text-text-secondary">{{ isMac ? '⌘K' : 'Ctrl K' }}</span>
        </button>

        <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank" rel="noopener"
           class="hidden sm:flex items-center justify-center w-8 h-8 rounded-[var(--radius-button)] border border-border bg-surface text-text-secondary hover:text-text hover:border-primary/40 hover:bg-card transition-all duration-[var(--motion-hover)]">
          <svg viewBox="0 0 16 16" class="w-[16px] h-[16px]" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>

        <button class="md:hidden flex items-center justify-center w-8 h-8 rounded-[var(--radius-button)] border border-border bg-surface text-text-secondary hover:text-text transition-colors" @click="mobileOpen = !mobileOpen">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </nav>
  </header>

  <!-- Mobile menu -->
  <div v-if="mobileOpen" class="fixed inset-x-0 top-[60px] z-40 md:hidden bg-surface border-b border-border">
    <div class="flex flex-col p-2">
      <a v-for="item in navItems" :key="item.href" :href="item.href"
         class="px-4 py-3 text-[15px] font-code font-medium text-text-secondary hover:text-text hover:bg-primary/5 rounded-lg transition-colors"
         @click="mobileOpen = false">
        {{ item.label }}
      </a>
    </div>
  </div>
</template>