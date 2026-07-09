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
  recentPosts: Post[]
  tagCount: number
}

const DOMAIN_META: Omit<DomainStat, 'articleCount' | 'lastUpdated' | 'hotTags'>[] = [
  { name: 'AI',   icon: 'ri:robot-line',       link: '/ai/',   accent: '#10A37F', desc: 'LangChain · Agent · LLM' },
  { name: 'Java', icon: 'mdi:coffee',           link: '/java/', accent: '#ED8B00', desc: 'Spring · JVM · 并发' },
  { name: 'Go',   icon: 'mdi:language-go',      link: '/go/',   accent: '#00ADD8', desc: 'Goroutine · Channel · Web' },
  { name: 'Web',  icon: 'mdi:web',              link: '/web/',  accent: '#3B82F6', desc: 'Vue · React · TypeScript' },
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
      const sorted = [...domainPosts].sort((a, b) => {
        const aDate = a.lastUpdated || a.date
        const bDate = b.lastUpdated || b.date
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
      const tagSet = new Set<string>()
      for (const p of domainPosts) {
        for (const t of p.tags) tagSet.add(t)
      }

      return {
        ...meta,
        articleCount: domainPosts.length,
        lastUpdated: sorted[0]?.lastUpdated || sorted[0]?.date || 'N/A',
        hotTags: topTags(domainPosts),
        recentPosts: sorted.slice(0, 3),
        tagCount: tagSet.size,
      }
    })
  )
}