<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import BackgroundCanvas from './BackgroundCanvas.vue'
import NavbarSection from './NavbarSection.vue'
import HeroSection from './HeroSection.vue'
import DomainSection from './DomainSection.vue'
import RoadmapSection from './RoadmapSection.vue'
import LatestSection from './LatestSection.vue'
import StatisticsSection from './StatisticsSection.vue'
import FooterSection from './FooterSection.vue'

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

onUnmounted(() => {
  lenis?.destroy()
})
</script>

<template>
  <div class="bg-bg text-text font-body overflow-x-hidden">
    <BackgroundCanvas />
    <NavbarSection />
    <main>
      <HeroSection />
      <DomainSection />
      <RoadmapSection />
      <LatestSection />
      <StatisticsSection />
    </main>
    <FooterSection />
  </div>
</template>
