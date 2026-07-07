<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { motion, useMotionValue, useSpring, useTransform } from 'motion-v'

const container = ref<HTMLElement | null>(null)
const mouseX = useMotionValue(0.5)
const mouseY = useMotionValue(0.5)
const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 100, damping: 20 })
const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 100, damping: 20 })

function onMouseMove(e: MouseEvent) {
  if (!container.value) return
  const rect = container.value.getBoundingClientRect()
  mouseX.set((e.clientX - rect.left) / rect.width)
  mouseY.set((e.clientY - rect.top) / rect.height)
}

// Diamond layout: AI(top), Java(left-center), Web(right-center), Go(bottom), ●(center)
const CX = 210
const CY = 210

const nodes = [
  { label: 'AI',    desc: 'LLM · Agent',         x: 210, y: 50,  color: '#10a37f', link: '/ai/' },
  { label: 'Java',  desc: 'Spring · JVM',         x: 60,  y: 185, color: '#f89820', link: '/java/' },
  { label: '●',     desc: 'NOW',                  x: 210, y: 185, color: '#7C3AED', link: '/' },
  { label: 'Web',   desc: 'Vue · React',          x: 360, y: 185, color: '#3b82f6', link: '/web/' },
  { label: 'Go',    desc: 'Goroutine · Web',      x: 210, y: 320, color: '#00ADD8', link: '/go/' },
]

// Connection lines (indices: 0→1, 0→3, 1→4, 3→4, center to all)
const lines = [
  { x1: 210, y1: 80,  x2: 90,  y2: 155 },
  { x1: 210, y1: 80,  x2: 330, y2: 155 },
  { x1: 90,  y1: 215, x2: 210, y2: 290 },
  { x1: 330, y1: 215, x2: 210, y2: 290 },
  { x1: 190, y1: 185, x2: 80,  y2: 185 },
  { x1: 230, y1: 185, x2: 340, y2: 185 },
  { x1: 210, y1: 165, x2: 210, y2: 60  },
  { x1: 210, y1: 205, x2: 210, y2: 310 },
]

// Particle system
const particles: { x: number; y: number; r: number; a: number; vx: number; vy: number }[] = []
for (let i = 0; i < 20; i++) {
  particles.push({
    x: Math.random() * 420,
    y: Math.random() * 420,
    r: Math.random() * 1.2 + 0.3,
    a: Math.random() * 0.3 + 0.05,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
  })
}

const particleSvg = ref('')
onMounted(() => {
  function tick() {
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > 420) p.vx *= -1
      if (p.y < 0 || p.y > 420) p.vy *= -1
    }
    particleSvg.value = particles.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="#7C3AED" opacity="${p.a}"/>`).join('')
    requestAnimationFrame(tick)
  }
  tick()
})

const hovered = ref<string | null>(null)
</script>

<template>
  <motion.div
    ref="container"
    class="relative w-[420px] h-[420px] hidden lg:block select-none"
    :style="{ perspective: '800px', transformStyle: 'preserve-3d' }"
    @mousemove="onMouseMove"
    @mouseleave="hovered = null"
  >
    <motion.div
      class="w-full h-full"
      :style="{ rotateX: rotateX + 'deg', rotateY: rotateY + 'deg', transformStyle: 'preserve-3d' }"
      :animate="{ y: [-6, 6, -6] }"
      :transition="{ duration: 6, repeat: Infinity, ease: 'easeInOut' }"
    >
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 420 420">
        <!-- Ambient particles -->
        <g v-html="particleSvg" />

        <!-- Connection lines -->
        <line v-for="(ln, i) in lines" :key="'l'+i"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2"
              stroke="rgba(124,58,237,0.12)" stroke-width="1" />
        <!-- Dashed accent lines to center -->
        <line x1="90"  y1="185" x2="210" y2="185" stroke="rgba(124,58,237,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />
        <line x1="330" y1="185" x2="210" y2="185" stroke="rgba(124,58,237,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />
        <line x1="210" y1="60"  x2="210" y2="185" stroke="rgba(124,58,237,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />
        <line x1="210" y1="310" x2="210" y2="185" stroke="rgba(124,58,237,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />

        <!-- Glowing ring around center -->
        <circle cx="210" cy="185" r="28" fill="none" stroke="rgba(124,58,237,0.08)" stroke-width="1" />
        <circle cx="210" cy="185" r="14" fill="none" stroke="rgba(124,58,237,0.15)" stroke-width="0.5" />

        <!-- Center dot -->
        <circle cx="210" cy="185" r="6" fill="#7C3AED">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="210" cy="185" r="10" fill="none" stroke="rgba(124,58,237,0.2)" stroke-width="0.5">
          <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>

        <!-- Domain nodes -->
        <g v-for="(n, i) in nodes.filter(n => n.label !== '●')" :key="n.label"
           :href="n.link" class="cursor-pointer"
           @mouseenter="hovered = n.label" @mouseleave="hovered = null">
          <!-- Node background circle -->
          <circle :cx="n.x" :cy="n.y" r="32" :fill="n.color + '10'"
                  :stroke="hovered === n.label ? n.color : 'rgba(255,255,255,0.08)'"
                  :stroke-width="hovered === n.label ? 1.5 : 0.5"
                  :filter="hovered === n.label ? 'url(#glow-'+n.label+')' : ''"
                  class="transition-all" style="transition: all 0.18s ease" />
          <!-- Label -->
          <text :x="n.x" :y="n.y + 1" text-anchor="middle" dominant-baseline="middle"
                :fill="hovered === n.label ? n.color : '#fafafa'"
                font-size="14" font-weight="700" style="transition: fill 0.18s ease">
            {{ n.label }}
          </text>
          <!-- Desc below -->
          <text :x="n.x" :y="n.y + 48" text-anchor="middle" fill="#a1a1aa" font-size="10">
            {{ n.desc }}
          </text>
          <!-- Glow filter defs -->
          <defs>
            <filter :id="'glow-'+n.label" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur :stdDeviation="4" result="blur" />
              <feFlood :flood-color="n.color" flood-opacity="0.3" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </g>
      </svg>
    </motion.div>
  </motion.div>
</template>
