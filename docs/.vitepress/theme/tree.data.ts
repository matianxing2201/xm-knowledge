import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export interface TreeNode {
  name: string
  path: string
  href?: string
  children?: TreeNode[]
}

export interface DomainTree {
  name: string
  icon: string
  accent: string
  children: TreeNode[]
}

const DOMAIN_META: Record<string, { icon: string; accent: string }> = {
  ai: { icon: 'ri:robot-line', accent: 'var(--color-ai)' },
  java: { icon: 'mdi:coffee', accent: 'var(--color-java)' },
  go: { icon: 'mdi:language-go', accent: 'var(--color-go)' },
  web: { icon: 'mdi:web', accent: 'var(--color-web)' },
}

const EXCLUDED_DIRS = new Set([
  '.vitepress',
  'public',
  'superpowers',
  'spec',
  'adr',
])

const EXCLUDED_FILES = new Set(['index.md', 'tags.md', 'archive.md'])

function scan(dir: string, basePath: string): TreeNode[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const children: TreeNode[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(dir, entry.name)
      const relPath = basePath + '/' + entry.name
      const subChildren = scan(subPath, relPath)
      children.push({
        name: entry.name,
        path: relPath,
        href: relPath + '/',
        children: subChildren.length ? subChildren : undefined,
      })
    } else if (entry.isFile() && entry.name.endsWith('.md') && !EXCLUDED_FILES.has(entry.name)) {
      const name = entry.name.replace(/\.md$/, '')
      const relPath = basePath + '/' + name
      children.push({
        name,
        path: relPath,
        href: relPath + '.html',
      })
    }
  }

  return children
    .sort((a, b) => {
      const aIsDir = a.children ? -1 : 1
      const bIsDir = b.children ? -1 : 1
      if (aIsDir !== bIsDir) return aIsDir - bIsDir
      return a.name.localeCompare(b.name)
    })
}

export default {
  async load() {
    const docsRoot = path.resolve(__dirname, '../../')
    const domains: DomainTree[] = []

    for (const dir of readdirSync(docsRoot, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue
      const key = dir.name.toLowerCase()
      if (EXCLUDED_DIRS.has(key) || !DOMAIN_META[key]) continue

      const fullPath = path.join(docsRoot, dir.name)
      const meta = DOMAIN_META[key]
      domains.push({
        name: key.toUpperCase() === 'AI' ? 'AI' : key.charAt(0).toUpperCase() + key.slice(1),
        icon: meta.icon,
        accent: meta.accent,
        children: scan(fullPath, '/' + dir.name),
      })
    }

    return domains
  },
}
