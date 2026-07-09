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
    const categorySet = new Set<string>()
    let totalWords = 0
    let totalReadingTime = 0
    let latest = ''

    for (const p of posts) {
      for (const t of p.tags) tagSet.add(t)
      if (p.category) categorySet.add(p.category)
      totalWords += p.words || 0
      totalReadingTime += p.readingTime || 0
      const updateDate = p.lastUpdated || p.date
      if (updateDate && (!latest || updateDate > latest)) latest = updateDate
    }

    return {
      articles: posts.length,
      categories: categorySet.size || 4,
      tags: tagSet.size,
      words: totalWords,
      readingTime: totalReadingTime,
      lastUpdate: latest || 'N/A',
    }
  })
}