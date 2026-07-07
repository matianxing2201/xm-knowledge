<script setup lang="ts">
import { motion } from 'motion-v'

const MotionDiv = motion.div

const learningNow = ['MCP', 'Agent', 'LangGraph']
</script>

<template>
  <footer class="border-t border-border">
    <div class="max-w-[1200px] mx-auto px-[120px] py-16 max-lg:px-12 max-sm:px-6">
      <MotionDiv
        :initial="{ opacity: 0 }"
        :whileInView="{ opacity: 1 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.8 }"
        class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
      >
        <!-- Left -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-4 text-[14px] text-text-secondary">
            <a href="https://github.com/matianxing2201/xm-knowledge"
               class="hover:text-text transition-colors duration-[var(--motion-hover)]">GitHub</a>
            <a href="/feed.xml"
               class="hover:text-text transition-colors duration-[var(--motion-hover)]">RSS</a>
            <span class="text-border">MIT License</span>
          </div>
          <span class="text-[13px] text-text-secondary">© 2026 matianxing2201</span>
        </div>

        <!-- Right: learning now -->
        <div class="flex flex-col items-start md:items-end gap-4">
          <div class="flex items-center gap-4">
            <span class="text-[13px] text-text-secondary">Learning:</span>
            <div class="flex gap-1.5">
              <span v-for="item in learningNow" :key="item"
                    class="px-2.5 py-0.5 rounded-md text-[11px] font-medium text-primary bg-primary/10 border border-primary/10">
                {{ item }}
              </span>
            </div>
          </div>
          <p class="text-[14px] text-text-secondary">
            Build continuously. Learn continuously.
          </p>
        </div>
      </MotionDiv>
    </div>
  </footer>
</template>
