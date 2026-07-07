import { computed } from 'vue'
import { useArticles } from './useArticles'
import type { Post } from '../posts.data.ts'

export interface DomainStat {
  name: 'AI' | 'Java' | 'Go' | 'Web'
  icon: string
  link: string
  accent: string
  desc: string
  articleCount: number
  lastUpdated: string
  hotTags: string[]
}

const DOMAIN_META: Omit<DomainStat, 'articleCount' | 'lastUpdated' | 'hotTags'>[] = [
  { name: 'AI',   icon: 'ri:robot-line',       link: '/ai/',   accent: '#10a37f', desc: 'LangChain · Agent · LLM' },
  { name: 'Java', icon: 'mdi:coffee',           link: '/java/', accent: '#f89820', desc: 'Spring · JVM · 并发' },
  { name: 'Go',   icon: 'mdi:language-go',      link: '/go/',   accent: '#00ADD8', desc: 'Goroutine · Channel · Web' },
  { name: 'Web',  icon: 'mdi:web',              link: '/web/',  accent: '#3b82f6', desc: 'Vue · React · TypeScript' },
]

function topTags(posts: Post[], limit = 3): string[] {
  const counts = new Map<string, number>()
  for (const p of posts) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

export function useDomains() {
  const all = useArticles()

  return computed<DomainStat[]>(() =>
    DOMAIN_META.map((meta) => {
      const domainPosts = all.value.filter((p) => p.category === meta.name)
      const sorted = domainPosts.sort((a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      return {
        ...meta,
        articleCount: domainPosts.length,
        lastUpdated: sorted[0]?.lastUpdated || 'N/A',
        hotTags: topTags(domainPosts),
      }
    })
  )
}
