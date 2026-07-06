import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '学习笔记',
  description: '个人学习笔记知识库',
  lang: 'zh-CN',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
})
