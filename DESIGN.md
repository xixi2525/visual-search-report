# Kaleido Field Design System

Inspired by the WIRED DESIGN.md reference from getdesign.md.

## Visual Theme

Kaleido Field should feel like a serious technology magazine: paper-white, dense, fast to scan, and held together by typography, photography, and hairline rules. Avoid startup gradients, soft cards, rounded panels, and decorative glow.

## Color

- Canvas: `#ffffff`
- Ink / primary: `#000000`
- Ink soft: `#1a1a1a`
- Body: `#242424`
- Muted metadata: `#757575`
- Hairline: `#e0e0e0`
- Soft canvas: `#f5f5f5`
- Inline link blue: `#1619F3`

The link blue is reserved for inline editorial links. Navigation and buttons stay black and white.

## Typography

- Display: `Playfair Display`, `Times New Roman`, Georgia, serif.
- Body narrative: Georgia, `Times New Roman`, serif.
- Structure: Inter, `Helvetica Neue`, Helvetica, Arial, sans-serif.

Use serif display headings at light/regular weight. Use sans only for navigation, labels, metadata, buttons, and utility surfaces.

## Components

- No rounded cards. Border radius is `0`.
- No shadows. Use black rules and `#e0e0e0` dividers.
- Masthead is a centered editorial wordmark band.
- Navigation is a compact sticky row with uppercase sans links.
- Article images use real photography, 16:9 crops, no watermarks, and clear source captions.
- Story modules use stacked rows and grid cells separated by hairlines.
- A slim fixed bottom dock provides persistent navigation without pinning the hero title.

## Interaction

- Navigation links invert to black background and white text on hover.
- Editorial images default to grayscale and reveal color on hover.
- Bottom dock stays fixed as a lightweight “latest / guides / benchmarks / Chance AI” reader rail.

## SEO / GEO Rule

Every public page needs canonical URL, indexable robots meta, source-linked claims, structured data where relevant, RSS/sitemap/llms.txt coverage, high-resolution relevant imagery with captions, and a direct answer or citation-ready summary near the top.
