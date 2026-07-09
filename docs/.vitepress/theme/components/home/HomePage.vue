<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import NavbarSection from './NavbarSection.vue'
import HeroSection from './HeroSection.vue'
import StatisticsSection from './StatisticsSection.vue'
import DomainSection from './DomainSection.vue'
import TrendingRecentSection from './TrendingRecentSection.vue'
import KnowledgeSystemSection from './KnowledgeSystemSection.vue'
import FooterSection from './FooterSection.vue'
import SearchModal from './SearchModal.vue'

let lenis: Lenis | null = null

onMounted(() => {
  const idleCb = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1))
  idleCb(() => {
    lenis = new Lenis({ lerp: 0.1 })
    function raf(time: number) {
      lenis!.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  })
})

onUnmounted(() => { lenis?.destroy() })
</script>

<template>
  <div class="bg-bg text-text font-body overflow-x-hidden min-h-screen">
    <SearchModal />
    <NavbarSection />
    <main>
      <HeroSection />
      <StatisticsSection />
      <DomainSection />
      <TrendingRecentSection />
      <KnowledgeSystemSection />
    </main>
    <FooterSection />
  </div>
</template>