<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArticles } from '../../composables/useArticles'
import { useTagFrequency } from '../../composables/useHeatmap'
import ArticleCard from './ArticleCard.vue'

const all = useArticles()
const tagFreq = useTagFrequency()
const activeTab = ref<'recent' | 'trending'>('recent')

const recentPosts = computed(() => {
  const seen = new Set<string>()
  return [...all.value]
    .sort((a, b) => {
      const aD = a.lastUpdated || a.date
      const bD = b.lastUpdated || b.date
      return new Date(bD).getTime() - new Date(aD).getTime()
    })
    .filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true })
    .slice(0, 6)
})

const maxTagCount = computed(() => tagFreq.value[0]?.count || 1)
function tagSize(c: number): number { return Math.round(12 + (c / maxTagCount.value) * 10) }
function tagOpacity(c: number): number { return 0.65 + (c / maxTagCount.value) * 0.35 }
</script>

<template>
  <section class="max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] py-[var(--section-space)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
    <div class="flex items-end justify-between mb-8">
      <div>
        <h2 class="text-[36px] font-heading font-bold text-text max-sm:text-[28px] tracking-[-0.01em]">Recent &amp; Trending</h2>
        <p class="text-[17px] font-body text-text-secondary mt-2">Hot tags and freshly updated notes.</p>
      </div>

      <div class="flex p-1 rounded-[var(--radius-button)] border border-border bg-surface">
        <button
          class="px-4 py-1.5 rounded-md text-[13px] font-code font-semibold transition-all duration-[180ms]"
          :class="activeTab === 'recent' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'"
          @click="activeTab = 'recent'"
        >Recent</button>
        <button
          class="px-4 py-1.5 rounded-md text-[13px] font-code font-semibold transition-all duration-[180ms]"
          :class="activeTab === 'trending' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'"
          @click="activeTab = 'trending'"
        >Trending</button>
      </div>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="activeTab === 'recent'" key="recent">
        <div v-if="recentPosts.length" class="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <ArticleCard v-for="post in recentPosts" :key="post.url" :post="post" />
        </div>
        <div v-else class="text-center py-12 text-text-secondary text-[15px] font-body">📝 暂无文章</div>
      </div>

      <div v-else key="trending" class="py-2">
        <div v-if="tagFreq.length" class="flex flex-wrap gap-2">
          <a v-for="item in tagFreq.slice(0, 24)" :key="item.tag"
             href="/xm-knowledge/tags.html"
             class="inline-block px-2.5 py-1 rounded font-code font-medium transition-all duration-[180ms] border border-transparent hover:border-primary/40 hover:bg-primary/8"
             :style="{ fontSize: tagSize(item.count) + 'px', color: 'var(--color-primary)', opacity: tagOpacity(item.count) }">
            {{ item.tag }}
            <span class="text-text-secondary text-[11px] ml-0.5">{{ item.count }}</span>
          </a>
        </div>
        <div v-else class="text-center py-12 text-text-secondary text-[15px] font-body">暂无标签数据</div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>