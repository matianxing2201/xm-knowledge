<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStatistics } from '../../composables/useStatistics'
import { motion, animate } from 'motion-v'

const MotionDiv = motion.div

const stats = useStatistics()
const triggered = ref(false)

function formatReadingTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const statData = ref([
  { label: 'Articles',      display: 0, raw: 0, isNumber: true },
  { label: 'Categories',    display: 0, raw: 0, isNumber: true },
  { label: 'Tags',          display: 0, raw: 0, isNumber: true },
  { label: 'Words',         display: 0, raw: 0, isNumber: true },
  { label: 'Reading Time',  display: 0, raw: 0, isNumber: false },
  { label: 'Last Update',   display: 0, raw: 0, isNumber: false },
])

function initStats() {
  const s = stats.value
  statData.value[0].raw = s.articles
  statData.value[1].raw = s.categories
  statData.value[2].raw = s.tags
  statData.value[3].raw = s.words
  statData.value[4].raw = s.readingTime
  statData.value[5].raw = 0 // lastUpdate shown as string

  // Animate number cards
  for (const item of statData.value) {
    if (item.isNumber && item.raw > 0) {
      const counter = { v: 0 }
      animate(counter, { v: item.raw }, {
        duration: 1.5,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: () => { item.display = Math.round(counter.v) },
      })
    }
  }
}

function displayValue(item: typeof statData.value[0]): string {
  if (item.label === 'Reading Time') return formatReadingTime(stats.value.readingTime)
  if (item.label === 'Last Update') return stats.value.lastUpdate || 'N/A'
  if (item.isNumber) return item.display.toLocaleString()
  return String(item.display)
}

const sectionRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !triggered.value) {
      triggered.value = true
      initStats()
      observer.disconnect()
    }
  }, { threshold: 0.3 })

  if (sectionRef.value) observer.observe(sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <MotionDiv
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Statistics</h2>
      <p class="text-[18px] text-text-secondary mt-2">A snapshot of this knowledge base.</p>
    </MotionDiv>

    <div class="grid grid-cols-3 gap-6 max-sm:grid-cols-2">
      <MotionDiv
        v-for="(item, i) in statData"
        :key="item.label"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.06, ease: [0.22,1,0.36,1] }"
        class="aspect-[3/2] rounded-card border border-border bg-card flex flex-col items-center justify-center gap-2 hover:shadow-[0_0_0_1px_var(--color-primary)] transition-shadow duration-[var(--motion-hover)]"
      >
        <span class="text-[48px] font-bold text-primary font-heading tabular-nums">
          {{ displayValue(item) }}
        </span>
        <span class="text-sm text-text-secondary uppercase tracking-wider">{{ item.label }}</span>
      </MotionDiv>
    </div>
  </section>
</template>
