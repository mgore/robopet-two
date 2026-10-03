# RoboPet design system

Design tokens extracted from the RoboPet app (`src/index.css`, `index.html`, `public/manifest.json` and the Tailwind utilities used across `src/components`), plus a **Cyberpunk Retro** redraft that runs beside the current look for comparison.

| File | What |
| --- | --- |
| `tokens.json` | Source of truth. Colours (per theme), type, spacing, radius, shadow. |
| `tokens.css` | Generated CSS custom properties. `data-theme="classic"` is the default; `data-theme="cyberpunk"` switches. |
| `cyberpunk.css` | Tailwind v4 `@theme` overrides that re-skin the whole app without touching components. Used by the RoboPet-Two repo. |

## Themes

- **Classic**: what ships today. Slate surfaces, cyan primary, violet secondary, rounded (8-12px) corners, Inter / Space Grotesk / JetBrains Mono.
- **Cyberpunk Retro**: deep-violet void, neon cyan / magenta / acid yellow / toxic green, near-square 2px corners, scanline overlay, glowing edges, Orbitron / Chakra Petch / Share Tech Mono, uppercase tracked labels.

## Rules

1. Colour has one job each: `accent` = act, `secondary` = AI / creative, `success` / `warning` / `danger` = state. Do not use state colours decoratively.
2. Text uses `text-*` tokens on `surface-*` tokens only; all pairs meet 4.5:1 except `text-faint`, which is for placeholders and timestamps.
3. Text on `accent-solid` and other bright fills is `on-accent`.
4. Panels are `surface-panel` with a 1px `border-default`; nesting goes `surface-base` > `surface-panel` > `surface-raised`.
5. Cyberpunk glow (`shadow-panel`, `shadow-glow`) is the only depth cue; do not stack it on nested elements.
6. Respect `prefers-reduced-motion`: the cyberpunk theme's scanline flicker is static under it.

## Not covered

No component library exists in the repo (components are Tailwind class strings inside TSX), so this system ships tokens and guidance only.
