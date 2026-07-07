<script setup lang="ts">
import FloatingParticles from './FloatingParticles.vue'
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-[-1] will-change-transform">
    <!-- Mesh gradient -->
    <div
      class="absolute inset-0"
      style="background:
        radial-gradient(ellipse 80% 60% at 20% 30%, rgba(124,58,237,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 60%, rgba(34,211,238,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 50% 80%, rgba(34,197,94,0.05) 0%, transparent 50%);
      "
    />
    <!-- SVG noise overlay -->
    <svg class="absolute inset-0 w-full h-full opacity-[0.03]">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
    <FloatingParticles />
  </div>
</template>
