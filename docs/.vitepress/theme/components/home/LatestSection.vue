<script setup lang="ts">
import { useLatestArticles } from '../../composables/useLatestArticles'
import ArticleCard from './ArticleCard.vue'
import { motion } from 'motion-v'

const latest = useLatestArticles(6)
</script>

<template>
  <section class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Latest Updates</h2>
      <p class="text-[18px] text-text-secondary mt-2">Recently published notes.</p>
    </motion.div>

    <div v-if="latest.length" class="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <motion.div
        v-for="(post, i) in latest"
        :key="post.url"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.05, ease: [0.22,1,0.36,1] }"
      >
        <ArticleCard :post="post" />
      </motion.div>
    </div>

    <div v-else class="text-center py-12 text-text-secondary text-[15px]">
      <p>📝 暂无文章，内容迁移中...</p>
    </div>
  </section>
</template>
