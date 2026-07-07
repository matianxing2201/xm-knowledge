<script setup lang="ts">
import { ref } from 'vue'
import { useScroll, useMotionValue, useTransform, useSpring } from 'motion-v'

const mobileOpen = ref(false)

const { scrollY } = useScroll()
const navHeight = useTransform(scrollY, [0, 100], [72, 60])
const isScrolled = useTransform(scrollY, [0, 100], [0, 1])
const heightPx = useSpring(navHeight, { stiffness: 200, damping: 25 })

const navItems = [
  { label: 'Home',   href: '/' },
  { label: 'AI',     href: '/ai/' },
  { label: 'Java',   href: '/java/' },
  { label: 'Go',     href: '/go/' },
  { label: 'Web',    href: '/web/' },
  { label: 'Archive', href: '/archive.html' },
  { label: 'Tags',    href: '/tags.html' },
]
</script>

<template>
  <motion.nav
    class="fixed top-0 inset-x-0 z-50 flex items-center px-8 transition-colors duration-[var(--motion-hover)]"
    :style="{ height: heightPx + 'px' }"
    :class="isScrolled.get() > 0.5
      ? 'bg-[rgba(9,9,11,0.7)] backdrop-blur-[16px] border-b border-border'
      : 'bg-transparent'"
  >
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">XM</div>
      <span class="text-sm font-semibold text-text hidden sm:block">XM Knowledge</span>
    </a>

    <!-- Desktop nav -->
    <div class="hidden md:flex items-center gap-1 ml-8">
      <a v-for="item in navItems" :key="item.href" :href="item.href"
         class="px-3 py-1.5 text-[14px] text-text-secondary hover:text-text rounded-md transition-colors duration-[var(--motion-hover)]">
        {{ item.label }}
      </a>
    </div>

    <!-- Right side -->
    <div class="ml-auto flex items-center gap-3">
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="text-text-secondary hover:text-text transition-colors duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-5 h-5" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
      <!-- Mobile hamburger -->
      <button class="md:hidden p-2 text-text-secondary" @click="mobileOpen = !mobileOpen">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </motion.nav>

  <!-- Mobile menu -->
  <div v-if="mobileOpen" class="fixed inset-x-0 top-[60px] z-40 md:hidden bg-surface border-b border-border">
    <div class="flex flex-col p-4 gap-1">
      <a v-for="item in navItems" :key="item.href" :href="item.href"
         class="px-4 py-2.5 text-text-secondary hover:text-text rounded-lg transition-colors duration-[var(--motion-hover)]"
         @click="mobileOpen = false">
        {{ item.label }}
      </a>
    </div>
  </div>
</template>
