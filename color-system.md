# 🎨 Warm Arcade — Color System

Base palette: `#f1ddbf` · `#525e75` · `#78938a` · `#92ba92`

---

## Backgrounds

| Role | Hex | Preview |
|---|---|---|
| Screen / page BG | `#e8ceaa` | warm parchment field |
| Footer BG | `#dfc49e` | one step deeper, grounds the screen |
| Card BG (icon area) | `#faf3e8` | lightest cream, cards lift off the surface |
| Card bottom bar tint | `accent + 28` | semi-transparent accent over cream |
| Modal / portal card | `#faf3e8` | same as card, consistent surface |
| Modal backdrop scrim | `rgba(46,58,78,0.75)` | slate-tinted dark veil |

---

## Text & Labels

| Role | Hex | Notes |
|---|---|---|
| Primary ink (headings, scores) | `#2e3a4e` | deep navy-slate, warm not cold |
| Muted labels (COMBINED, TOTAL) | `#8292ae` | lightened slate |
| Disabled / placeholder | `#a09080` | warm grey, not neutral |
| Card title on accent bar | use `accent.dark` | see Accents section |

---

## Player Colors

Muted, palette-matched — not neon. They live naturally on cream.

| Player | Hex | Name |
|---|---|---|
| Red player | `#b85c52` | Terracotta |
| Blue player | `#4a7a9b` | Dusty Blue |
| Red tint (pill BG) | `#b85c52` + `22` opacity | |
| Blue tint (pill BG) | `#4a7a9b` + `22` opacity | |

---

## Card Accent Colors

Each card gets one of four accents cycled by game title hash.

| Accent | Hex | Dark variant (for text/titles) |
|---|---|---|
| Sage | `#92ba92` | `#4a7a4a` |
| Teal | `#78938a` | `#3d6058` |
| Slate | `#525e75` | `#2e3a4e` |
| Amber | `#c47b3a` | `#8a4e1a` |

Use the **dark variant** for any text sitting on top of the accent color.
Use the **accent** at `28` opacity for background tints and bottom bars.

---

## Buttons

### ▶ Primary — PLAY button (portal modal)
| Property | Value |
|---|---|
| Background | `accent` color of that card |
| Text | `#ffffff` |
| Border radius | `12px` |
| Font weight | `900` |
| Letter spacing | `3` |
| Shadow color | same as accent |
| Shadow radius | `10` |

### ☕ Donate button
| Property | Value |
|---|---|
| Background | `#f1ddbf` at `55` opacity (soft cream wash) |
| Border | `#c9a97e` (warm brown, same as footer border) |
| Text color | `#2e3a4e` (ink) |
| Border radius | `20px` (pill shape) |
| Font weight | `900` |
| Font size | `9–10px` |

> **Why this combo?** The cream wash background with a warm brown border reads as a natural stamp / label on the parchment footer — it doesn't need to shout. If you want it to feel more inviting, try `#c47b3a` amber text instead of ink.

### ← Back button (portal)
| Property | Value |
|---|---|
| Background | transparent |
| Text color | `#8292ae` (muted slate) |
| Letter spacing | `2` |
| No border | just the text label |

---

## Borders & Dividers

| Role | Value |
|---|---|
| Footer top border | `#c9a97e` — warm brown |
| Card border (resting) | `#8292ae` at `66` opacity |
| Card border (pressed) | full `accent` color |
| Footer vertical dividers | `red + 44` / `blue + 44` |
| Portal corner brackets | `accent + aa` |
| Chip borders (multiplayer) | `player.color + 99` |

---

## Shadows

React Native shadow values for the warm world — always use warm-tinted shadow colors, not black.

| Surface | shadowColor | shadowOpacity | shadowRadius |
|---|---|---|---|
| Card (resting) | `accent` | `0` (invisible) | `14` |
| Card (pressed) | `accent` | `1` | `14` |
| Footer | `#a07840` | `0.18` | `16` |
| Portal modal | `accent` | `0.35` | `32` |
| Play button | `accent` | `0.4` | `10` |

---

## Blobs / Background Orbs

Soft oversized circles, no hard edges, very low opacity.

| Orb | Color | Size | Opacity | Position |
|---|---|---|---|---|
| Top-left | `#525e75` slate | `420×420` | `0.14` | `top -180, left -160` |
| Top-right | `#92ba92` sage | `340×340` | `0.18` | `top -100, right -120` |
| Mid-left | `#78938a` teal | `300×300` | `0.13` | `38% top, left -140` |
| Bottom-right | `#525e75` slate | `380×380` | `0.11` | `bottom -140, right -130` |

---

## Quick Reference Cheatsheet

```
SCREEN BG     #e8ceaa   parchment
FOOTER BG     #dfc49e   deeper parchment  
CARD BG       #faf3e8   lightest cream
BORDER WARM   #c9a97e   warm brown

INK           #2e3a4e   deep navy text
MUTED         #8292ae   label grey

RED PLAYER    #b85c52   terracotta
BLUE PLAYER   #4a7a9b   dusty blue

SAGE ACCENT   #92ba92   / dark #4a7a4a
TEAL ACCENT   #78938a   / dark #3d6058
SLATE ACCENT  #525e75   / dark #2e3a4e
AMBER ACCENT  #c47b3a   / dark #8a4e1a

DONATE BTN    bg #f1ddbf·55  border #c9a97e  text #2e3a4e
PLAY BTN      bg accent       text #ffffff
```
