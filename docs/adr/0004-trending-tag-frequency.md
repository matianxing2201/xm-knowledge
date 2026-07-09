# Trending Defined As Tag-Frequency Wall, Not View-Count

The homepage "Hot" tab surfaces notes by tag frequency — a tag-frequency wall where frequently-used tags appear larger and link to their matching notes — instead of a view-count trending list.

Rationale: the project's page-view signal comes from busuanzi, an external client-side script loaded in `config.mts`. busuanzi stats are not available at SSG build time, so a view-count-driven trending section would render blank at first paint and only populate after hydration. Tag frequency is computed from `p.tags` already in the loader, is fully static, and renders identically at build and on the client.

Rejected: view-count trending (better semantic fit for "popular" but SSG-incompatible); recent-activity ranking (overlaps with Recent tab); composite scoring (over-engineered for current content volume).

This is hard to reverse without re-architecting the busuanzi data flow.