import { computed } from 'vue'
import { useArticles } from './useArticles'

export interface CurrentTopic {
  name: string
  desc: string
  progress: number | null
  status: 'active' | 'exploring'
  category: string
  url: string
}

export function useCurrentTopics(limit = 4) {
  const all = useArticles()

  return computed<CurrentTopic[]>(() => {
    const sorted = [...all.value].sort((a, b) => {
      const aDate = a.lastUpdated || a.date
      const bDate = b.lastUpdated || b.date
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    return sorted.slice(0, limit).map((post, i) => ({
      name: post.title,
      desc: post.excerpt || `${post.category} · ${post.readingTime} min read`,
      progress: i === 0 ? null : [67, 40, 25][(i - 1) % 3] ?? null,
      status: (i === 0 ? 'active' : 'exploring') as 'active' | 'exploring',
      category: post.category,
      url: post.url,
    }))
  })
}
