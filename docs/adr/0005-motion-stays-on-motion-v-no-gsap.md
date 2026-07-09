# Animation Stays On motion-v, No GSAP; Four-Fold Motion Language

The homepage motion system stays on motion-v + Lenis (both already installed). GSAP — referenced in `docs/spec/01-homepage-design.md` and `07-ai-context.md` as intended — will NOT be added. All effects land in the four-fold language: type-mask reveal on Hero H1, word-stagger on tagline, three scroll-linked scenes (Hero title layering, Stats charge-up, Domain Bento 3D flip-in) via motion-v `useScroll` already enabled by the bundled Lenis, and micro-interactions (CTA magnetic hover, Trending tag hover scale).

Rationale: motion-v covers mask reveals (clip-path animate), `useScroll`/`useTransform` scroll linking, spring physics for magnetic interactions, and stagger — the full range this redesign needs. Adding GSAP would double the animation concept surface, raise bundle size, and split the codebase's motion vocabulary across two libraries for no capability gain.

Rejected: introducing GSAP for ScrollTrigger/scrub — motion-v's `useScroll` + Lenis replaces it; restricting to only scroll-linked scenes (leaves entries polite, which is the current pain).

Reversal cost: medium — a later GSAP migration would rewrite the motion system, so recording the "why not GSAP despite specs" now keeps the rationale findable.