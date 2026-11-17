<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import Lenis from 'lenis'
import NavbarSection from './NavbarSection.vue'
import SearchModal from './SearchModal.vue'
import { useArticles } from '../../composables/useArticles'
import { useDomains } from '../../composables/useDomains'
import { useStatistics } from '../../composables/useStatistics'

const allArticles = useArticles()
const domains = useDomains()
const stats = useStatistics()
const archiveHref = withBase('/archive.html')
const featuredDomains = computed(() => domains.value.filter((domain) => domain.articleCount > 0))
const activeCategory = ref('全部')
const showAllArticles = ref(false)
const showRainbowEditor = ref(false)
const rainbowDensity = ref(12)
const rainbowRows = ref(4)
const rainbowSpeed = ref(12)
const rainbowDensityOptions = [
  { value: 6, label: '疏朗', sample: 'sparse' },
  { value: 12, label: '均衡', sample: 'balanced' },
  { value: 20, label: '密集', sample: 'dense' },
]
const rainbowRowOptions = [3, 4, 6]
const rainbowSpeedOptions = [
  { value: 16, label: '舒缓' },
  { value: 12, label: '从容' },
  { value: 6, label: '轻快' },
]
const articleCategories = computed(() => ['全部', ...new Set(allArticles.value.map((post) => post.category))])
const rainbowColors = ['#F16A72', '#F6A544', '#F6C84F', '#7DBA76', '#737CEB', '#C06AD9']
const rainbowArcs = computed(() => Array.from({ length: rainbowRows.value }, (_, index) => {
  const radius = 248 - index * (108 / Math.max(1, rainbowRows.value - 1))
  const colorIndex = Math.round(((rainbowRows.value - index - 1) / Math.max(1, rainbowRows.value - 1)) * (rainbowColors.length - 1))
  return { path: `M ${280 - radius} 280 A ${radius} ${radius} 0 0 1 ${280 + radius} 280`, color: rainbowColors[colorIndex] }
}))
const rainbowDashArray = computed(() => {
  const segmentLength = 1000 / rainbowDensity.value
  return `${segmentLength * 0.28} ${segmentLength * 0.72}`
})
const rainbowDashOffset = computed(() => `${-(1000 / rainbowDensity.value)}px`)
const filteredArticles = computed(() => {
  const posts = [...allArticles.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((post) => activeCategory.value === '全部' || post.category === activeCategory.value)
  return showAllArticles.value ? posts : posts.slice(0, 4)
})

watch(activeCategory, () => { showAllArticles.value = false })

function resetRainbow() {
  rainbowDensity.value = 12
  rainbowRows.value = 4
  rainbowSpeed.value = 12
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '持续更新'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

let lenis: Lenis | null = null
let frame = 0

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lenis = new Lenis({ lerp: 0.1 })
  const raf = (time: number) => {
    lenis?.raf(time)
    frame = requestAnimationFrame(raf)
  }
  frame = requestAnimationFrame(raf)
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  lenis?.destroy()
})
</script>

