<script setup lang="ts">
import { ref, computed } from 'vue'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion-v'
import { withBase } from 'vitepress'
import { useDomains } from '../../composables/useDomains'
import type { DomainStat } from '../../composables/useDomains'

type DomainName = DomainStat['name']

const DOMAIN_COPY: Record<DomainName, { h2: string; narrative: string }> = {
  Java: { h2: 'Java,后端的起点。', narrative: 'Spring · JVM · 并发,记录真实工程里踩过的坑。' },
  Web:  { h2: 'Web,前端的日常。', narrative: 'Vue · React · TypeScript,从核心语法到框架内部。' },
  Go:   { h2: 'Go,并发友好的语言。', narrative: 'Goroutine · Channel · GC,把并发写得不难懂。' },
  AI:   { h2: 'AI,正在长大的一块田。', narrative: 'LangChain · Spring AI · 智谱,LLM 真的落地到代码。' },
}

const ORDER: DomainName[] = ['Java', 'Web', 'Go', 'AI']

const sectionRef = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()
const domains = useDomains()

const ordered = computed<DomainStat[]>(() => {
  return ORDER.map((name) => domains.value.find((d) => d.name === name)!).filter(Boolean) as DomainStat[]
})

const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ['start start', 'end end'],
})

const progress = ref(0)
useMotionValueEvent(scrollYProgress, 'change', (latest: number) => {
  progress.value = latest
})

function fade(p: number, idx: number): number {
  if (idx === 0) {
    if (p < 0.225) return 1
    if (p > 0.275) return 0
    return 1 - (p - 0.225) / 0.05
  }
  if (idx === 3) {
    if (p < 0.725) return 0
    if (p > 0.775) return 1
    return (p - 0.725) / 0.05
  }
  const start = idx * 0.25
  const peakIn = start + 0.025
  const peakOut = start + 0.225
  const end = start + 0.275
  if (p < start) return 0
  if (p < peakIn) return (p - start) / 0.025
  if (p < peakOut) return 1
  if (p < end) return 1 - (p - peakOut) / 0.05
  return 0
}

function opacityFor(idx: number): number {
  if (reduced.value) return 1
  return fade(progress.value, idx)
}

function fmtDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const linkFor = (d: DomainStat) => withBase(d.link)
</script>

<template>
  <section
    ref="sectionRef"
    class="domain-section"
    :class="{ 'domain-section--reduced': reduced }"
  >
    <!-- Background radial glows — one layer per domain, opacity = fade weight -->
    <div class="domain-glows" aria-hidden="true">
      <div
        v-for="(d, i) in ordered"
        :key="`glow-${d.name}`"
        class="domain-glow"
        :style="{
          background: `radial-gradient(50% 38% at 50% 0%, ${d.accent}38, transparent 70%)`,
          opacity: opacityFor(i),
        }"
      />
    </div>

    <!-- Sticky stage container -->
    <div class="domain-sticky">
      <div class="domain-grid">
        <!-- LEFT: pinned specimen panel — 4 layers crossfade -->
        <div class="domain-stage">
          <div
            v-for="(d, i) in ordered"
            :key="`stage-${d.name}`"
            class="domain-panel"
            :style="{ opacity: opacityFor(i) }"
          >
            <div class="domain-panel-meta">
              DOMAIN · 0{{ i + 1 }} / 04
            </div>
            <div class="domain-panel-dot" :style="{ backgroundColor: d.accent }" aria-hidden="true" />
            <div class="domain-panel-wordmark">{{ d.name }}</div>
            <div class="domain-panel-divider" />
            <div class="domain-panel-cols">
              <div class="domain-panel-col">
                <span class="domain-panel-label">{{ String(d.articleCount).padStart(2, '0') }} NOTES</span>
                <span class="domain-panel-value">{{ d.articleCount }} 篇笔记</span>
              </div>
              <div class="domain-panel-col">
                <span class="domain-panel-label">LATEST — {{ fmtDate(d.lastUpdated) }}</span>
                <span class="domain-panel-value domain-panel-value--alt">
                  {{ d.recentPosts[0]?.title ?? '尚未发布' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: caption — 4 layers crossfade -->
        <div class="domain-caption">
          <div
            v-for="(d, i) in ordered"
            :key="`cap-${d.name}`"
            class="domain-caption-layer"
            :class="{ 'domain-caption-layer--active': opacityFor(i) > 0.5 }"
            :style="{ opacity: opacityFor(i) }"
          >
            <p class="domain-eyebrow">§ 03 / DOMAIN ARCHIVE  ·  0{{ i + 1 }} OF 04</p>
            <h2 class="domain-h2">{{ DOMAIN_COPY[d.name].h2 }}</h2>
            <p class="domain-narrative">{{ DOMAIN_COPY[d.name].narrative }}</p>
            <a :href="linkFor(d)" class="domain-cta">
              进入 {{ d.name }}
              <span class="domain-cta-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.domain-section {
  position: relative;
  background: #0A0A0B;
  height: 400vh;  /* 4 viewports of scroll */
}

.domain-section--reduced {
  height: auto;
}

.domain-glows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  pointer-events: none;
}
.domain-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  transition: opacity 60ms linear;
}

