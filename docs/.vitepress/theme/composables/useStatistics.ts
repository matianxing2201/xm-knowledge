import { computed } from 'vue'
import { useArticles } from './useArticles'

export interface SiteStatistics {
  articles: number
  categories: number
  tags: number
  words: number
  readingTime: number
  lastUpdate: string
}

export function useStatistics() {
  const all = useArticles()

  return computed<SiteStatistics>(() => {
    const posts = all.value
    const tagSet = new Set<string>()
    let totalWords = 0
    let totalReadingTime = 0
    let latest = ''

    for (const p of posts) {
      for (const t of p.tags) tagSet.add(t)
      totalWords += p.words
      totalReadingTime += p.readingTime
      if (!latest || p.lastUpdated > latest) latest = p.lastUpdated
    }

    return {
      articles: posts.length,
      categories: 4,
      tags: tagSet.size,
      words: totalWords,
      readingTime: totalReadingTime,
      lastUpdate: latest || 'N/A',
    }
  })
}
