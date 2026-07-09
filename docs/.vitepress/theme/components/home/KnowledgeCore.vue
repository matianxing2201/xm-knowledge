<script setup lang="ts">
import { ref } from 'vue'
import { motion } from 'motion-v'
import { withBase } from 'vitepress'

const MotionDiv = motion.div

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  color: string
  link: string
}

const nodes: GraphNode[] = [
  { id: 'ai', label: 'AI', x: 200, y: 60, color: 'var(--color-ai)', link: '/ai/' },
  { id: 'java', label: 'Java', x: 60, y: 200, color: 'var(--color-java)', link: '/java/' },
  { id: 'center', label: 'NOW', x: 200, y: 200, color: 'var(--color-primary)', link: '/' },
  { id: 'web', label: 'Web', x: 340, y: 200, color: 'var(--color-web)', link: '/web/' },
  { id: 'go', label: 'Go', x: 200, y: 340, color: 'var(--color-go)', link: '/go/' },
]

const hovered = ref<string | null>(null)
</script>

<template>
  <MotionDiv
    class="relative w-[400px] h-[400px] select-none shrink-0"
    :initial="{ opacity: 0, scale: 0.96 }"
    :animate="{ opacity: 1, scale: 1 }"
    :transition="{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }"
  >
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
      <!-- Orbit ring -->
      <circle
        cx="200" cy="200" r="110"
        fill="none"
        stroke="var(--color-border)"
        stroke-width="1"
      />

      <!-- Connecting lines -->
      <g stroke="var(--color-border)" stroke-width="1.5" stroke-linecap="round">
        <line
          v-for="n in nodes.filter(n => n.id !== 'center')"
          :key="`edge-${n.id}`"
          x1="200" y1="200"
          :x2="n.x" :y2="n.y"
          :stroke-opacity="hovered && (hovered === n.id || hovered === 'center') ? 0.6 : 0.35"
        />
      </g>

      <!-- Nodes -->
      <g v-for="node in nodes" :key="node.id">
        <a
          :href="withBase(node.link)"
          class="cursor-pointer"
          @mouseenter="hovered = node.id"
          @mouseleave="hovered = null"
        >
          <!-- Hover glow -->
          <circle
            :cx="node.x" :cy="node.y" :r="node.id === 'center' ? 24 : 30"
            :fill="node.color"
            :fill-opacity="hovered === node.id ? 0.08 : 0"
            class="transition-all duration-300"
          />

          <!-- Outer ring -->
          <circle
            :cx="node.x" :cy="node.y" :r="node.id === 'center' ? 20 : 26"
            fill="var(--color-card)"
            :stroke="hovered === node.id ? node.color : 'var(--color-border)'"
            :stroke-width="node.id === 'center' ? 2 : 1.5"
            class="transition-all duration-300"
          />

          <!-- Inner dot -->
          <circle
            :cx="node.x" :cy="node.y" :r="node.id === 'center' ? 6 : 7"
            :fill="node.color"
          />

          <!-- Label -->
          <text
            :x="node.x"
            :y="node.y + (node.id === 'center' ? 32 : 38)"
            text-anchor="middle"
            :font-size="node.id === 'center' ? 11 : 13"
            font-family="JetBrains Mono, ui-monospace, monospace"
            font-weight="700"
            :fill="hovered === node.id ? node.color : 'var(--color-text)'"
            class="transition-colors duration-300"
          >
            {{ node.label }}
          </text>
        </a>
      </g>
    </svg>
  </MotionDiv>
</template>
