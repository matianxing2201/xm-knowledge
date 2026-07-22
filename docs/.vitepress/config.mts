import { defineConfig } from "vitepress";
import { withFolderTree } from "vitepress-plugin-folder-tree";
import { RssPlugin } from "vitepress-plugin-rss";
import tailwindcss from "@tailwindcss/vite";
import { enrichTreeDates } from "./plugins/enrich-tree-dates";

export default withFolderTree(
  defineConfig({
    title: "学习笔记",
    description: "个人学习笔记知识库",
    lang: "zh-CN",
    base: "/xm-knowledge/",
    cleanUrls: true,
    srcExclude: ["**/superpowers/**", "**/spec/**"],

    sitemap: {
      hostname: "https://matianxing2201.github.io/xm-knowledge",
    },

    head: [
      ["link", { rel: "icon", href: "/favicon.ico" }],
      [
        "script",
        {
          async: "",
          src: "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js",
        },
      ],
    ],
    // @ts-ignore - search 类型在 VitePress 1.6 中尚未导出，运行时正常
    search: {
      provider: "local",
      options: {
        detailedView: true,
      },
    },

    vite: {
      plugins: [
        enrichTreeDates(),
        tailwindcss(),
        RssPlugin({
          title: "学习笔记",
          description: "个人学习笔记知识库",
          baseUrl: "https://matianxing2201.github.io",
          url: "https://matianxing2201.github.io/xm-knowledge/feed.xml",
          filename: "feed.xml",
          copyright: "© 2026 学习笔记",
        }),
      ],
      ssr: {
        noExternal: ["vitepress-component-medium-zoom"],
      },
      assetsInclude: ["**/*.png"],
    },

    markdown: {
      theme: {
        light: "github-light",
        dark: "github-dark",
      },
      lineNumbers: true,
    },

    themeConfig: {
      nav: [
        { text: "首页", link: "/" },
        {
          text: "前端",
          items: [
            { text: "Vite", link: "/web/vite/" },
            { text: "Monorepo", link: "/web/monorepo/" },
            { text: "TypeScript", link: "/web/typescript/" },
            { text: "React", link: "/web/react/" },
            { text: "Vue", link: "/web/vue/" },
            { text: "HTML5", link: "/web/html5/" },
            { text: "网络", link: "/web/network/" },
            { text: "CSS3", link: "/web/css3/" },
            { text: "ECMAScript6", link: "/web/ecmascript6/" },
            { text: "颠覆认知的ES6+", link: "/web/es6-plus/" },
            { text: "数组扩展方法", link: "/web/array-methods/" },
            { text: "DOM", link: "/web/dom/" },
            { text: "ECMAScript", link: "/web/ecmascript/" },
            { text: "CSS/JS基础序言", link: "/web/css-js/" },
            { text: "基础", link: "/web/base/" },
          ],
        },
        { text: "Java", link: "/java/" },
        {
          text: "AI",
          items: [
            { text: "AI Agent", link: "/ai/AI-Agent/" },
            { text: "Spring AI", link: "/ai/SpringAI/" },
            { text: "LangChain", link: "/ai/LangChain/" },
          ],
        },
        { text: "Go", link: "/go/" },
        { text: "标签", link: "/tags.html" },
        { text: "归档", link: "/archive.html" },
      ],

      sidebar: {
        "/web/vue/": [
          {
            text: "Vue",
            items: [
              { text: "基础篇", link: "/web/vue/基础篇/" },
              { text: "深入组件", link: "/web/vue/深入组件/" },
              { text: "原理篇", link: "/web/vue/原理篇/" },
              { text: "可复用性与组合", link: "/web/vue/可复用性与组合/" },
              { text: "API", link: "/web/vue/api/" },
              { text: "Vuex", link: "/web/vue/vuex" },
              { text: "Vue Router 基础", link: "/web/vue/vue-router-基础" },
              { text: "Vue Router 进阶", link: "/web/vue/vue-router-进阶" },
              { text: "Axios", link: "/web/vue/axios" },
              { text: "内置组件", link: "/web/vue/内置组件" },
              { text: "组件抽离原则", link: "/web/vue/组件抽离原则" },
              { text: "Vue组件通信", link: "/web/vue/vue组件通信" },
            ],
          },
        ],
        "/web/react/": [
          {
            text: "React",
            items: [
              { text: "核心概念", link: "/web/react/核心概念/" },
              { text: "HOOK", link: "/web/react/HOOK/" },
              { text: "高级指引", link: "/web/react/高级指引/" },
            ],
          },
        ],
        "/web/react/核心概念/": [
          {
            text: "核心概念",
            items: [
              { text: "初识React", link: "/web/react/核心概念/intro-to-react" },
              {
                text: "组合与继承、CSS Module",
                link: "/web/react/核心概念/composition-css-module",
              },
              {
                text: "父子组件数据关系与状态提升",
                link: "/web/react/核心概念/lifting-state-up",
              },
              {
                text: "非受控组件、受控与非受控选择方案",
                link: "/web/react/核心概念/uncontrolled-vs-controlled",
              },
              {
                text: "受控组件",
                link: "/web/react/核心概念/controlled-component",
              },
              { text: "列表渲染", link: "/web/react/核心概念/list-rendering" },
              {
                text: "条件渲染",
                link: "/web/react/核心概念/conditional-rendering",
              },
              {
                text: "事件处理函数绑定与事件对象",
                link: "/web/react/核心概念/event-handling",
              },
              {
                text: "state与setState、单向数据流",
                link: "/web/react/核心概念/state-setstate",
              },
              {
                text: "组件与Props",
                link: "/web/react/核心概念/component-and-props",
              },
              {
                text: "渲染元素ReactDOM.render",
                link: "/web/react/核心概念/reactdom-render",
              },
              { text: "JSX", link: "/web/react/核心概念/jsx" },
            ],
          },
        ],
        "/web/react/HOOK/": [
          {
            text: "HOOK",
            items: [
              {
                text: "类组件与函数组件与useState",
                link: "/web/react/HOOK/class-vs-function-and-useState",
              },
              { text: "useReducer", link: "/web/react/HOOK/useReducer" },
              { text: "Effect Hook", link: "/web/react/HOOK/effect-hook" },
              { text: "State Hook", link: "/web/react/HOOK/state-hook" },
              { text: "Hook 规则", link: "/web/react/HOOK/hook-rules" },
            ],
          },
        ],
        "/web/react/高级指引/": [
          {
            text: "高级指引",
            items: [
              { text: "深入JSX", link: "/web/react/高级指引/jsx-in-depth" },
              {
                text: "Fragment和段语法",
                link: "/web/react/高级指引/fragments",
              },
              { text: "Context API", link: "/web/react/高级指引/context-api" },
              {
                text: "Context与组合的应用场景与使用问题",
                link: "/web/react/高级指引/context-and-composition",
              },
              {
                text: "初识Context的使用场景",
                link: "/web/react/高级指引/context-use-cases",
              },
              {
                text: "代码分割之错误边界与Suspense和命名导出",
                link: "/web/react/高级指引/code-splitting-error-boundary-suspense",
              },
              {
                text: "错误边界与使用技巧",
                link: "/web/react/高级指引/error-boundary",
              },
              {
                text: "代码分割之lazy:Suspense与路由懒加载",
                link: "/web/react/高级指引/lazy-suspense-route",
              },
              {
                text: "代码分割之import静动态导入",
                link: "/web/react/高级指引/import-code-splitting",
              },
            ],
          },
        ],
        "/web/javascript/": [
          {
            text: "JavaScript",
            items: [
              { text: "ECMAScript", link: "/web/javascript/ecmascript/" },
              { text: "ECMAScript6", link: "/web/javascript/ecmascript6/" },
              { text: "颠覆认知的ES6+", link: "/web/javascript/es6-plus/" },
              { text: "函数式编程", link: "/web/javascript/函数式编程/" },
              { text: "数组扩展方法", link: "/web/javascript/数组扩展方法/" },
              { text: "正则表达式", link: "/web/javascript/正则表达式/" },
              { text: "DOM", link: "/web/javascript/dom/" },
              {
                text: "CSS/JS基础序言",
                link: "/web/javascript/css-js-basics/",
              },
            ],
          },
        ],
        "/web/typescript/": [
          {
            text: "TypeScript",
            items: [
              {
                text: "初识 TS、编译、语法检查",
                link: "/web/typescript/ts-introduction",
              },
              {
                text: "类型的注释与 any 类型的特点",
                link: "/web/typescript/type-annotation-any",
              },
              {
                text: "静态语言与动态语言",
                link: "/web/typescript/static-vs-dynamic",
              },
              { text: "基础类型", link: "/web/typescript/basic-types" },
              { text: "函数", link: "/web/typescript/functions" },
              { text: "泛型", link: "/web/typescript/generics" },
              { text: "接口（interface）", link: "/web/typescript/interface" },
              { text: "类", link: "/web/typescript/classes" },
            ],
          },
        ],
        "/web/vite/": [
          {
            text: "Vite",
            items: [
              { text: "基本介绍", link: "/web/vite/基本介绍" },
              { text: "CSS相关", link: "/web/vite/css相关" },
              {
                text: "静态资源与环境变量",
                link: "/web/vite/静态资源与环境变量",
              },
              { text: "依赖预构件", link: "/web/vite/依赖预构件" },
              { text: "插件机制概述", link: "/web/vite/插件机制概述" },
              { text: "Vite 独有钩子", link: "/web/vite/Vite独有钩子" },
              { text: "createServer", link: "/web/vite/createServer" },
            ],
          },
        ],
        "/web/monorepo/": [
          {
            text: "Monorepo",
            items: [
              { text: "前言", link: "/web/monorepo/前言" },
              {
                text: "微前端设计",
                link: "/web/monorepo/微前端开发设计概念",
              },
              {
                text: "案例集成",
                link: "/web/monorepo/案例-Vue和React项目集成到Monorepo",
              },
            ],
          },
        ],
        "/web/html5/": [
          {
            text: "HTML5",
            items: [
              { text: "前端处理File", link: "/web/html5/前端处理File" },
              { text: "Canvas", link: "/web/html5/Canvas" },
              { text: "WebSocket", link: "/web/html5/WebSocket" },
            ],
          },
        ],
        "/web/css3/": [
          {
            text: "CSS3",
            items: [
              { text: "em/rem/vw/vh", link: "/web/css3/em-rem-vw-vh理解" },
              { text: "BFC", link: "/web/css3/BFC块格式化上下文" },
              { text: "响应式设计", link: "/web/css3/响应式设计与媒体查询" },
              {
                text: "Transform/Animation",
                link: "/web/css3/transform与animation",
              },
              { text: "Flex布局", link: "/web/css3/Flex布局" },
              { text: "盒子居中", link: "/web/css3/盒子居中的五种方式" },
            ],
          },
        ],
        "/web/network/": [
          {
            text: "网络",
            items: [
              { text: "HTTP/2协议", link: "/web/network/HTTP-2协议" },
              { text: "HTTP协议", link: "/web/network/HTTP协议" },
              { text: "网络安全", link: "/web/network/网络安全" },
              { text: "跨域", link: "/web/network/跨域" },
              {
                text: "AJAX",
                link: "/web/network/AJAX版本响应状态超时设置同步与异步",
              },
              {
                text: "AJAX封装",
                link: "/web/network/同步与异步混编AJAX封装原生",
              },
              {
                text: "TCP/HTTP版本",
                link: "/web/network/HTTP版本关闭TCP四次挥手同源策略",
              },
              {
                text: "缓存与连接",
                link: "/web/network/缓存长短连接Content-Length",
              },
              {
                text: "HTTP报文",
                link: "/web/network/www历史HTTP报文请求方式GET与POST",
              },
              {
                text: "DNS/TCP/UDP",
                link: "/web/network/DNS与IP与TCP-UDP与HTTP-HTTPS与三次握手",
              },
              {
                text: "网络初探",
                link: "/web/network/网络初探URL客户端与服务端域名操作",
              },
            ],
          },
        ],
        "/ai/": [
          {
            text: "AI Agent",
            link: "/ai/AI-Agent/",
            items: [
              {
                text: "环境搭建",
                link: "/ai/AI-Agent/环境搭建",
              },
            ],
          },
          {
            text: "Spring AI",
            link: "/ai/SpringAI/",
            items: [
              {
                text: "Spring AI + 智谱多模态图片分析",
                link: "/ai/SpringAI/spring-ai-zhipu-image-analysis",
              },
              {
                text: "Spring AI + MiMo TTS 语言生成",
                link: "/ai/SpringAI/spring-ai-mimo-tts",
              },
              {
                text: "Spring AI + 智谱文生图与视频",
                link: "/ai/SpringAI/spring-ai-zhipu-text-to-image-video",
              },
              {
                text: "Spring AI + 智谱 AI + Milvus RAG 实战",
                link: "/ai/SpringAI/spring-ai-zhipu-milvus",
              },
            ],
          },
          {
            text: "LangChain",
            link: "/ai/LangChain/",
            items: [],
          },
        ],
      },

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/matianxing2201/xm-knowledge",
        },
      ],

      footer: {
        message: "学习笔记知识库",
        copyright: "© 2026 学习笔记",
      },
    },
  }),
);
