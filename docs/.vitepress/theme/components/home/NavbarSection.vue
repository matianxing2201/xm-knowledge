<script setup lang="ts">
import { ref } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const mobileOpen = ref(false)

const links = [
  { label: '文章', href: '#articles' },
  { label: '项目', href: '#projects' },
  { label: '关于', href: '#about' },
]

function openSearch() {
  window.dispatchEvent(new CustomEvent('xm:open-search'))
}
</script>

<template>
  <header class="site-header">
    <nav class="nav-inner" aria-label="主导航">
      <a href="/" class="brand" aria-label="XM Knowledge 首页"><span class="brand-mark">X</span><span>XM<span class="brand-dot">.</span></span></a>

      <div class="desktop-links">
        <a v-for="link in links" :key="link.label" :href="link.href">{{ link.label }}</a>
      </div>

      <div class="nav-actions">
        <button class="icon-button search-button" type="button" aria-label="搜索文章" @click="openSearch">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.2 4.2"/></svg>
          <span>搜索</span>
        </button>
        <button class="icon-button theme-button" type="button" :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'" @click="isDark = !isDark">
          <svg v-if="isDark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="3.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.1 15.1A8.6 8.6 0 0 1 8.9 3.9 8.8 8.8 0 1 0 20.1 15.1Z"/></svg>
        </button>
        <button class="icon-button menu-button" type="button" :aria-expanded="mobileOpen" :aria-label="mobileOpen ? '关闭导航菜单' : '打开导航菜单'" @click="mobileOpen = !mobileOpen">
          <svg v-if="!mobileOpen" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </nav>

    <div v-if="mobileOpen" class="mobile-menu">
      <a v-for="link in links" :key="link.label" :href="link.href" @click="mobileOpen = false">{{ link.label }}<span aria-hidden="true">↗</span></a>
    </div>
  </header>
</template>

<style scoped>
.site-header{position:fixed;z-index:40;inset:0 0 auto;height:72px;padding:0 28px;border-bottom:1px solid #dce7f2;background:color-mix(in srgb,#fff 82%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#304969}
:global(.dark) .site-header{border-color:#34445a;background:color-mix(in srgb,#101928 82%,transparent);color:#d9e5f7}
.nav-inner{height:100%;max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:26px}.brand{display:flex;align-items:center;gap:9px;color:inherit;text-decoration:none;font-size:15px;font-weight:850;letter-spacing:-.04em}.brand-mark{display:grid;place-items:center;width:29px;height:29px;border-radius:10px;background:#4268e8;color:#fff;font:800 13px var(--font-code);transform:rotate(-7deg)}.brand-dot{color:#4268e8}
.desktop-links{display:flex;align-items:center;gap:38px;margin-left:auto;margin-right:32px}.desktop-links a,.mobile-menu a{color:inherit;text-decoration:none;font-size:13px;font-weight:700;transition:color .18s}.desktop-links a:hover,.mobile-menu a:hover{color:#4268e8}
.nav-actions{display:flex;align-items:center;gap:9px}.icon-button{display:flex;align-items:center;justify-content:center;gap:7px;min-width:38px;height:38px;padding:0 10px;border:1px solid transparent;border-radius:999px;background:transparent;color:inherit;cursor:pointer;transition:background .18s,border-color .18s,color .18s}.icon-button:hover{border-color:#d7e1ef;background:#f3f7fc;color:#4268e8}.icon-button svg{width:18px;height:18px;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.search-button span{font-size:12px;font-weight:700}.menu-button{display:none}
:global(.dark) .icon-button:hover{border-color:#41526b;background:#213049;color:#a8b8ff}
.mobile-menu{display:none}
@media(max-width:680px){.site-header{height:64px;padding:0 18px}.desktop-links{display:none}.nav-inner{gap:12px}.nav-actions{margin-left:auto}.menu-button{display:flex}.mobile-menu{position:absolute;top:63px;left:0;right:0;display:flex;flex-direction:column;padding:8px 20px 16px;border-bottom:1px solid #dce7f2;background:var(--paper);box-shadow:0 16px 28px #263f5c12}.mobile-menu a{display:flex;justify-content:space-between;padding:14px 4px;border-bottom:1px solid var(--line)}.mobile-menu a:last-child{border:0}.search-button span{display:none}}
</style>
