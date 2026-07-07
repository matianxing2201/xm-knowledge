<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <div class="flex flex-col">
    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.6, delay: 0.1, ease: [0.22,1,0.36,1] }"
    >
      <span class="inline-block px-4 py-1.5 rounded-full text-[13px] font-medium text-primary bg-primary/10 border border-primary/20 mb-6">
        XM 的知识库
      </span>
    </motion.div>

    <motion.h1
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.7, delay: 0.2, ease: [0.22,1,0.36,1] }"
      class="text-[72px] max-lg:text-[56px] max-md:text-[44px] font-extrabold font-heading bg-gradient-to-r from-primary via-[#9333ea] to-secondary bg-clip-text text-transparent mb-5 leading-[1.05] tracking-tight"
    >
      XM Knowledge
    </motion.h1>

    <motion.p
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.6, delay: 0.3, ease: [0.22,1,0.36,1] }"
      class="text-[28px] max-md:text-[22px] text-text-secondary mb-4 font-heading leading-snug"
    >
      A developer's living knowledge base.
    </motion.p>

    <motion.p
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.6, delay: 0.4, ease: [0.22,1,0.36,1] }"
      class="text-[18px] text-text-secondary max-w-lg mb-10 leading-relaxed"
    >
      持续整理 AI、Java、Go、Web 等领域的学习笔记与实践经验。
    </motion.p>

    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.6, delay: 0.5, ease: [0.22,1,0.36,1] }"
      class="flex gap-4"
    >
      <a href="/java/" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white text-[16px] font-semibold hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] transition-all duration-[var(--motion-hover)]">
        Start Reading
        <svg viewBox="0 0 20 20" class="w-4 h-4" fill="currentColor"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>
      </a>
      <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank"
         class="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-border/60 text-text text-[16px] font-semibold bg-white/[0.03] hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-[var(--motion-hover)]">
        <svg viewBox="0 0 16 16" class="w-5 h-5" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
    </motion.div>
  </div>
</template>