<template>
  <div class="home-root">
    <SearchModal />
    <NavbarSection />

    <main>
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-sky" aria-hidden="true">
          <span class="hero-sun" />
          <span class="hero-cloud hero-cloud--one" />
          <span class="hero-cloud hero-cloud--two" />
          <svg class="hero-rainbow" viewBox="0 0 560 280" fill="none" aria-label="可调整的彩虹">
            <path v-for="(arc, index) in rainbowArcs" :key="index" :d="arc.path" :stroke="arc.color" stroke-width="16" pathLength="1000" :stroke-dasharray="rainbowDashArray" stroke-linecap="round" :style="{ animationDuration: `${rainbowSpeed}s`, '--rainbow-dash-offset': rainbowDashOffset }" />
          </svg>
          <span class="hero-hill hero-hill--back" />
          <span class="hero-hill hero-hill--front" />
          <span class="hero-spark hero-spark--one">✦</span>
          <span class="hero-spark hero-spark--two">✳</span>
        </div>

        <div class="hero-inner">
          <div class="hero-copy">
            <p class="hero-kicker"><span class="status-dot" /> XM · 个人博客</p>
            <h1 id="home-title">记录所见，<br><span>也写下所想。</span></h1>
            <p class="hero-description">关于生活、技术与一路上的观察和思考。</p>
            <div class="hero-actions">
              <a href="#articles" class="button button--primary">从新文章开始 <span aria-hidden="true">↘</span></a>
              <a :href="archiveHref" class="button button--text">浏览全部文章 <span aria-hidden="true">→</span></a>
            </div>
            <div class="hero-meta"><span>{{ stats.articles }} 篇文章</span><i /> <span>{{ stats.categories }} 个主题</span><i /> <span>持续更新中</span></div>
          </div>

          <div class="hero-art" aria-label="彩虹与笔记卡片的插画">
            <button class="rainbow-edit-button" type="button" :aria-expanded="showRainbowEditor" aria-controls="rainbow-editor" @click="showRainbowEditor = !showRainbowEditor"><svg viewBox="0 0 32 20" aria-hidden="true"><path d="M3 18a13 13 0 0 1 26 0" stroke="#ef7075"/><path d="M8 18a8 8 0 0 1 16 0" stroke="#efb44f"/><path d="M13 18a3 3 0 0 1 6 0" stroke="#6eaf87"/></svg><span>{{ showRainbowEditor ? '收起调色' : '调一调彩虹' }}</span><b aria-hidden="true">↗</b></button>
            <div v-if="showRainbowEditor" id="rainbow-editor" class="rainbow-editor" role="dialog" aria-label="彩虹编辑器" @click.stop>
              <div class="editor-heading"><div><span class="editor-kicker">COLOR PLAYGROUND</span><h2>调一调彩虹</h2><p>选一个喜欢的节奏，马上预览。</p></div><button type="button" class="editor-close" aria-label="关闭彩虹编辑器" @click="showRainbowEditor = false">×</button></div>
              <div class="editor-control" role="group" aria-label="线段密度"><div class="editor-label"><span>线段密度</span><b>{{ rainbowDensityOptions.find((option) => option.value === rainbowDensity)?.label ?? `${rainbowDensity} 段` }}</b></div><div class="editor-choices editor-choices--density"><button v-for="option in rainbowDensityOptions" :key="option.value" type="button" :class="['editor-choice', { 'is-selected': rainbowDensity === option.value }]" :aria-pressed="rainbowDensity === option.value" @click="rainbowDensity = option.value"><span :class="['density-sample', `density-sample--${option.sample}`]" aria-hidden="true"/><span>{{ option.label }}</span></button></div></div>
              <div class="editor-control" role="group" aria-label="彩虹层数"><div class="editor-label"><span>彩虹层数</span><b>{{ rainbowRows }} 层</b></div><div class="editor-choices editor-choices--rows"><button v-for="rows in rainbowRowOptions" :key="rows" type="button" :class="['editor-choice', { 'is-selected': rainbowRows === rows }]" :aria-pressed="rainbowRows === rows" @click="rainbowRows = rows"><span class="row-sample" :style="{ '--sample-rows': rows }" aria-hidden="true"><i v-for="row in rows" :key="row"/></span><span>{{ rows }} 层</span></button></div></div>
              <div class="editor-control" role="group" aria-label="流动速度"><div class="editor-label"><span>流动节奏</span><b>{{ rainbowSpeedOptions.find((option) => option.value === rainbowSpeed)?.label ?? `${rainbowSpeed} 秒` }}</b></div><div class="editor-choices editor-choices--speed"><button v-for="option in rainbowSpeedOptions" :key="option.value" type="button" :class="['editor-choice', { 'is-selected': rainbowSpeed === option.value }]" :aria-pressed="rainbowSpeed === option.value" @click="rainbowSpeed = option.value"><span class="speed-glyph" aria-hidden="true">{{ option.value === 16 ? '〜' : option.value === 12 ? '≈' : '≫' }}</span><span>{{ option.label }}</span></button></div></div>
              <div class="editor-footer"><span><i/>调整会即时预览</span><button type="button" @click="resetRainbow">恢复默认 <b aria-hidden="true">↺</b></button></div>
            </div>
            <div class="hero-note hero-note--back"><span class="note-mini note-mini--green">AI</span><span class="note-line note-line--long" /><span class="note-line" /><span class="note-line note-line--short" /></div>
            <div class="hero-note hero-note--front"><span class="note-date">TODAY’S NOTE</span><strong>好奇心，<br>值得被记录。</strong><span class="note-mini note-mini--blue">KEEP LEARNING ✦</span></div>
            <span class="art-star art-star--one">✳</span>
            <span class="art-star art-star--two">✦</span>
          </div>
        </div>
        <a class="hero-scroll" href="#articles"><span />向下探索</a>
      </section>

      <section id="articles" class="section articles-section">
        <div class="section-inner">
          <div class="section-heading">
            <div><p class="section-kicker">最近更新 <span>· LATEST NOTES</span></p><h2>最近写下的几篇。</h2></div>
            <a :href="archiveHref" class="text-link">查看全部文章 <span aria-hidden="true">↗</span></a>
          </div>
          <div class="article-filters" aria-label="按主题筛选文章">
            <button v-for="category in articleCategories" :key="category" type="button" :aria-pressed="activeCategory === category" :class="{ 'is-active': activeCategory === category }" @click="activeCategory = category">
              {{ category }} <span v-if="category !== '全部'">{{ allArticles.filter((post) => post.category === category).length }}</span>
            </button>
          </div>
          <div class="article-grid">
            <article v-for="(post, index) in filteredArticles" :key="post.url" class="article-card" :class="`article-card--${index + 1}`">
              <a :href="withBase(post.url)" class="article-card-link">
                <div class="article-card-top"><span class="article-category">{{ post.category }}</span><span class="article-date">{{ formatDate(post.date) }}</span></div>
                <div class="article-number">{{ String(index + 1).padStart(2, '0') }}</div>
                <h3>{{ post.title }}</h3>
                <p>{{ post.excerpt || `${post.category} · ${post.readingTime} 分钟阅读` }}</p>
                <span class="card-arrow" aria-hidden="true">↗</span>
              </a>
            </article>
          </div>
          <p v-if="filteredArticles.length === 0" class="article-empty">这个主题还没有文章。</p>
          <div class="article-more-row">
            <button v-if="!showAllArticles && filteredArticles.length >= 4" class="article-more" type="button" @click="showAllArticles = true">展开更多文章 <span aria-hidden="true">↓</span></button>
            <button v-else-if="showAllArticles" class="article-more" type="button" @click="showAllArticles = false">收起文章 <span aria-hidden="true">↑</span></button>
          </div>
        </div>
      </section>

      <section id="projects" class="section topics-section">
        <div class="section-inner topics-layout">
          <div class="topics-intro"><p class="section-kicker">探索路径 <span>· TOPICS</span></p><h2>从一个问题，<br>走进一个新世界。</h2><p>把零散的灵感整理成可以继续探索的知识路径。</p><a :href="archiveHref" class="text-link">打开文章归档 <span aria-hidden="true">→</span></a></div>
          <div class="topic-grid">
            <a v-for="(domain, index) in featuredDomains" :key="domain.name" :href="withBase(domain.link)" class="topic-card" :style="{ '--topic-accent': domain.accent }">
              <span class="topic-index">0{{ index + 1 }}</span><span class="topic-icon" aria-hidden="true">{{ ['✳', '⌘', '↗', '◉'][index % 4] }}</span>
              <h3>{{ domain.name }}</h3><p>{{ domain.desc }}</p><span class="topic-count">{{ domain.articleCount }} 篇笔记 <b aria-hidden="true">↗</b></span>
            </a>
          </div>
        </div>
      </section>

      <section id="about" class="about-section">
        <div class="about-inner">
          <div class="about-copy">
            <p class="section-kicker">关于这里 <span>· ABOUT</span></p>
            <h2>写给未来的自己，<br>也写给路过的你。</h2>
            <p>这里收集学习过程中的问题、实验与答案。愿这些笔记能让知识连接起来，也给下一次探索一点灵感。</p>
            <a href="https://github.com/matianxing2201/xm-knowledge" target="_blank" rel="noopener noreferrer" class="about-project-link">查看 XM Knowledge 项目 <span aria-hidden="true">↗</span></a>
          </div>
          <a href="https://github.com/matianxing2201" target="_blank" rel="noopener noreferrer" class="about-profile" aria-label="访问 Matianxing 的 GitHub 个人主页">
            <span class="profile-avatar" aria-hidden="true">M</span>
            <span class="profile-copy"><span class="profile-label">作者的 GitHub</span><strong>Matianxing</strong><span class="profile-handle">@matianxing2201</span></span>
            <span class="profile-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>

    <footer class="home-footer"><span>© 2026 XM Knowledge</span><span>保持好奇，继续前进 <b>✦</b></span><a :href="withBase('/feed.xml')">RSS <span aria-hidden="true">↗</span></a></footer>
  </div>
