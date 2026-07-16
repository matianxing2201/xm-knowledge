<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'

const scrolled = ref(false)
const mobileOpen = ref(false)
const isMac = ref(false)

function openSearch() {
  window.dispatchEvent(new CustomEvent('xm:open-search'))
}

function onScroll() {
  scrolled.value = window.scrollY > 12
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => {
  isMac.value = navigator.platform.toLowerCase().includes('mac')
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('keydown', onGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('keydown', onGlobalKey)
})

const archiveHref = withBase('/archive.html')
const javaHref = withBase('/java/')
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 h-16 transition-colors duration-300"
    :class="scrolled
      ? 'border-b border-white/[0.08] nav-glass'
      : 'border-b border-transparent bg-transparent'"
  >
    <nav class="h-full max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)] flex items-center justify-between">
      <!-- Wordmark -->
      <a :href="withBase('/')" class="font-body font-extrabold text-[16px] tracking-[-0.02em] text-white/90">
        XM.
      </a>

      <!-- Right cluster -->
      <div class="flex items-center gap-6">
        <!-- Inline primary nav link -->
        <a
          :href="javaHref"
          class="hidden md:inline font-body font-medium text-[15px] text-white/60 hover:text-white/90 transition-colors duration-[var(--motion-hover)]"
        >
          进入笔记
        </a>

        <!-- Search affordance -->
        <button
          class="flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-full border border-white/10 text-white/50 hover:text-white/80 hover:border-white/30 transition-all duration-[var(--motion-hover)]"
          aria-label="Search"
          @click="openSearch"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="hidden lg:inline px-1 rounded border border-white/10 text-[10px] font-code text-white/50">
            {{ isMac ? '⌘K' : 'Ctrl K' }}
          </span>
        </button>

        <!-- Mobile menu toggle -->
        <button
          class="md:hidden flex items-center justify-center w-8 h-8 text-white/60 hover:text-white/90 transition-colors"
          aria-label="Menu"
          @click="mobileOpen = !mobileOpen"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile sheet -->
    <div
      v-if="mobileOpen"
      class="md:hidden border-t border-white/[0.08] nav-glass-strong"
    >
      <a
        :href="javaHref"
        class="block px-6 py-4 font-body font-medium text-[16px] text-white/80 hover:text-white transition-colors"
        @click="mobileOpen = false"
      >
        进入笔记
      </a>
      <a
        :href="archiveHref"
        class="block px-6 py-4 font-code text-[13px] text-white/50 hover:text-white/80 transition-colors border-t border-white/[0.06]"
        @click="mobileOpen = false"
      >
        归档
      </a>
    </div>
  </header>
</template>

<style scoped>
.nav-glass {
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px) saturate(1.8);
  -webkit-backdrop-filter: blur(16px) saturate(1.8);
}
.nav-glass-strong {
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
</style>