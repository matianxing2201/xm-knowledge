<script setup lang="ts">
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { computed } from 'vue'
import HomePage from './components/home/HomePage.vue'
import GiscusComments from './components/GiscusComments.vue'
import PageStats from './components/PageStats.vue'
import { MediumZoom } from 'vitepress-component-medium-zoom'
import 'vitepress-component-medium-zoom/style.css'

const { Layout: DefaultLayout } = DefaultTheme
const route = useRoute()

const isHome = computed(() => {
  const path = route.path
  return path === '/' || path === '/xm-knowledge/' || path === '/index.html' || path === '/xm-knowledge/index.html'
})
</script>

<template>
  <HomePage v-if="isHome" />
  <DefaultLayout v-else>
    <template #doc-after>
      <GiscusComments />
    </template>
    <template #doc-bottom>
      <PageStats />
    </template>
  </DefaultLayout>
  <MediumZoom selector=".vp-doc img" :options="{ background: 'rgba(0,0,0,0.8)' }" />
</template>
