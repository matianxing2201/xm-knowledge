import { computed } from 'vue'
import { useArticles } from './useArticles'
import type { Post } from '../posts.data.ts'

export interface HeatmapCell {
  date: string
  count: number
  posts: Post[]
  level: 0 | 1 | 2 | 3 | 4
}

export function useHeatmap() {
  const all = useArticles()

  return computed<HeatmapCell[]>(() => {
    const posts = all.value
    const map = new Map<string, { date: string; count: number; posts: Post[] }>()

    for (const p of posts) {
      const dateKey = p.date
      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, count: 0, posts: [] })
      }
      const entry = map.get(dateKey)!
      entry.count++
      entry.posts.push(p)
    }

    const today = new Date()
    const cells: HeatmapCell[] = []
    const weeks = 53
    const totalDays = weeks * 7

    const startDay = new Date(today)
    startDay.setDate(startDay.getDate() - totalDays + 1)
    startDay.setHours(0, 0, 0, 0)
    const dayOfWeek = startDay.getDay()
    startDay.setDate(startDay.getDate() - dayOfWeek)

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDay)
      d.setDate(d.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateKey = `${y}-${m}-${day}`

      const entry = map.get(dateKey)
      const count = entry?.count || 0

      let level: 0 | 1 | 2 | 3 | 4 = 0
      if (count >= 4) level = 4
      else if (count >= 3) level = 3
      else if (count >= 2) level = 2
      else if (count >= 1) level = 1

      cells.push({
        date: dateKey,
        count,
        posts: entry?.posts || [],
        level,
      })
    }

    return cells
  })
}

export function useStreak() {
  const all = useArticles()

  return computed<number>(() => {
    const posts = all.value
    const dates = new Set<string>()
    for (const p of posts) {
      dates.add(p.date)
      if (p.lastUpdated) dates.add(p.lastUpdated.slice(0, 10))
    }

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const check = new Date(today)
    while (true) {
      const y = check.getFullYear()
      const m = String(check.getMonth() + 1).padStart(2, '0')
      const d = String(check.getDate()).padStart(2, '0')
      const key = `${y}-${m}-${d}`
      if (dates.has(key)) {
        streak++
        check.setDate(check.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  })
}

export function useTagFrequency() {
  const all = useArticles()

  return computed<{ tag: string; count: number }[]>(() => {
    const counts = new Map<string, number>()
    for (const p of all.value) {
      for (const t of p.tags) {
        counts.set(t, (counts.get(t) || 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  })
}