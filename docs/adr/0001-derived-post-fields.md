# Article Loader Extends Post with Derived Category, Words, ReadingTime, LastUpdated

The homepage (statistics, domain counts, hot tags, heatmap, data-driven knowledge graph) all need richer fields than the loader currently yields. We extend `Post` to `{ title, date, tags, url, category, words, readingTime, lastUpdated }`, deriving each field at build time so existing notes need no frontmatter migration.

- `category` is derived from the first path segment (`/ai/...` → `AI`).
- `words` counts CJK characters + non-CJK words after stripping frontmatter and code fences.
- `readingTime` blends CJK 300 chars/min and EN 220 words/min.
- `lastUpdated` comes from `git log -1 --format=%cI` at build time — reusing the pattern already proven by `enrich-tree-dates.ts` for the sidebar.

Rejected alternative: requiring each note's frontmatter to declare these fields. Higher migration cost across dozens of existing notes and error-prone. Reusing path-segment derivation + git metadata keeps the system self-maintaining.