</template>

<style scoped>
.home-root{--ink:#1e3150;--muted:#6c7c93;--paper:#fffdf8;--blue:#4268e8;--line:#e7edf6;min-height:100vh;overflow:hidden;background:var(--paper);color:var(--ink);font-family:var(--font-body)}
:global(.dark) .home-root{--ink:#ecf2ff;--muted:#a4b2c8;--paper:#101928;--blue:#8ca5ff;--line:#2a3950}
.hero{position:relative;min-height:700px;padding:112px 32px 56px;background:#eaf4ff;isolation:isolate;overflow:hidden}
.hero-sky{position:absolute;inset:0;z-index:-1;overflow:hidden;background:linear-gradient(165deg,#f5fbff 0%,#d9ecff 64%,#d4e7ff 100%)}
:global(.dark) .hero-sky{background:linear-gradient(165deg,#243750 0%,#1c3651 64%,#243e58 100%)}
.hero-sun{position:absolute;width:clamp(160px,23vw,300px);aspect-ratio:1;top:75px;right:16%;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff2bd,#ffd97c 72%);box-shadow:0 0 90px #ffe5a888}
.hero-cloud{position:absolute;width:260px;height:68px;border-radius:60px;background:#fff;opacity:.82;filter:drop-shadow(0 8px 18px #aac6e733)}
.hero-cloud:before,.hero-cloud:after{content:"";position:absolute;bottom:22px;width:100px;height:100px;border-radius:50%;background:inherit}.hero-cloud:before{left:38px}.hero-cloud:after{left:112px;width:78px;height:78px}
:global(.dark) .hero-cloud{background:#38536d;opacity:.75}
.hero-cloud--one{top:188px;right:6%;transform:scale(.72)}.hero-cloud--two{top:360px;left:46%;transform:scale(.48)}
.hero-rainbow{position:absolute;width:min(48vw,560px);right:9%;top:168px;opacity:.9;filter:drop-shadow(0 12px 20px #637caa30);animation:rainbow-drift 7s ease-in-out infinite}.hero-rainbow path{animation:rainbow-flow 14s linear infinite}
.hero-hill{position:absolute;bottom:-230px;width:76vw;height:390px;border-radius:50% 50% 0 0}.hero-hill--back{left:-14%;background:#d2e7f7;transform:rotate(-8deg)}.hero-hill--front{right:-13%;bottom:-285px;background:#bcd9ee;transform:rotate(9deg)}
:global(.dark) .hero-hill--back{background:#1c344a}:global(.dark) .hero-hill--front{background:#172d43}
.hero-spark{position:absolute;color:#fff;font-size:30px}.hero-spark--one{top:30%;left:55%}.hero-spark--two{top:23%;right:34%;color:#f2ad63}
.hero-inner{position:relative;z-index:1;max-width:1180px;min-height:520px;margin:0 auto;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:42px}
.hero-copy{max-width:580px;padding:28px 0}.hero-kicker,.section-kicker{margin:0 0 22px;font-size:12px;font-weight:800;letter-spacing:.13em;color:var(--blue)}.hero-kicker{display:flex;align-items:center;gap:9px;color:#45658e}.status-dot{width:8px;height:8px;border-radius:50%;background:#65b37b;box-shadow:0 0 0 4px #65b37b24}
.hero h1{margin:0;color:#1c3152;font-size:clamp(48px,6.1vw,82px);font-weight:850;line-height:1.08;letter-spacing:-.055em}.hero h1 span{color:#466de6}.hero-description{max-width:435px;margin:25px 0 0;color:#536981;font-size:17px;line-height:1.9}
:global(.dark) .hero h1{color:#f2f6ff}:global(.dark) .hero h1 span{color:#a8b8ff}:global(.dark) .hero-description,:global(.dark) .hero-kicker{color:#c0d0e4}
.hero-actions{display:flex;align-items:center;gap:22px;margin-top:28px}.button{display:inline-flex;align-items:center;gap:14px;text-decoration:none;font-weight:700;font-size:14px;transition:transform .2s,color .2s,background .2s}.button:hover{transform:translateY(-2px)}.button--primary{padding:14px 19px;border-radius:999px;background:#4268e8;color:#fff;box-shadow:0 12px 24px #4268e833}.button--primary:hover{background:#3157d6}.button--text{color:#4b6381}.button--text:hover{color:var(--blue)}
.hero-meta{display:flex;align-items:center;gap:13px;margin-top:28px;color:#6c7c93;font-size:12px}.hero-meta i{width:4px;height:4px;border-radius:50%;background:#a9b9cb}
.hero-art{position:relative;min-height:400px;display:grid;place-items:center;animation:art-float 5s ease-in-out infinite}.hero-note{position:absolute;width:195px;height:238px;padding:20px;border-radius:20px;background:rgba(255,255,255,.9);backdrop-filter:blur(3px);box-shadow:0 28px 70px #5575a52b;display:flex;flex-direction:column;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s}.hero-art:hover .hero-note--back{transform:translate(-116px,-3px) rotate(-13deg)}.hero-art:hover .hero-note--front{transform:translate(46px,24px) rotate(7deg);box-shadow:0 35px 80px #5575a544}.hero-note--back{width:176px;height:215px;padding:16px;transform:translate(-106px,8px) rotate(-10deg);background:rgba(249,251,255,.86);opacity:.72}.hero-note--front{width:195px;height:238px;transform:translate(38px,34px) rotate(4deg);justify-content:space-between}.note-date{font:600 10px var(--font-code);letter-spacing:.13em;color:#8b9bb0}.hero-note strong{font-size:24px;line-height:1.4;letter-spacing:-.04em;color:#243d63}.note-line{height:9px;width:72%;border-radius:99px;background:#e6edf7;margin-top:15px}.note-line--long{width:90%;margin-top:26px}.note-line--short{width:48%}.note-mini{width:max-content;padding:7px 10px;border-radius:8px;font:700 10px var(--font-code);letter-spacing:.06em}.note-mini--green{background:#e4f4e7;color:#568d60}.note-mini--blue{background:#e9efff;color:#5472d0}.art-star{position:absolute;color:#e79c52;font-size:30px;animation:twinkle 2.4s ease-in-out infinite}.art-star--one{top:54px;right:54px}.art-star--two{bottom:45px;left:54px;color:#5c8cd2;animation-delay:.8s}
.rainbow-edit-button{position:absolute;right:7%;bottom:8px;z-index:3;display:flex;align-items:center;gap:9px;padding:11px 15px;border:1px solid #ffffffc9;border-radius:999px;background:linear-gradient(120deg,#fffdf6f2,#fff9eaf2);color:#345171;font:750 12px var(--font-body);box-shadow:0 9px 24px #34527224;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s}.rainbow-edit-button:hover{transform:translateY(-2px);border-color:#f2c66c;box-shadow:0 13px 28px #34527232}.rainbow-edit-button svg{width:25px;height:16px;overflow:visible}.rainbow-edit-button path{fill:none;stroke-width:2.5;stroke-linecap:round}.rainbow-edit-button span{color:#345171;font-size:12px}.rainbow-edit-button b{margin-left:3px;color:#d89a38;font:600 14px var(--font-body)}
.rainbow-editor{position:absolute;top:8px;right:0;z-index:5;width:min(326px,90vw);padding:19px;border:1px solid #fff;border-radius:22px;background:linear-gradient(145deg,rgba(255,254,249,.98),rgba(249,252,255,.97));color:#243d63;box-shadow:0 24px 64px #253b5a36,0 2px 8px #253b5a0a;backdrop-filter:blur(18px);text-align:left;animation:editor-pop .24s cubic-bezier(.2,.8,.2,1)}.editor-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}.editor-kicker{font:750 9px var(--font-code);letter-spacing:.16em;color:#d29a3c}.editor-heading h2{margin:5px 0 0;font-size:21px;letter-spacing:-.04em;color:#263b59}.editor-heading p{margin:5px 0 0;color:#8290a4;font-size:10px}.editor-close{flex:0 0 auto;width:29px;height:29px;border:1px solid #e8edf4;border-radius:50%;background:#fff;color:#61728a;font-size:19px;line-height:1;cursor:pointer;transition:background .2s,transform .2s}.editor-close:hover{transform:rotate(90deg);background:#f1f5fb}.editor-control{margin:16px 0;color:#536981;font-size:11px;font-weight:700}.editor-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.editor-label>b{color:#7183a2;font:650 10px var(--font-code)}.editor-choices{display:grid;gap:7px}.editor-choices--density,.editor-choices--speed{grid-template-columns:repeat(3,minmax(0,1fr))}.editor-choices--rows{grid-template-columns:repeat(3,minmax(0,1fr))}.editor-choice{min-width:0;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:7px 5px;border:1px solid #e7ecf3;border-radius:12px;background:rgba(255,255,255,.72);color:#718096;font:700 10px var(--font-body);cursor:pointer;transition:transform .18s,border-color .18s,background .18s,color .18s,box-shadow .18s}.editor-choice:hover{transform:translateY(-2px);border-color:#c8d4ee;background:#fff;color:#3d5d9e}.editor-choice.is-selected{border-color:#748bd8;background:linear-gradient(145deg,#f1f4ff,#fff);color:#3d58a5;box-shadow:inset 0 0 0 1px #748bd81c,0 4px 10px #6075b218}.density-sample{display:block;width:43px;height:7px;border-radius:8px}.density-sample--sparse{background:repeating-linear-gradient(90deg,#ef7476 0 8px,transparent 8px 19px)}.density-sample--balanced{background:repeating-linear-gradient(90deg,#ef7476 0 7px,transparent 7px 13px)}.density-sample--dense{background:repeating-linear-gradient(90deg,#ef7476 0 6px,transparent 6px 9px)}.row-sample{height:22px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;transform:rotate(-8deg)}.row-sample i{display:block;width:22px;height:4px;border-top:2px solid #ef7476;border-radius:50% 50% 0 0}.row-sample i:nth-child(2n){width:17px;border-color:#efb44f}.row-sample i:nth-child(3n){width:12px;border-color:#72ad84}.row-sample i:nth-child(4n){width:8px;border-color:#7784db}.speed-glyph{height:20px;color:#d49a42;font:500 19px/18px var(--font-body)}.editor-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:17px;padding-top:12px;border-top:1px solid #e8edf4;color:#8797aa;font-size:9px}.editor-footer>span{display:flex;align-items:center;gap:6px}.editor-footer>span i{width:6px;height:6px;border-radius:50%;background:#72b18c;box-shadow:0 0 0 3px #72b18c1c}.editor-footer button{padding:7px 10px;border:0;border-radius:999px;background:#f1f3fa;color:#6475a9;font:700 10px var(--font-body);cursor:pointer;transition:background .2s,color .2s}.editor-footer button:hover{background:#e8ecfa;color:#435caa}.editor-footer button b{margin-left:3px;font-size:13px}
.hero-scroll{position:absolute;bottom:20px;left:50%;display:flex;align-items:center;gap:10px;transform:translateX(-50%);color:#627894;text-decoration:none;font-size:11px;letter-spacing:.08em}.hero-scroll span{height:25px;width:15px;border:1px solid #8298b4;border-radius:12px;position:relative}.hero-scroll span:after{content:"";position:absolute;top:5px;left:5px;width:3px;height:5px;border-radius:4px;background:#8298b4}
@keyframes rainbow-flow{to{stroke-dashoffset:var(--rainbow-dash-offset)}}@keyframes rainbow-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes art-float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-8px) rotate(.5deg)}}@keyframes twinkle{0%,100%{opacity:.55;transform:scale(.88) rotate(-8deg)}50%{opacity:1;transform:scale(1.12) rotate(8deg)}}@keyframes editor-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.section{padding:104px 32px}.section-inner{max-width:1120px;margin:0 auto}.articles-section{background:var(--paper)}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:34px}.section-kicker{margin-bottom:13px}.section-kicker span{color:#9aa8ba;font:600 10px var(--font-code);letter-spacing:.08em}.section h2,.topics-intro h2,.about-inner h2{margin:0;color:var(--ink);font-size:clamp(30px,4vw,45px);line-height:1.18;letter-spacing:-.045em}.text-link{display:inline-flex;align-items:center;gap:9px;color:var(--muted);font-size:13px;font-weight:700;text-decoration:none;transition:color .2s}.text-link:hover{color:var(--blue)}
.article-filters{display:flex;flex-wrap:wrap;gap:9px;margin:-8px 0 24px}.article-filters button{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);font:700 12px var(--font-body);cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .2s}.article-filters button:hover{transform:translateY(-2px);border-color:#aebff0;color:var(--blue)}.article-filters button.is-active{border-color:#4268e8;background:#4268e8;color:white}.article-filters button span{font:600 10px var(--font-code);opacity:.72}.article-more-row{display:flex;justify-content:center;margin-top:28px}.article-more{padding:12px 18px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--blue);font:700 13px var(--font-body);cursor:pointer;transition:background .2s,transform .2s}.article-more:hover{transform:translateY(-2px);background:#edf2ff}.article-empty{padding:30px;color:var(--muted);text-align:center}
.article-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.article-card{min-height:235px;border:1px solid var(--line);border-radius:18px;background:#fff;padding:24px;transition:transform .25s,box-shadow .25s,border-color .25s}.article-card:hover{transform:translateY(-5px);border-color:#cbd8f6;box-shadow:0 18px 40px #3c5b8d12}.article-card-link{position:relative;display:flex;min-height:185px;flex-direction:column;text-decoration:none;color:inherit}.article-card-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.article-category{padding:5px 10px;border-radius:999px;background:#edf2ff;color:#4b69cf;font-size:10px;font-weight:800;letter-spacing:.04em}.article-date{color:#97a4b5;font-size:11px}.article-number{position:absolute;top:36px;right:0;color:#edf1f7;font:700 34px var(--font-code)}.article-card h3{position:relative;max-width:85%;margin:24px 0 9px;color:var(--ink);font-size:19px;line-height:1.4;letter-spacing:-.02em}.article-card p{max-width:95%;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:0;color:var(--muted);font-size:13px;line-height:1.7}.card-arrow{position:absolute;right:0;bottom:0;color:#a5b1c0;font-size:18px;transition:transform .2s,color .2s}.article-card:hover .card-arrow{transform:translate(3px,-3px);color:var(--blue)}
:global(.dark) .article-card{background:#182438}:global(.dark) .article-card:hover{border-color:#42557b;box-shadow:0 18px 40px #03081155}:global(.dark) .article-number{color:#26344a}:global(.dark) .article-category{background:#28375a;color:#b5c4ff}
.topics-section{background:#f1f6fb}.topics-layout{display:grid;grid-template-columns:.78fr 1.22fr;gap:66px;align-items:center}.topics-intro>p:not(.section-kicker){max-width:330px;margin:18px 0 22px;color:var(--muted);font-size:14px;line-height:1.8}.topic-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.topic-card{--topic-accent:#4268e8;position:relative;min-height:205px;padding:22px;border-radius:17px;background:#fff;text-decoration:none;color:var(--ink);box-shadow:0 7px 24px #344c6810;transition:transform .22s,box-shadow .22s}.topic-card:hover{transform:translateY(-4px);box-shadow:0 15px 30px #344c681c}.topic-index{position:absolute;top:19px;right:20px;color:#a9b7c8;font:600 10px var(--font-code)}.topic-icon{display:grid;place-items:center;width:37px;height:37px;border-radius:12px;background:color-mix(in srgb,var(--topic-accent) 12%,white);color:var(--topic-accent);font-size:19px}.topic-card h3{margin:17px 0 4px;font-size:20px}.topic-card p{margin:0;color:var(--muted);font-size:12px}.topic-count{display:flex;align-items:center;justify-content:space-between;margin-top:18px;color:var(--topic-accent);font-size:11px;font-weight:700}.topic-count b{font-size:15px;transition:transform .2s}.topic-card:hover .topic-count b{transform:translate(2px,-2px)}
:global(.dark) .topics-section{background:#152235}:global(.dark) .topic-card{background:#1c2a40}:global(.dark) .topic-icon{background:color-mix(in srgb,var(--topic-accent) 18%,#1c2a40)}
.about-section{padding:90px 32px;background:#ffedcc}.about-inner{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 258px;align-items:center;gap:54px}.about-copy>p:last-of-type{max-width:600px;margin:15px 0 0;color:#776747;font-size:14px;line-height:1.85}.about-project-link{display:inline-flex;align-items:center;gap:9px;margin-top:19px;color:#936a32;font-size:12px;font-weight:750;text-decoration:none;transition:gap .2s,color .2s}.about-project-link:hover{gap:13px;color:#6d4a1f}.about-profile{display:flex;align-items:center;gap:13px;min-width:0;padding:18px 16px;border:1px solid #e5ca98;border-radius:20px;background:#fff8e9;color:#5f4827;text-decoration:none;box-shadow:0 10px 28px #9a70211a;transition:transform .22s,box-shadow .22s,border-color .22s}.about-profile:hover{transform:translateY(-3px);border-color:#d7b66e;box-shadow:0 15px 32px #9a70212a}.profile-avatar{display:grid;place-items:center;flex:0 0 46px;width:46px;height:46px;border-radius:15px;background:#f5dfa9;color:#9d6d23;font:800 20px var(--font-code);box-shadow:inset 0 0 0 1px #e9d095}.profile-copy{display:grid;min-width:0;gap:3px}.profile-label{color:#a17b42;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.profile-copy strong{color:#563f20;font-size:15px}.profile-handle{color:#977d58;font:500 10px var(--font-code)}.profile-arrow{align-self:flex-start;margin-left:auto;color:#9c783e;font-size:17px;transition:transform .2s}.about-profile:hover .profile-arrow{transform:translate(2px,-2px)}
:global(.dark) .about-section{background:#2d2b2a}:global(.dark) .about-copy>p:last-of-type{color:#d0c1a8}:global(.dark) .about-project-link,:global(.dark) .profile-arrow{color:#f3c77f}:global(.dark) .about-project-link:hover{color:#ffe2a6}:global(.dark) .about-profile{border-color:#65543c;background:#39352e;box-shadow:0 10px 28px #09080735}:global(.dark) .about-profile:hover{border-color:#92774d}:global(.dark) .profile-avatar{background:#4b4030;color:#f3c77f;box-shadow:inset 0 0 0 1px #756248}:global(.dark) .profile-label{color:#c3a66e}:global(.dark) .profile-copy strong{color:#f4dfb4}:global(.dark) .profile-handle{color:#c8b995}
.home-footer{max-width:1180px;margin:auto;padding:26px 30px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--muted);font-size:11px}.home-footer b{color:#e7a448}.home-footer a{color:var(--muted);text-decoration:none}.home-footer a:hover{color:var(--blue)}
@media(max-width:800px){.hero{min-height:760px;padding:104px 24px 70px}.hero-inner{grid-template-columns:1fr;gap:0;min-height:610px}.hero-copy{padding:34px 0 0}.hero h1{font-size:clamp(46px,10vw,70px)}.hero-art{min-height:310px}.hero-note--back{width:150px;height:184px;padding:14px;transform:translate(-82px,-2px) rotate(-10deg)}.hero-note--front{width:172px;height:210px;padding:17px;transform:translate(25px,22px) rotate(4deg)}.hero-art:hover .hero-note--back{transform:translate(-91px,-8px) rotate(-13deg)}.hero-art:hover .hero-note--front{transform:translate(32px,16px) rotate(7deg)}.hero-note strong{font-size:21px}.hero-rainbow{width:70vw;right:-10%;top:250px}.hero-sun{right:-3%;top:90px}.section{padding:78px 24px}.topics-layout{grid-template-columns:1fr;gap:34px}.topic-card{min-height:190px}.about-section{padding:68px 24px}.about-inner{grid-template-columns:1fr;gap:24px}.about-profile{width:min(100%,310px)}.hero-scroll{bottom:18px}}
@media(max-width:520px){.hero{min-height:785px;padding-inline:20px}.hero-inner{min-height:650px}.hero-kicker{font-size:10px}.hero-description{font-size:15px}.hero-actions{gap:15px}.button{font-size:12px}.button--primary{padding:13px 15px}.hero-meta{gap:8px;font-size:10px}.hero-art{min-height:290px}.hero-note--back{width:132px;height:166px;padding:12px;transform:translate(-72px,-2px) rotate(-10deg)}.hero-note--front{width:158px;height:194px;padding:15px;transform:translate(19px,18px) rotate(4deg)}.hero-art:hover .hero-note--back{transform:translate(-80px,-7px) rotate(-12deg)}.hero-art:hover .hero-note--front{transform:translate(25px,13px) rotate(7deg)}.hero-note strong{font-size:19px}.hero-rainbow{width:98vw;right:-20%;top:276px}.section{padding:66px 20px}.section-heading{align-items:start;flex-direction:column}.article-grid{grid-template-columns:1fr;gap:12px}.article-card{min-height:210px;padding:20px}.article-card-link{min-height:168px}.article-card h3{font-size:18px}.topic-grid{gap:10px}.topic-card{min-height:173px;padding:16px}.topic-card h3{font-size:17px}.topic-card p{font-size:10px}.topic-count{font-size:10px}.about-section{padding:58px 20px}.about-inner{grid-template-columns:1fr;align-items:start;gap:21px}.about-profile{width:100%;padding:16px}.home-footer{padding:22px 20px;flex-wrap:wrap}.home-footer span:nth-child(2){display:none}}
@media(prefers-reduced-motion:reduce){.home-root *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
</style>
