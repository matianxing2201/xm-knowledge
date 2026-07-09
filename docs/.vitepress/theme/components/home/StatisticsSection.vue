<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStatistics } from '../../composables/useStatistics'
import { useHeatmap, useStreak } from '../../composables/useHeatmap'
import { animate } from 'motion-v'
import { withBase } from 'vitepress'

const stats = useStatistics()
const heatmapCells = useHeatmap()
const streak = useStreak()
const triggered = ref(false)

function fmtReadingTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const disp = ref(['0', '0', '', ''])
const statItems = [
  { label: 'Notes', idx: 0, isNum: true },
  { label: 'Words', idx: 1, isNum: true },
  { label: 'Reading', idx: 2, isNum: false },
  { label: 'Last Update', idx: 3, isNum: false },
]

function initStats() {
  const s = stats.value
  ;[0, 1].forEach(i => {
    const raw = i === 0 ? s.articles : s.words
    animate(0, raw, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { disp.value[i] = fmtNum(Math.round(v)) },
    })
  })
  disp.value[2] = fmtReadingTime(s.readingTime)
  disp.value[3] = fmtDate(s.lastUpdate)
}

const sectionRef = ref<HTMLElement | null>(null)
let obs: IntersectionObserver | null = null

onMounted(() => {
  obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !triggered.value) {
      triggered.value = true
      initStats()
      obs?.disconnect()
    }
  }, { threshold: 0.3 })
  if (sectionRef.value) obs.observe(sectionRef.value)
})

onUnmounted(() => obs?.disconnect())

const cells = computed(() => heatmapCells.value)
const weeks = computed(() => {
  const w: typeof cells.value[] = []
  for (let i = 0; i < cells.value.length; i += 7) w.push(cells.value.slice(i, i + 7))
  return w
})

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthLabel(weekIdx: number): string {
  const c = cells.value[weekIdx * 7]
  if (!c) return ''
  const d = new Date(c.date)
  const m = d.getMonth()
  return weekIdx === 0 || d.getDate() <= 7 ? monthNames[m] : ''
}

const popoverCell = ref<typeof cells.value[0] | null>(null)
const popoverStyle = ref({ left: '0px', top: '0px' })

function openPopover(cell: typeof cells.value[0], e: MouseEvent) {
  const tgt = e.currentTarget as HTMLElement
  const rect = tgt.getBoundingClientRect()
  const vw = window.innerWidth
  let left = rect.left + rect.width / 2
  // keep popover inside viewport horizontally
  const popoverWidth = 240
  if (left + popoverWidth / 2 > vw - 16) {
    left = vw - 16 - popoverWidth / 2
  } else if (left - popoverWidth / 2 < 16) {
    left = 16 + popoverWidth / 2
  }
  popoverStyle.value = {
    left: left + 'px',
    top: (rect.top - 12) + 'px',
  }
  popoverCell.value = cell
}

const lvlColors = [
  'transparent',
  'rgba(9,105,218,0.25)',
  'rgba(9,105,218,0.45)',
  'rgba(9,105,218,0.65)',
  'rgba(9,105,218,0.88)',
]

const darkLvlColors = [
  'transparent',
  'rgba(88,166,255,0.25)',
  'rgba(88,166,255,0.45)',
  'rgba(88,166,255,0.65)',
  'rgba(88,166,255,0.88)',
]
</script>

<template>
  <section ref="sectionRef" class="max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] py-[var(--section-space)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
    <h2 class="text-[36px] font-heading font-bold text-text max-sm:text-[28px] tracking-[-0.01em] mb-8">Statistics</h2>

    <!-- Number strip -->
    <div class="grid grid-cols-4 gap-6 mb-10 max-sm:grid-cols-2">
      <div v-for="item in statItems" :key="item.label" class="flex flex-col gap-1">
        <span class="text-[36px] font-bold text-text font-heading tabular-nums tracking-tight">{{ item.isNum ? disp[item.idx] : disp[item.idx] }}</span>
        <span class="text-[11px] text-text-secondary uppercase tracking-[0.08em] font-code">{{ item.label }}</span>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="relative">
      <div class="flex justify-between items-center mb-3">
        <span class="text-[12px] text-text-secondary font-code">Contribution Heatmap</span>
        <span class="text-[11px] text-text-secondary font-code">Last 12 months</span>
      </div>

      <div class="overflow-x-auto pb-2">
        <div class="heatmap-grid inline-flex gap-2 min-w-max">
          <!-- Day labels -->
          <div class="flex flex-col gap-[2px] pt-[18px]">
            <div v-for="(label, di) in dayLabels" :key="label"
                 class="day-label"
                 :class="{ 'opacity-0': di % 2 !== 0 }">
              {{ label }}
            </div>
          </div>

          <!-- Weeks -->
          <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[2px]">
            <div class="h-[14px] text-[9px] text-text-secondary font-code leading-[14px]">{{ monthLabel(wi) }}</div>
            <div
              v-for="(cell, di) in week"
              :key="di"
              class="heatmap-cell"
              :class="{ 'has-value': cell.level > 0 }"
              :style="{ backgroundColor: cell.level > 0 ? 'var(--color-primary)' : 'transparent', opacity: cell.level > 0 ? (0.25 + (cell.level - 1) * 0.21) : 1 }"
              :title="`${cell.date} · ${cell.count} notes`"
              @click="openPopover(cell, $event)"
            />
          </div>
        </div>
      </div>

      <!-- Streak -->
      <div v-if="streak.value >= 2" class="mt-4 flex items-center gap-2">
        <span class="text-[13px] text-text-secondary font-code">Continuous Updates</span>
        <span class="text-[13px] font-code font-semibold">🔥 {{ streak.value }} Days</span>
      </div>

      <!-- Popover -->
      <Teleport to="body">
        <div
          v-if="popoverCell"
          class="fixed z-50 w-[240px] bg-card border border-border rounded-[var(--radius-popover)] shadow-popover"
          :style="{ left: popoverStyle.left, top: popoverStyle.top, transform: 'translate(-50%, -100%)' }"
          @click.stop
        >
          <div class="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span class="text-[14px] font-code font-bold text-text">{{ popoverCell.date }}</span>
            <button class="p-1 rounded text-text-secondary hover:text-text hover:bg-surface transition-colors" @click="popoverCell = null">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="px-3 py-2">
            <div v-if="popoverCell.posts.length">
              <span class="text-[10px] text-text-secondary font-code uppercase tracking-wider mb-1 block">新增</span>
              <a v-for="post in popoverCell.posts" :key="post.url"
                 :href="withBase(post.url)"
                 class="flex items-center justify-between py-1 text-[13px] text-text hover:text-primary transition-colors group">
                <span class="truncate mr-2">{{ post.title }}</span>
                <svg class="w-3 h-3 shrink-0 text-text-secondary group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>
            <div v-else class="py-2 text-[13px] text-text-secondary">无更新</div>
          </div>
        </div>
      </Teleport>
    </div>
  </section>
</template>

<style scoped>
.heatmap-grid {
  --cell-size: 10px;
  --cell-gap: 2px;
}

.day-label {
  width: 28px;
  height: var(--cell-size);
  font-size: 9px;
  line-height: var(--cell-size);
  text-align: right;
  padding-right: 6px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: var(--color-text-secondary);
}

.heatmap-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  border-radius: 2px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.heatmap-cell.has-value {
  border-color: transparent;
}

.heatmap-cell:hover {
  border-color: var(--color-primary);
}
</style>