# Design system: "Matchday Coupon"

## The idea
Your app is, at its core, a football pools coupon — you're filling in predicted
scores like the paper coupons people fill out at a kiosk before a matchday.
So instead of a generic "sports app" look (dark mode + neon, or SaaS
dashboard blue), the whole UI leans into that: a chalky paper background,
perforated ticket dividers between the match info and the score entry, and
every score/point number rendered as a **flip-scoreboard digit** — dark
chip, glowing gold numerals, monospace. That digit chip is the one
signature element, reused everywhere a number matters: score entry,
finished results, and leaderboard points. Consistency there is what makes
it feel designed rather than assembled.

## Palette
| Token | Hex | Use |
|---|---|---|
| `pitch` | `#0B3D2E` | Nav bar, primary buttons, dark surfaces |
| `pitch-light` | `#124B39` | Hover state for pitch |
| `chalk` | `#F5F3EC` | Page background (paper) |
| `flag` | `#D2232A` | CTAs, ×2 bonus, destructive actions |
| `floodlight` | `#F2B705` | Scoreboard numerals, highlights, admin accent |
| `ink` | `#101820` | Text, scoreboard chip background |
| `mist` | `#7C8B85` | Secondary text, borders |

## Type
- **Oswald** (display) — condensed, uppercase, used for headers/eyebrows/buttons
- **Inter** (body) — everyday text
- **JetBrains Mono** (score) — every score, odds figure, and point total

## Files in this delivery
- `design-system.css` — fonts, CSS variables, the `.ticket-perf` divider, the
  `.scoreboard-digit` chip, and the crest clip-path. Import once in your app.
- `tailwind.config.js` — adds the palette/fonts above as Tailwind tokens
  (`bg-pitch`, `text-flag`, `font-display`, `font-score`, `rounded-ticket`, …).
- `App.jsx` — your full app, re-skinned with this system. All existing
  functionality (predictions, X2-per-gameweek limit, admin match results,
  admin league deletion, points breakdown, potential-points display) is
  unchanged — only the visuals and JSX structure changed.

## How to apply it (5 minutes)

1. **Copy the CSS file** into your frontend's `src/` folder:
   ```
   frontend/src/design-system.css
   ```

2. **Replace** `frontend/tailwind.config.js` with the one provided here.

3. **Replace** `frontend/src/App.jsx` entirely with the one provided here.
   (It already has `import './design-system.css';` at the top.)

4. **Push:**
   ```bash
   cd C:\Users\LOQ\tunisian-mpp
   git add .
   git commit -m "Redesign: Matchday Coupon visual system"
   git push origin main
   ```

5. Wait ~2 minutes for Vercel to redeploy, then hard refresh (Ctrl+Shift+R).

No new npm packages are required — fonts load from Google Fonts via the
`@import` in `design-system.css`, and everything else is Tailwind classes
already available in your project.

## What to check after deploying
- Score entry boxes look like scoreboard digits (dark chip, gold numerals) —
  this is the signature element, it should feel consistent everywhere.
- Nav bar is pitch-green with a gold underline and the "TN" crest mark.
- Match cards have a small dashed "perforation" line between the team names
  and the score area.
- Mobile: cards stack, digits stay tappable-sized, nothing overflows
  horizontally.
