<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScroll, useTransform, useReducedMotion, motion } from 'motion-v'
import { withBase } from 'vitepress'
import { useStatistics } from '../../composables/useStatistics'

const sectionRef = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()
const stats = useStatistics()

const MotionP = motion.p
const MotionH1 = motion.h1
const MotionDiv = motion.div

const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ['start start', 'end start'],
})

// Eyebrow fades first — leads the retreat
const eyebrowY = useTransform(scrollYProgress, [0, 0.35], [0, -40])
const eyebrowOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

// Sub + CTA group fades slightly later
const supportY = useTransform(scrollYProgress, [0, 0.55], [0, -80])
const supportOpacity = useTransform(scrollYProgress, [0.05, 0.5], [1, 0])

// H1 stays, drifts up faintly only near the end to signal chapter change
const h1Y = useTransform(scrollYProgress, [0, 1], [0, 24])
const h1Opacity = useTransform(scrollYProgress, [0.4, 1], [1, 0.5])

// Corner indices fade with sub
const cornerY = useTransform(scrollYProgress, [0, 0.5], [0, -30])
const cornerOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

const heroHref = withBase('/java/')

const lastUpdate = computed(() => {
  const raw = stats.value?.lastUpdate || ''
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
</script>

<template>
  <section ref="sectionRef" class="hero-section relative bg-black">
    <!-- Margin vertical hairlines -->
    <div class="hero-hair hero-hair--left" aria-hidden="true" />
    <div class="hero-hair hero-hair--right" aria-hidden="true" />

    <!-- Sticky pin container -->
    <div class="sticky top-0 h-screen flex flex-col items-center justify-center px-[var(--gutter-mobile)] max-sm:px-6 max-lg:px-[var(--gutter-tablet)]">
      <!-- Eyebrow -->
      <MotionP
        v-if="!reduced"
        class="hero-eyebrow"
        :style="{ y: eyebrowY, opacity: eyebrowOpacity }"
      >
        KNOWLEDGE · 2026
      </MotionP>
      <p v-else class="hero-eyebrow">KNOWLEDGE · 2026</p>

      <!-- H1 — the focus, stays -->
      <MotionH1
        v-if="!reduced"
        class="hero-h1"
        :style="{ y: h1Y, opacity: h1Opacity }"
      >
        学习,是复利的动作。
      </MotionH1>
      <h1 v-else class="hero-h1">学习,是复利的动作。</h1>

      <!-- Subhead + CTA group -->
      <MotionDiv
        v-if="!reduced"
        class="hero-support"
        :style="{ y: supportY, opacity: supportOpacity }"
      >
        <p class="hero-subhead">一个把学到的东西耐心写下来的地方。</p>
        <a :href="heroHref" class="hero-cta">
          进入笔记
          <span class="hero-cta-arrow" aria-hidden="true">→</span>
        </a>
      </MotionDiv>
      <div v-else class="hero-support">
        <p class="hero-subhead">一个把学到的东西耐心写下来的地方。</p>
        <a :href="heroHref" class="hero-cta">
          进入笔记
          <span class="hero-cta-arrow" aria-hidden="true">→</span>
        </a>
      </div>

      <!-- Corner indices -->
      <MotionDiv
        v-if="!reduced"
        class="hero-corner hero-corner--bl"
        :style="{ y: cornerY, opacity: cornerOpacity }"
      >
        § 01 / HERO
      </MotionDiv>
      <div v-else class="hero-corner hero-corner--bl">§ 01 / HERO</div>

      <MotionDiv
        v-if="!reduced"
        class="hero-corner hero-corner--br"
        :style="{ y: cornerY, opacity: cornerOpacity }"
      >
        {{ lastUpdate }}
      </MotionDiv>
      <div v-else class="hero-corner hero-corner--br">{{ lastUpdate }}</div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  height: 200vh;
  position: relative;
  background: #000;
}

.hero-hair {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.06);
  pointer-events: none;
  z-index: 1;
}
.hero-hair--left { left: var(--gutter-desktop); }
.hero-hair--right { right: var(--gutter-desktop); }
@media (max-width: 1024px) {
  .hero-hair--left { left: var(--gutter-tablet); }
  .hero-hair--right { right: var(--gutter-tablet); }
}
@media (max-width: 640px) {
  .hero-hair--left { left: var(--gutter-mobile); }
  .hero-hair--right { right: var(--gutter-mobile); }
}

.hero-eyebrow {
  font-family: var(--font-code);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-text-secondary);
  margin-bottom: 40px;
  text-align: center;
}

.hero-h1 {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: clamp(56px, 11vw, 144px);
  line-height: 1.02;
  letter-spacing: -0.03em;
  color: #F5F5F7;
  text-align: center;
  max-width: 14ch;
  margin: 0;
}

.hero-support {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.hero-subhead {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: clamp(18px, 1.6vw, 22px);
  letter-spacing: 0.02em;
  color: #A1A1AA;
  text-align: center;
  max-width: 28ch;
  margin: 0;
  line-height: 1.5;
}

.hero-cta {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 18px;
  color: #F5F5F7;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  transition: border-color 220ms var(--motion-ease), color 220ms var(--motion-ease);
}
.hero-cta:hover {
  border-bottom-color: #F5F5F7;
}
.hero-cta:hover .hero-cta-arrow {
  transform: translateX(4px);
}
.hero-cta-arrow {
  display: inline-block;
  transition: transform 220ms var(--motion-ease);
}

.hero-corner {
  position: absolute;
  bottom: 32px;
  font-family: var(--font-code);
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.06em;
}
.hero-corner--bl { left: var(--gutter-desktop); }
.hero-corner--br { right: var(--gutter-desktop); }
@media (max-width: 1024px) {
  .hero-corner--bl { left: var(--gutter-tablet); }
  .hero-corner--br { right: var(--gutter-tablet); }
}
@media (max-width: 640px) {
  .hero-corner--bl { left: var(--gutter-mobile); }
  .hero-corner--br { right: var(--gutter-mobile); }
  .hero-corner { bottom: 24px; font-size: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-section { height: auto; min-height: 100vh; }
  .hero-section > .sticky { position: relative; height: auto; min-height: 100vh; padding: 120px 0; }
}
</style>