.domain-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  padding: 0 var(--gutter-desktop);
  max-width: var(--content-max);
  margin: 0 auto;
}

.domain-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 64px;
  align-items: center;
}

/* LEFT — pinned specimen panel */
.domain-stage {
  position: relative;
  height: 480px;
}
.domain-panel {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 64px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: var(--radius-lg);
  background-color: #161B22;
  transition: opacity 60ms linear;
}
.domain-panel-meta {
  position: absolute;
  top: 24px;
  left: 24px;
  font-family: var(--font-code);
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.18em;
}
.domain-panel-dot {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.domain-panel-wordmark {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: clamp(64px, 8vw, 112px);
  letter-spacing: -0.03em;
  color: #F5F5F7;
  text-align: center;
  margin: auto 0;
}
.domain-panel-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.08);
  margin: 32px 0;
}
.domain-panel-cols {
  display: flex;
  gap: 32px;
  justify-content: space-between;
}
.domain-panel-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.domain-panel-col + .domain-panel-col {
  flex: 1.4;
}
.domain-panel-label {
  font-family: var(--font-code);
  font-size: 11px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.domain-panel-value {
  font-family: var(--font-code);
  font-size: 14px;
  color: #F5F5F7;
  font-weight: 500;
}
.domain-panel-value--alt {
  font-family: var(--font-body);
  font-size: 15px;
  color: #C9C9CC;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* RIGHT — caption */
.domain-caption {
  position: relative;
  min-height: 320px;
}
.domain-caption-layer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
  transition: opacity 60ms linear;
  pointer-events: none;
}
.domain-caption-layer--active {
  pointer-events: auto;
}
.domain-eyebrow {
  font-family: var(--font-code);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #6B7280;
  margin: 0;
}
.domain-h2 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: clamp(36px, 4.4vw, 56px);
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #F5F5F7;
  margin: 0;
  max-width: 14ch;
}
.domain-narrative {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 18px;
  line-height: 1.55;
  color: #A1A1AA;
  max-width: 28ch;
  margin: 0;
}
.domain-cta {
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
  align-self: flex-start;
  transition: border-color 220ms var(--motion-ease);
}
.domain-cta:hover { border-bottom-color: #F5F5F7; }
.domain-cta:hover .domain-cta-arrow { transform: translateX(4px); }
.domain-cta-arrow { transition: transform 220ms var(--motion-ease); }

/* Mobile */
@media (max-width: 1024px) {
  .domain-sticky {
    padding: 0 var(--gutter-tablet);
  }
  .domain-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .domain-stage { height: 320px; }
  .domain-panel { padding: 40px; }
  .domain-caption { min-height: 220px; }
}

@media (max-width: 640px) {
  .domain-section { height: auto; }
  .domain-sticky {
    position: relative;
    top: auto;
    height: auto;
    padding: 80px var(--gutter-mobile);
  }
  .domain-glows { display: none; }
  .domain-stage { height: 260px; }
  .domain-panel { padding: 32px; }
  .domain-panel-wordmark { font-size: 56px; }
  .domain-panel-divider { margin: 20px 0; }
  .domain-h2 { font-size: 32px; }
  .domain-narrative { font-size: 15px; }
  .domain-cta { font-size: 15px; }
}

@media (prefers-reduced-motion: reduce) {
  .domain-section { height: auto; }
  .domain-sticky {
    position: relative;
    top: auto;
    height: auto;
    padding: 120px var(--gutter-desktop);
  }
  .domain-glows { display: none; }
  .domain-panel,
  .domain-caption-layer {
    position: relative;
    inset: auto;
    opacity: 1 !important;
  }
  .domain-stage { height: auto; }
  .domain-panel + .domain-panel { margin-top: 32px; }
  .domain-caption { min-height: auto; }
  .domain-caption-layer + .domain-caption-layer { margin-top: 40px; }
}
</style>