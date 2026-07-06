import { createContentLoader } from 'vitepress'

export default createContentLoader('**/*.md', {
  excerpt: false,
  transform(rawData) {
    return rawData
      .map((page) => ({
        title: page.frontmatter.title || page.frontmatter.$title,
        date: page.frontmatter.date,
        tags: page.frontmatter.tags || [],
        category: page.frontmatter.category || '',
        url: page.url,
      }))
      .filter((post) => post.date && post.title)
  },
})
