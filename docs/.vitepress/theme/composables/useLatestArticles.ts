import { computed } from 'vue'
import { data as posts } from '../posts.data.ts'
import type { Post } from '../posts.data.ts'

export function useLatestArticles(n = 6) {
  return computed<Post[]>(() =>
    [...posts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, n)
  )
}
