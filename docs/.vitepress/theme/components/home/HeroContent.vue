<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <div class="flex flex-col">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.1, ease: [0.22,1,0.36,1] }"
    >
      <span class="inline-block px-3.5 py-1.5 rounded-full text-[13px] font-medium text-primary bg-primary/10 border border-primary/20 mb-5">
        XM 的知识库
      </span>
    </motion.div>

    <motion.h1
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.2, ease: [0.22,1,0.36,1] }"
      class="text-7xl font-extrabold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 leading-none"
    >
      XM Knowledge
    </motion.h1>

    <motion.p
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.3, ease: [0.22,1,0.36,1] }"
      class="text-[28px] text-text-secondary mb-3 font-heading"
    >
      A developer's living knowledge base.
    </motion.p>

    <motion.p
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.4, ease: [0.22,1,0.36,1] }"
      class="text-[18px] text-text-secondary max-w-md mb-8"
    >
      持续整理 AI、Java、Go、Web 等领域的学习笔记与实践经验。
    </motion.p>

    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.8, delay: 0.5, ease: [0.22,1,0.36,1] }"
      class="flex gap-3"
    >
      <a href="/java/" class="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-primary text-white text-[15px] font-semibold hover:scale-[1.02] transition-transform duration-[var(--motion-hover)] shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
        Start Reading
      </a>
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="inline-flex items-center gap-2 px-7 py-3 rounded-lg border border-border text-text text-[15px] font-semibold bg-surface hover:border-primary hover:text-primary hover:bg-primary/10 transition-all duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-4 h-4" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
    </motion.div>
  </div>
</template>
