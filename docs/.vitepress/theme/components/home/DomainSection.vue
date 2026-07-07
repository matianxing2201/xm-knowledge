<script setup lang="ts">
import { useDomains } from '../../composables/useDomains'
import DomainCard from './DomainCard.vue'
import { motion } from 'motion-v'

const MotionDiv = motion.div

const domains = useDomains()
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
      <h2 class="text-[40px] font-heading font-bold text-text max-sm:text-[28px]">Explore Knowledge</h2>
      <p class="text-[18px] text-text-secondary mt-2">Choose a domain.</p>
    </MotionDiv>

    <div class="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
      <MotionDiv
        v-for="(domain, i) in domains"
        :key="domain.name"
        :initial="{ opacity: 0, y: 24 }"
        :whileInView="{ opacity: 1, y: 0 }"
        :viewport="{ once: true }"
        :transition="{ duration: 0.3, delay: i * 0.06, ease: [0.22,1,0.36,1] }"
        class="h-full"
      >
        <DomainCard :domain="domain" class="h-full" />
      </MotionDiv>
    </div>
  </section>
</template>
