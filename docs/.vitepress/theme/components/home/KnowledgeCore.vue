<script setup lang="ts">
import { ref } from 'vue'
import { motion, useMotionValue, useSpring, useTransform } from 'motion-v'

const container = ref<HTMLElement | null>(null)
const mouseX = useMotionValue(0)
const mouseY = useMotionValue(0)
const rotateX = useSpring(useTransform(mouseY, [0, 1], [3, -3]), { stiffness: 100, damping: 20 })
const rotateY = useSpring(useTransform(mouseX, [0, 1], [-3, 3]), { stiffness: 100, damping: 20 })

function onMouseMove(e: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouseX.set((e.clientX - rect.left) / rect.width)
  mouseY.set((e.clientY - rect.top) / rect.height)
}

const nodes = [
  { label: 'AI',   x: 50,  y: 28,  link: '/ai/',   accent: '#10a37f' },
  { label: 'Java', x: 20,  y: 60,  link: '/java/', accent: '#f89820' },
  { label: 'Web',  x: 80,  y: 60,  link: '/web/',  accent: '#3b82f6' },
  { label: 'Go',   x: 50,  y: 85,  link: '/go/',   accent: '#00ADD8' },
]
</script>

<template>
  <motion.div
    ref="container"
    class="relative w-[420px] h-[420px] hidden md:block"
    :style="{ rotateX: rotateX + 'deg', rotateY: rotateY + 'deg' }"
    @mousemove="onMouseMove"
    :animate="{ y: [-8, 8, -8] }"
    :transition="{ duration: 6, repeat: Infinity, ease: 'easeInOut' }"
  >
    <!-- SVG connection lines -->
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <!-- AI to Java -->
      <line x1="55" y1="34" x2="28" y2="60" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- AI to Web -->
      <line x1="55" y1="34" x2="78" y2="60" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Java to Go -->
      <line x1="28" y1="66" x2="50" y2="82" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Web to Go -->
      <line x1="78" y1="66" x2="50" y2="82" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" />
      <!-- Center dot -->
      <circle cx="50" cy="50" r="1.5" fill="#7C3AED" opacity="0.6" />
    </svg>

    <!-- Nodes -->
    <a v-for="node in nodes" :key="node.label" :href="node.link"
       class="absolute flex flex-col items-center gap-1 group transition-transform duration-[var(--motion-hover)] hover:scale-110"
       :style="{ left: node.x + '%', top: node.y + '%', transform: 'translate(-50%, -50%)' }">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-shadow duration-[var(--motion-hover)] hover:shadow-[0_0_24px_var(--tw-shadow-color)]"
        :style="{ background: node.accent + '20', color: node.accent, '--tw-shadow-color': node.accent }">
        {{ node.label.slice(0, 2) }}
      </div>
      <span class="text-text-secondary text-xs">{{ node.label }}</span>
    </a>
  </motion.div>
</template>
