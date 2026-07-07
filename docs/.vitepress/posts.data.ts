import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

interface Post {
  title: string
  date: string
  tags: string[]
  url: string
}

const docsDir = resolve(__dirname, '..')

function collectPosts(dir: string): Post[] {
  const posts: Post[] = []
  const items = readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = resolve(dir, item.name)

    if (item.isDirectory() && !item.name.startsWith('.')) {
      posts.push(...collectPosts(fullPath))
    } else if (item.isFile() && item.name.endsWith('.md') && !item.name.startsWith('index.md')) {
      try {
        const content = readFileSync(fullPath, 'utf-8')
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)

        if (fmMatch) {
          const frontmatter = fmMatch[1]
          const title = frontmatter.match(/title:\s*(.+)/)?.[1].replace(/['"]/g, '') || ''
          const date = frontmatter.match(/date:\s*(.+)/)?.[1].replace(/['"]/g, '') || ''
          const tagsMatch = frontmatter.match(/tags:\s*(\[[^\]]*\]|".*?")/)
          const tags: string[] = tagsMatch
            ? JSON.parse(tagsMatch[1])
            : []

          if (title && date) {
            let url = relative(docsDir, fullPath)
              .replace(/\\/g, '/')
              .replace(/\.md$/, '')
            if (!url.startsWith('/')) {
              url = '/' + url
            }
            if (!url.endsWith('/')) {
              url += '/'
            }

            posts.push({ title, date, tags, url })
          }
        }
      } catch {
        continue
      }
    }
  }

  return posts
}

export const data = collectPosts(docsDir)
