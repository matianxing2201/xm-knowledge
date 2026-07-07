<script setup lang="ts">
import { useRoute } from 'vitepress'
import { watch, ref } from 'vue'

const route = useRoute()
const key = ref(0)

watch(
  () => route.path,
  () => { key.value++ },
)
</script>

<template>
  <div class="giscus-wrapper">
    <component
      :key="key"
      :is="'script'"
      src="https://giscus.app/client.js"
      data-repo="matianxing2201/xm-knowledge"
      data-repo-id=""
      data-category="Announcements"
      data-category-id=""
      data-mapping="pathname"
      data-strict="0"
      data-reactions-enabled="1"
      data-emit-metadata="0"
      data-input-position="top"
      data-theme="light"
      data-lang="zh-CN"
      crossorigin="anonymous"
      async
    />
  </div>
</template>

<style scoped>
.giscus-wrapper {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
