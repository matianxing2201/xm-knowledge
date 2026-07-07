import { computed } from 'vue'
import { data as posts } from '../posts.data.ts'
import type { Post } from '../posts.data.ts'

export function useArticles() {
  return computed<Post[]>(() => posts)
}
