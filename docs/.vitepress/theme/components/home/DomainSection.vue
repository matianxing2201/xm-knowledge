<script setup lang="ts">
import { computed } from 'vue'
import { useDomains } from '../../composables/useDomains'
import DomainCard from './DomainCard.vue'

const domains = useDomains()

const sortedDomains = computed(() => {
  const arr = [...domains.value]
  arr.sort((a, b) => b.articleCount - a.articleCount)
  return arr
})
</script>

<template>
  <section class="max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] py-[var(--section-space)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
    <h2 class="text-[36px] font-heading font-bold text-text max-sm:text-[28px] tracking-[-0.01em] mb-8">Explore Knowledge</h2>

    <div class="domain-grid hidden md:grid">
      <div class="domain-java">
        <DomainCard :domain="sortedDomains[0]" :large="true" />
      </div>
      <div class="domain-web">
        <DomainCard :domain="sortedDomains[1]" />
      </div>
      <div class="domain-go">
        <DomainCard :domain="sortedDomains[2]" />
      </div>
      <div class="domain-ai">
        <DomainCard :domain="sortedDomains[3]" :large="true" />
      </div>
    </div>

    <div class="flex flex-col gap-4 md:hidden">
      <DomainCard v-for="domain in sortedDomains" :key="domain.name" :domain="domain" />
    </div>
  </section>
</template>

<style scoped>
.domain-grid {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr 1fr auto;
  grid-template-areas:
    "java web web"
    "java go go"
    "ai ai ai";
  gap: 24px;
}

.domain-java { grid-area: java; }
.domain-web { grid-area: web; }
.domain-go { grid-area: go; }
.domain-ai { grid-area: ai; }
</style>