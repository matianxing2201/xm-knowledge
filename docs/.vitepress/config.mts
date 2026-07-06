import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '学习笔记',
  description: '个人学习笔记知识库',
  lang: 'zh-CN',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  search: {
    provider: 'local',
    options: {
      detailedView: true,
    },
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'Java', link: '/java/' },
      { text: 'Go', link: '/go/' },
      { text: 'AI', link: '/ai/' },
      {
        text: '前端',
        items: [
          { text: 'Vue', link: '/web/vue/' },
          { text: 'React', link: '/web/react/' },
          { text: 'JavaScript', link: '/web/javascript/' },
          { text: 'Node.js', link: '/web/node/' },
          { text: 'TypeScript', link: '/web/typescript/' },
          { text: 'Vite', link: '/web/vite/' },
          { text: '网络', link: '/web/network/' },
          { text: 'CSS3', link: '/web/css3/' },
          { text: 'HTML5', link: '/web/html5/' },
          { text: 'Monorepo', link: '/web/monorepo/' },
        ],
      },
      { text: '标签', link: '/tags.html' },
      { text: '归档', link: '/archive.html' },
    ],

    sidebar: {
      '/web/vue/': [
        {
          text: 'Vue',
          items: [
            { text: '基础篇', link: '/web/vue/基础篇/' },
            { text: '深入组件', link: '/web/vue/深入组件/' },
            { text: '原理篇', link: '/web/vue/原理篇/' },
            { text: '可复用性与组合', link: '/web/vue/可复用性与组合/' },
            { text: 'API', link: '/web/vue/api/' },
            { text: 'Vuex', link: '/web/vue/vuex' },
            { text: 'Vue Router 基础', link: '/web/vue/vue-router-基础' },
            { text: 'Vue Router 进阶', link: '/web/vue/vue-router-进阶' },
            { text: 'Axios', link: '/web/vue/axios' },
            { text: '内置组件', link: '/web/vue/内置组件' },
            { text: '组件抽离原则', link: '/web/vue/组件抽离原则' },
            { text: 'Vue组件通信', link: '/web/vue/vue组件通信' },
          ],
        },
      ],
      '/web/react/': [
        {
          text: 'React',
          items: [
            { text: '核心概念', link: '/web/react/核心概念/' },
            { text: 'HOOK', link: '/web/react/hook/' },
            { text: '高级指引', link: '/web/react/高级指引/' },
          ],
        },
      ],
      '/web/javascript/': [
        {
          text: 'JavaScript',
          items: [
            { text: 'ECMAScript', link: '/web/javascript/ecmascript/' },
            { text: 'ECMAScript6', link: '/web/javascript/ecmascript6/' },
            { text: '颠覆认知的ES6+', link: '/web/javascript/es6-plus/' },
            { text: '函数式编程', link: '/web/javascript/函数式编程/' },
            { text: '数组扩展方法', link: '/web/javascript/数组扩展方法/' },
            { text: '正则表达式', link: '/web/javascript/正则表达式/' },
            { text: 'DOM', link: '/web/javascript/dom/' },
            { text: 'CSS/JS基础序言', link: '/web/javascript/css-js-basics/' },
          ],
        },
      ],
      '/web/node/': [
        {
          text: 'Node.js',
          items: [
            { text: '核心模块', link: '/web/node/核心模块/' },
          ],
        },
      ],
      '/web/typescript/': [
        {
          text: 'TypeScript',
          items: [
            { text: '项目配置', link: '/web/typescript/项目配置' },
            { text: '手册指南', link: '/web/typescript/手册指南/' },
            { text: '泛型', link: '/web/typescript/泛型' },
            { text: '接口 Interface', link: '/web/typescript/接口interface' },
            { text: '类', link: '/web/typescript/类' },
            { text: '函数', link: '/web/typescript/函数' },
            { text: '基本类型', link: '/web/typescript/基本类型' },
          ],
        },
      ],
      '/web/vite/': [
        {
          text: 'Vite',
          items: [
            { text: '基本介绍', link: '/web/vite/基本介绍' },
            { text: 'CSS相关', link: '/web/vite/css相关' },
            { text: '静态资源与环境变量', link: '/web/vite/静态资源与环境变量' },
            { text: '依赖预构件', link: '/web/vite/依赖预构件' },
            { text: '插件机制概述', link: '/web/vite/插件机制概述' },
            { text: 'Vite 独有钩子', link: '/web/vite/Vite独有钩子' },
            { text: 'createServer', link: '/web/vite/createServer' },
          ],
        },
      ],
      '/web/monorepo/': [
        {
          text: 'Monorepo',
          items: [
            { text: '前言', link: '/web/monorepo/前言' },
            { text: '案例集成', link: '/web/monorepo/案例-Vue和React项目集成到Monorepo' },
            { text: '微前端设计', link: '/web/monorepo/微前端开发设计概念' },
          ],
        },
      ],
      '/web/html5/': [
        {
          text: 'HTML5',
          items: [
            { text: '前端处理File', link: '/web/html5/前端处理File' },
            { text: 'Canvas', link: '/web/html5/Canvas' },
            { text: 'WebSocket', link: '/web/html5/WebSocket' },
          ],
        },
      ],
      '/web/css3/': [
        {
          text: 'CSS3',
          items: [
            { text: 'em/rem/vw/vh', link: '/web/css3/em-rem-vw-vh理解' },
            { text: 'BFC', link: '/web/css3/BFC块格式化上下文' },
            { text: '响应式设计', link: '/web/css3/响应式设计与媒体查询' },
            { text: 'Transform/Animation', link: '/web/css3/transform与animation' },
            { text: 'Flex布局', link: '/web/css3/Flex布局' },
            { text: '盒子居中', link: '/web/css3/盒子居中的五种方式' },
          ],
        },
      ],
      '/web/network/': [
        {
          text: '网络',
          items: [
            { text: 'HTTP/2协议', link: '/web/network/HTTP-2协议' },
            { text: 'HTTP协议', link: '/web/network/HTTP协议' },
            { text: '网络安全', link: '/web/network/网络安全' },
            { text: '跨域', link: '/web/network/跨域' },
            { text: 'AJAX', link: '/web/network/AJAX版本响应状态超时设置同步与异步' },
            { text: 'AJAX封装', link: '/web/network/同步与异步混编AJAX封装原生' },
            { text: 'TCP/HTTP版本', link: '/web/network/HTTP版本关闭TCP四次挥手同源策略' },
            { text: '缓存与连接', link: '/web/network/缓存长短连接Content-Length' },
            { text: 'HTTP报文', link: '/web/network/www历史HTTP报文请求方式GET与POST' },
            { text: 'DNS/TCP/UDP', link: '/web/network/DNS与IP与TCP-UDP与HTTP-HTTPS与三次握手' },
            { text: '网络初探', link: '/web/network/网络初探URL客户端与服务端域名操作' },
          ],
        },
      ],
      '/ai/': [
        {
          text: 'AI',
          items: [
            { text: 'Spring AI 智谱图片分析', link: '/ai/spring-ai/spring-ai-zhipu-image-analysis' },
            { text: 'LangChain 概述', link: '/ai/langchain/概述' },
            { text: 'LangChain Agents', link: '/ai/langchain/核心组件/Agents' },
            { text: 'LangChain Models', link: '/ai/langchain/核心组件/Models' },
            { text: 'LangGraph', link: '/ai/lang-graph' },
            { text: 'Deep Agents', link: '/ai/deep-agents' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/xm-knowledge' },
    ],

    footer: {
      message: '学习笔记知识库',
      copyright: '© 2026 学习笔记',
    },
  },
})
