<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let animationId = 0

onMounted(() => {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = []
  const COUNT = 40

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    })
  }

  function draw() {
    if (!ctx || !canvas.value) return
    const w = canvas.value.width = window.innerWidth
    const h = canvas.value.height = window.innerHeight
    ctx.clearRect(0, 0, w, h)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > w) p.vx *= -1
      if (p.y < 0 || p.y > h) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(217, 119, 6, ${p.alpha})`
      ctx.fill()
    }

    animationId = requestAnimationFrame(draw)
  }

  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>

<template>
  <canvas ref="canvas" class="fixed inset-0 pointer-events-none z-0 will-change-transform" />
</template>
