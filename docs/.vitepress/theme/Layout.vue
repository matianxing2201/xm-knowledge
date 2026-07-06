<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import GiscusComments from './components/GiscusComments.vue'
import PageStats from './components/PageStats.vue'

const { Layout: DefaultLayout } = DefaultTheme
</script>

<template>
  <DefaultLayout>
    <template #doc-after>
      <GiscusComments />
    </template>
    <template #doc-bottom>
      <PageStats />
    </template>
  </DefaultLayout>
</template>
