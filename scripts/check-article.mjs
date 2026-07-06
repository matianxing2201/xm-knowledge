#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

function checkArticle(filePath) {
  const errors = []
  const warnings = []

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  // 1. Check H1 unique
  const h1Lines = lines.filter((line) => /^# [^#]/.test(line.trim()))
  if (h1Lines.length === 0) {
    errors.push('Missing H1 heading')
  } else if (h1Lines.length > 1) {
    errors.push(`Multiple H1 headings found (${h1Lines.length})`)
  }

  // 2. Check no H5 or H6
  const h5h6 = lines.filter((line) => /^#{5,6} /.test(line.trim()))
  if (h5h6.length > 0) {
    errors.push(`H5/H6 headings found: ${h5h6.length} (max H4 allowed)`)
  }

  // 3. Check Frontmatter
  if (!content.startsWith('---')) {
    errors.push('Missing frontmatter')
  } else {
    const fmEnd = content.indexOf('---', 3)
    if (fmEnd === -1) {
      errors.push('Unclosed frontmatter (missing closing ---)')
    } else {
      const fm = content.slice(3, fmEnd)
      if (!fm.includes('title:')) {
        errors.push('Frontmatter missing "title"')
      }
      if (!fm.includes('tags:') && !fm.includes('tags: []')) {
        warnings.push('Frontmatter missing "tags"')
      }
      if (!fm.includes('date:')) {
        warnings.push('Frontmatter missing "date"')
      }
    }
  }

  // 4. Check code blocks have language
  const codeBlockOpens = lines.filter((line) => /^```/.test(line.trim()))
  const unlabeled = codeBlockOpens.filter((line) => /^```\s*$/.test(line.trim()))
  if (unlabeled.length > 0) {
    errors.push(`Code blocks without language: ${unlabeled.length}`)
  }

  // 5. Check image paths
  const imgRefs = content.match(/!\[.*?\]\((.*?)\)/g) || []
  for (const ref of imgRefs) {
    const match = ref.match(/!\[.*?\]\((.*?)\)/)
    if (match) {
      const src = match[1]
      if (src.startsWith('http')) {
        warnings.push(`External image URL: ${src}`)
      }
    }
  }

  // Output results
  const fileName = filePath.split('/').pop()
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✅ ${fileName} — all checks passed`)
  } else {
    if (errors.length > 0) {
      console.log(`❌ ${fileName} — ${errors.length} error(s):`)
      errors.forEach((e) => console.log(`   ERROR: ${e}`))
    }
    if (warnings.length > 0) {
      console.log(`⚠️  ${fileName} — ${warnings.length} warning(s):`)
      warnings.forEach((w) => console.log(`   WARN: ${w}`))
    }
  }

  return errors.length === 0
}

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/check-article.mjs <file.md>')
  process.exit(1)
}

const passed = checkArticle(resolve(process.cwd(), file))
process.exit(passed ? 0 : 1)
