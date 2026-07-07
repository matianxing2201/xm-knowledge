<script setup lang="ts">
import { useRoadmap } from '../../composables/useRoadmap'
import { motion } from 'motion-v'

const MotionDiv = motion.div
const MotionPath = motion.path

const roadmap = useRoadmap()

const statusClass = {
  done: 'border-primary bg-primary/20 text-primary',
  active: 'border-primary bg-primary text-white',
  planned: 'border-border bg-card text-text-secondary',
}
const statusLabel = {
  done: 'Done',
  active: 'Active',
  planned: 'Planned',
}
</script>

<template>
  <section class="max-w-[1200px] mx-auto px-[120px] py-[120px] max-lg:px-12 max-lg:py-[80px] max-sm:px-6 max-sm:py-[80px]">
    <MotionDiv
      :initial="{ opacity: 0, y: 24 }"
      :whileInView="{ opacity: 1, y: 0 }"
      :viewport="{ once: true }"
      :transition="{ duration: 0.5, ease: [0.22,1,0.36,1] }"
      class="mb-12"
    >
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Learning Roadmap</h2>
      <p class="text-[18px] text-text-secondary mt-2">What I'm learning next.</p>
    </MotionDiv>

    <div class="relative overflow-x-auto pb-4">
      <!-- SVG path -->
      <svg class="absolute top-8 left-0 w-full h-0.5 opacity-30 pointer-events-none" viewBox="0 0 1200 4" preserveAspectRatio="none">
        <MotionPath
          d="M0,2 L1200,2"
          stroke="var(--color-primary)"
          stroke-width="2"
          fill="none"
          :initial="{ pathLength: 0 }"
          :whileInView="{ pathLength: 1 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.8, ease: [0.22,1,0.36,1] }"
        />
      </svg>

      <div class="flex gap-0">
        <MotionDiv
          v-for="(node, i) in roadmap.nodes"
          :key="node.label"
          :initial="{ opacity: 0, y: 12 }"
          :whileInView="{ opacity: 1, y: 0 }"
          :viewport="{ once: true }"
          :transition="{ duration: 0.2, delay: 0.5 + i * 0.1, ease: [0.22,1,0.36,1] }"
          class="flex flex-col items-center gap-2 min-w-[140px] max-sm:min-w-[120px]"
        >
          <!-- Status dot + line connector -->
          <div class="w-4 h-4 rounded-full border-2" :class="statusClass[node.status]" />
          <!-- Label -->
          <span class="text-[15px] font-semibold text-text text-center">{{ node.label }}</span>
          <!-- Desc -->
          <span v-if="node.desc" class="text-xs text-text-secondary text-center">{{ node.desc }}</span>
          <!-- Status chip -->
          <span class="text-[11px] font-medium uppercase tracking-wider" :class="node.status === 'active' ? 'text-primary' : 'text-text-secondary'">
            {{ statusLabel[node.status] }}
          </span>
        </MotionDiv>
      </div>
    </div>
  </section>
</template>
