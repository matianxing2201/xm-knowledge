<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { useLatestArticles } from '../../composables/useLatestArticles'

type AccentColor = '#10A37F' | '#ED8B00' | '#00ADD8' | '#3B82F6'
const CATEGORY_ACCENT: Record<string, AccentColor> = {
  AI:   '#10A37F',
  Java: '#ED8B00',
  Go:   '#00ADD8',
  Web:  '#3B82F6',
}

const posts = useLatestArticles(3)
const top3 = computed(() => posts.value.slice(0, 3))

function fmtDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const archiveHref = withBase('/archive.html')
</script>

<template>
  <section class="latest-section">
    <div class="latest-inner">
      <p class="latest-eyebrow">§ 04 / LATEST</p>
      <h2 class="latest-h2">最近写下的几篇。</h2>

      <ol class="latest-list">
        <li v-for="(post, i) in top3" :key="post.url">
          <a
            :href="withBase(post.url)"
            class="latest-row"
          >
            <span class="latest-serial">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="latest-dot" :style="{ backgroundColor: CATEGORY_ACCENT[post.category] ?? '#6B7280' }" aria-hidden="true" />
            <span class="latest-title">{{ post.title }}</span>
            <span class="latest-date">{{ fmtDate(post.date) }}</span>
          </a>
        </li>
      </ol>

      <a :href="archiveHref" class="latest-more">
        查看全部
        <span class="latest-more-arrow" aria-hidden="true">→</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.latest-section {
  background: #0A0A0B;
  padding: 160px var(--gutter-desktop);
}
.latest-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.latest-eyebrow {
  font-family: var(--font-code);
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #6B7280;
  margin: 0 0 32px;
}
.latest-h2 {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: clamp(36px, 4.4vw, 64px);
  letter-spacing: -0.02em;
  line-height: 1.06;
  color: #F5F5F7;
  margin: 0 0 64px;
  max-width: 16ch;
}

.latest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.latest-list li + li {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.latest-row {
  display: grid;
  grid-template-columns: 56px auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 32px 8px 32px 0;
  text-decoration: none;
  color: inherit;
  transition: transform 260ms var(--motion-ease);
}
.latest-row:hover {
  transform: translateX(8px);
}
.latest-row:hover .latest-title {
  color: var(--color-primary);
}

.latest-serial {
  font-family: var(--font-code);
  font-size: 16px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}

.latest-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.latest-title {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: clamp(18px, 1.8vw, 22px);
  line-height: 1.35;
  color: #F5F5F7;
  letter-spacing: -0.005em;
  transition: color 220ms var(--motion-ease);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latest-date {
  font-family: var(--font-code);
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.latest-more {
  margin-top: 64px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  transition: color 220ms var(--motion-ease), border-color 220ms var(--motion-ease);
}
.latest-more:hover { color: #F5F5F7; border-bottom-color: #F5F5F7; }
.latest-more:hover .latest-more-arrow { transform: translateX(4px); }
.latest-more-arrow { transition: transform 220ms var(--motion-ease); }

@media (max-width: 1024px) {
  .latest-section { padding: 120px var(--gutter-tablet); }
  .latest-row { grid-template-columns: 56px auto 1fr auto; gap: 16px; }
  .latest-title { white-space: normal; }
}

@media (max-width: 640px) {
  .latest-section { padding: 96px var(--gutter-mobile); }
  .latest-h2 { margin-bottom: 40px; }
  .latest-list li + li { }
  .latest-row {
    grid-template-columns: 32px auto 1fr;
    grid-template-rows: auto auto;
    padding: 24px 0;
    gap: 12px 12px;
  }
  .latest-serial { grid-column: 1; grid-row: 1; }
  .latest-dot    { grid-column: 2; grid-row: 1; align-self: center; }
  .latest-title  { grid-column: 1 / -1; grid-row: 2; white-space: normal; }
  .latest-date   { grid-column: 3; grid-row: 1; }
}
</style>