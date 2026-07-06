<script setup lang="ts">
import { onMounted, ref } from 'vue'

const loaded = ref(false)

onMounted(() => {
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="page-stats read-count">
    阅读量：<span id="busuanzi_value_page_pv">--</span>
  </div>
</template>

<style scoped>
.page-stats {
  margin-top: 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
