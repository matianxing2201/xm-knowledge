<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { useStatistics } from '../../composables/useStatistics'

const stats = useStatistics()

const articles = computed(() => stats.value?.articles ?? 0)
const wordsK = computed(() => Math.round((stats.value?.words ?? 0) / 1000))

const lastUpdate = computed(() => {
  const raw = stats.value?.lastUpdate || ''
  if (!raw) return '—'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const feedHref = withBase('/feed.xml')
const githubHref = 'https://github.com/matianxing2201/xm-knowledge'
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <span class="footer-copy">© 2026 学习笔记</span>
      <a :href="feedHref" class="footer-link">RSS</a>
      <a :href="githubHref" target="_blank" rel="noopener" class="footer-link">GitHub</a>
      <span class="footer-stats">
        {{ articles }} 篇 · {{ wordsK }}K 字 · 更新于 {{ lastUpdate }}
      </span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #000;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 48px var(--gutter-desktop);
}
.footer-inner {
  max-width: var(--content-max);
  margin: 0 auto;
  font-family: var(--font-code);
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.footer-copy { color: #9CA3AF; }
.footer-link {
  color: #6B7280;
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
  transition: color 220ms var(--motion-ease), border-color 220ms var(--motion-ease);
}
.footer-link:hover {
  color: #F5F5F7;
  border-bottom-color: rgba(255, 255, 255, 0.5);
}
.footer-stats { color: #6B7280; }

@media (max-width: 1024px) {
  .footer { padding: 32px var(--gutter-tablet); }
}
@media (max-width: 640px) {
  .footer { padding: 28px var(--gutter-mobile); }
  .footer-inner {
    font-size: 11px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>