<script setup lang="ts">
import HeroContent from './HeroContent.vue'
import KnowledgeCore from './KnowledgeCore.vue'
</script>

<template>
  <section class="h-[720px] max-h-screen flex items-center max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] pt-[60px] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
    <div class="grid grid-cols-[58%_42%] gap-20 items-center w-full max-lg:grid-cols-1 max-lg:gap-12">
      <HeroContent />
      <div class="hidden lg:flex justify-center">
        <KnowledgeCore />
      </div>
    </div>
  </section>
</template>