# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (Turbopack, port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, eslint.config.mjs)
- No test framework is configured

## Architecture

**"ExposedByHG"** — a cinematic photography gallery built with Next.js 16, React 19, Tailwind CSS 4, and Vercel Blob.

### Data flow

`app/page.tsx` is an async server component that calls `lib/photos.ts:getPhotos()` to fetch image metadata from Vercel Blob (`@vercel/blob` `list()`). If Blob isn't configured (no `BLOB_READ_WRITE_TOKEN`), it falls back to local placeholder images in `public/photos/`. The `Photo[]` array is passed as props to the client-side `Gallery` component.

### Component structure

- **`app/page.tsx`** — server component, data fetching only
- **`app/components/Gallery.tsx`** — main client component: hero (Chambre) with auto-advancing Ken Burns + filmstrip, marquee divider, editorial collection scroll with parallax. All interactive state lives here.
- **`app/components/Frame.tsx`** — matted "hung artwork" frame wrapping `next/image`. Handles any aspect ratio via `fit` (viewport-constrained) or `fill` modes. Uses `next/image` with responsive `sizes` and `quality` for optimization.
- **`app/components/Cursor.tsx`** — custom cursor, `useMouseParallax` hook, `useReveal` (IntersectionObserver), `useStreamDrift` (scroll-parallax). Shared hooks are exported from here.
- **`app/api/upload/route.ts`** — POST endpoint to upload photos to Vercel Blob

### Styling

All gallery CSS is in `app/globals.css` — not Tailwind utility classes. CSS custom properties (`--bg`, `--ink`, `--accent`, `--ease`, etc.) control theming. Font variables `--font-cormorant` and `--font-jost` are set via `next/font/google` in `app/layout.tsx`.

### Image handling

`next.config.ts` allows remote images from `*.blob.vercel-storage.com`. The `Frame` component uses `next/image` with `fill` for remote URLs (no known dimensions) and explicit `width`/`height` for local images. Hero images use `priority`, all others lazy-load.
