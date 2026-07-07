<script setup lang="ts">
import { ref } from 'vue'
import { useStatistics } from '../../composables/useStatistics'
import { motion, useMotionValue, useTransform, useInView, animate } from 'motion-v'

const stats = useStatistics()
const sectionRef = ref<HTMLElement | null>(null)
const isInView = useInView(sectionRef, { once: true })

function formatReadingTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function useCountUp(target: () => number) {
  const val = useMotionValue(0)
  const display = useTransform(val, (v: number) => Math.round(v))

  return {
    display,
    init() {
      animate(val, target(), { duration: 1.5, ease: [0.22, 1, 0.36, 1] })
    },
  }
}

const statItems = [
  { label: 'Articles',      get: () => stats.value.articles,     format: (n: number) => String(n) },
  { label: 'Categories',    get: () => stats.value.categories,   format: (n: number) => String(n) },
  { label: 'Tags',          get: () => stats.value.tags,         format: (n: number) => String(n) },
  { label: 'Words',         get: () => stats.value.words,        format: (n: number) => n.toLocaleString() },
  { label: 'Reading Time',  get: () => stats.value.readingTime,  format: (_: number) => formatReadingTime(stats.value.readingTime) },
  { label: 'Last Update',   get: () => 0,                        format: () => stats.value.lastUpdate },
]

const counters = statItems.map((item) => ({
  ...item,
  ...useCountUp(item.get),
}))
</script>

<template>
  <section ref="sectionRef" class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <motion.div
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Statistics</h2>
      <p class="text-[18px] text-text-secondary mt-2">A snapshot of this knowledge base.</p>
    </motion.div>

    <div class="grid grid-cols-3 gap-6 max-sm:grid-cols-2">
      <motion.div
        v-for="(item, i) in counters"
        :key="item.label"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.06, ease: [0.22,1,0.36,1] }"
        class="aspect-[3/2] rounded-card border border-border bg-card flex flex-col items-center justify-center gap-2 hover:shadow-[0_0_0_1px_var(--color-primary)] transition-shadow duration-[var(--motion-hover)]"
        @vue:mounted="item.init()"
      >
        <span class="text-[48px] font-bold text-primary font-heading">
          {{ item.label === 'Last Update' ? item.format(0) : item.display }}
        </span>
        <span class="text-sm text-text-secondary uppercase tracking-wider">{{ item.label }}</span>
      </motion.div>
    </div>
  </section>
</template>
