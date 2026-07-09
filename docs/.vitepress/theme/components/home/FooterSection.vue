<script setup lang="ts">
</script>

<template>
  <footer class="border-t border-border">
    <div class="max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] py-12 max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <span class="text-[14px] font-body text-text-secondary">
          XM Knowledge · Built with VitePress + Vue 3
        </span>

        <div class="flex items-center gap-4 text-[14px] font-code text-text-secondary">
          <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank" class="hover:text-text transition-colors duration-[180ms]">GitHub</a>
          <a href="/xm-knowledge/feed.xml" class="hover:text-text transition-colors duration-[180ms]">RSS</a>
          <span>MIT License</span>
        </div>

        <span class="text-[13px] font-code text-text-secondary">
          © 2026 Tianxing
        </span>
      </div>

      <div class="mt-8 text-center">
        <p class="text-[12px] font-code text-text-secondary">
          Build continuously. Learn continuously.
        </p>
      </div>
    </div>
  </footer>
</template>