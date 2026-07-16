<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'
import NavbarSection from './NavbarSection.vue'
import HeroChapter from './HeroChapter.vue'
import StatsChapter from './StatsChapter.vue'
import DomainStageChapter from './DomainStageChapter.vue'
import LatestChapter from './LatestChapter.vue'
import FooterSection from './FooterSection.vue'
import SearchModal from './SearchModal.vue'

let lenis: Lenis | null = null

onMounted(() => {
  const idleCb = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
    || ((cb: () => void) => setTimeout(cb, 1))
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
  <div class="home-root">
    <SearchModal />
    <NavbarSection />
    <main>
      <HeroChapter />
      <StatsChapter />
      <DomainStageChapter />
      <LatestChapter />
    </main>
    <FooterSection />
  </div>
</template>

<style scoped>
.home-root {
  background: #000;
  color: var(--color-text);
  font-family: var(--font-body);
  min-height: 100vh;
  overflow-x: clip;
}
</style>