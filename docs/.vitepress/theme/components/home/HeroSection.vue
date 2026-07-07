<script setup lang="ts">
import HeroContent from './HeroContent.vue'
import KnowledgeCore from './KnowledgeCore.vue'
</script>

<template>
  <section class="min-h-screen flex items-center max-w-[1200px] mx-auto px-[120px] pt-[100px] max-lg:px-12 max-sm:px-6">
    <div class="flex items-center gap-12 w-full">
      <div class="flex-1">
        <HeroContent />
      </div>
      <KnowledgeCore />
    </div>
  </section>
</template>
