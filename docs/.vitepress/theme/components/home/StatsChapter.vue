<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { animate, useInView, useReducedMotion } from 'motion-v'
import { useStatistics } from '../../composables/useStatistics'

const sectionRef = ref<HTMLElement | null>(null)
const numberRef = ref<HTMLElement | null>(null)

const stats = useStatistics()
const reduced = useReducedMotion()

const articles = computed(() => stats.value?.articles ?? 0)
const words = computed(() => stats.value?.words ?? 0)
const wordsK = computed(() => Math.round(words.value / 1000))

const lastUpdate = computed(() => {
  const raw = stats.value?.lastUpdate || ''
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const display = ref(0)
const inView = useInView(sectionRef, { margin: '-20% 0px -20% 0px' })

let anim: ReturnType<typeof animate> | null = null

function runAnimation() {
  if (reduced.value) {
    display.value = articles.value
    return
  }
  anim?.cancel()
  anim = animate(0, articles.value, {
    duration: 1.6,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => { display.value = Math.round(v) },
  })
}

watch([inView, articles], ([v]) => {
  if (v && articles.value > 0) runAnimation()
}, { immediate: false })

onMounted(() => {
  if (inView.value && articles.value > 0) runAnimation()
})
</script>

<template>
  <section ref="sectionRef" class="stats-section">
    <!-- 1px top hairline marks chapter break -->
    <div class="stats-hairline-top" aria-hidden="true" />

    <!-- Vertical rhythm lines -->
    <div class="stats-rail stats-rail--25" aria-hidden="true" />
    <div class="stats-rail stats-rail--75" aria-hidden="true" />

    <div class="stats-inner">
      <!-- Giant number — upper 55% -->
      <div ref="numberRef" class="stats-number">
        {{ display }}
      </div>

      <!-- Narrative + meta — lower 30% -->
      <div class="stats-foot">
        <p class="stats-eyebrow">§ 02 / 不断写到现在的笔记数</p>
        <p class="stats-narrative">自 2024 起,把学到的东西记下来,慢慢攒成 1000 篇。</p>
        <div class="stats-meta">
          <span>WORDS {{ wordsK }}K</span>
          <span class="stats-meta-sep">·</span>
          <span>DOMAINS 04</span>
          <span class="stats-meta-sep">·</span>
          <span>UPDATED {{ lastUpdate }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stats-section {
  position: relative;
  background: #050505;
  min-height: 100vh;
  padding: 140px var(--gutter-desktop);
  display: flex;
  align-items: center;
}
.stats-hairline-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.06);
}
.stats-rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.04);
  pointer-events: none;
}
.stats-rail--25 { left: 25%; }
.stats-rail--75 { left: 75%; }

.stats-inner {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stats-number {
  font-family: var(--font-code);
  font-weight: 600;
  font-size: clamp(120px, 22vw, 280px);
  line-height: 1;
  letter-spacing: -0.04em;
  color: #F5F5F7;
  width: 100%;
  text-align: left;
  margin-bottom: 80px;
  font-variant-numeric: tabular-nums;
}

.stats-foot {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 36ch;
}

.stats-eyebrow {
  font-family: var(--font-code);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #6B7280;
  margin: 0;
}

.stats-narrative {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: clamp(20px, 2vw, 26px);
  line-height: 1.45;
  color: #C9C9CC;
  max-width: 22ch;
  margin: 0;
}

.stats-meta {
  margin-top: 24px;
  font-family: var(--font-code);
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.06em;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.stats-meta-sep {
  color: rgba(255, 255, 255, 0.18);
}

@media (max-width: 1024px) {
  .stats-section { padding: 100px var(--gutter-tablet); }
  .stats-rail--25 { left: 16%; }
  .stats-rail--75 { left: 84%; }
  .stats-number { margin-bottom: 56px; }
}
@media (max-width: 640px) {
  .stats-section { padding: 80px var(--gutter-mobile); min-height: auto; }
  .stats-rail { display: none; }
  .stats-number { font-size: 96px; margin-bottom: 40px; }
  .stats-narrative { font-size: 18px; }
  .stats-meta { font-size: 11px; gap: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .stats-number { opacity: 1; }
}
</style>