import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  date: string
  lastUpdated: string
  tags: string[]
  url: string
  category: 'AI' | 'Java' | 'Go' | 'Web'
  words: number
  readingTime: number
}

const CATEGORY_MAP: Record<string, Post['category']> = {
  ai: 'AI',
  java: 'Java',
  go: 'Go',
  web: 'Web',
}

function stripFrontmatter(src: string): string {
  return src.replace(/^---[\s\S]*?---/, '')
}

function countWords(text: string): number {
  return text.replace(/\s+/g, '').length
}

export default createContentLoader('**/*.md', {
  excerpt: false,
  srcExclude: ['**/superpowers/**'],
  transform(rawData): Post[] {
    return rawData
      .map((page) => {
        const content = stripFrontmatter(page.src || '')
        const seg = (page.url || '').split('/').filter(Boolean)[0]
        const category = CATEGORY_MAP[seg?.toLowerCase()] || ''

        const words = countWords(content)

        return {
          title: (page.frontmatter.title as string) || '',
          date: (page.frontmatter.date as string) || '',
          lastUpdated: (page.frontmatter.lastUpdated as string) || (page.frontmatter.date as string) || '',
          tags: (page.frontmatter.tags as string[]) || [],
          url: page.url,
          category: category as Post['category'],
          words,
          readingTime: Math.ceil(words / 300),
        }
      })
      .filter((post): post is Post =>
        post.date !== '' && post.title !== '' && post.category !== ''
      )
  },
})
