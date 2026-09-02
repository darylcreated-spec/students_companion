# DESIGN.md — Nocturnal HUD Design System

Extracted design tokens, color palette, typography, and component specifications generated via **Google Stitch MCP** for **The Student's Companion** Progressive Web App.

---

## 1. Brand & Aesthetic Rationale
- **Theme Name**: Nocturnal HUD (Heads-Up Display)
- **Target Viewport**: Mobile-First (412x915 portrait), thumb-friendly layout.
- **Environment**: High-stress, low-light night-time commute and transit settings.
- **Core Visual Pillars**: 
  1. *OLED Deep Obsidian Base* to reduce battery usage and minimize eye strain.
  2. *Glassmorphic Elevation* with frosted translucent backdrops and 1px ambient border highlights.
  3. *Luminous Feedback & Tactile Oversized Controls* (minimum 48px hit areas for one-handed operation during motion).

---

## 2. Color Palette & Design Tokens

### Core Palette
| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Obsidian Base** | `#0A0F1D` | Deep background canvas (Level 0) |
| **Surface Dark** | `#0E1416` | Base container and panel fill |
| **Surface Translucent** | `rgba(22, 29, 30, 0.75)` | Frosted glass cards with `backdrop-filter: blur(16px)` |
| **Surface Elevated** | `rgba(47, 54, 56, 0.65)` | Active cards, modal sheets, and popovers |
| **Border Glass** | `rgba(255, 255, 255, 0.10)` | 1px top/lateral ambient edge highlights |
| **Border Active** | `rgba(34, 211, 238, 0.40)` | Glowing cyan border stroke |

### Accent Colors
| Accent | Hex Code | Tailwind Equivalent | Role |
| :--- | :--- | :--- | :--- |
| **Electric Cyan (Primary)** | `#22D3EE` / `#8AEBFF` | `cyan-400` / `cyan-300` | Playback state, primary actions, progress meters, audio waveform |
| **Neon Amber (Secondary)** | `#FBBF24` / `#FFC640` | `amber-400` | Bookmarks, action items, speed pills, notifications |
| **Exam Flag Red (Tertiary)** | `#F87171` / `#FFB4AB` | `red-400` | Exam alerts, urgent concept flags, audio recording pulse |
| **Emerald Insight (Success)** | `#34D399` | `emerald-400` | Offline sync ready, successful parsing status |
| **Text Primary** | `#DDE4E5` | `slate-100` | Maximum contrast body and heading text |
| **Text Muted** | `#859397` / `#94A3B8` | `slate-400` | Subtitles, duration estimates, secondary metadata |

---

## 3. Typography Hierarchy (Sora & JetBrains Mono)
- **Primary Font**: `Sora`, sans-serif (High x-height, clear geometry for vibrating train/bus screens)
- **Data / Timecode Font**: `JetBrains Mono`, monospace (Numerical stability during playback counters)

| Style | Font | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Title** | Sora | `28px - 32px` | 700 (Bold) | `36px` | `-0.02em` |
| **Headline Medium** | Sora | `20px - 24px` | 600 (Semi-bold) | `28px` | `-0.01em` |
| **Body Large** | Sora | `16px - 18px` | 400 (Regular) | `26px` | `0` |
| **Body Medium** | Sora | `14px - 15px` | 400 (Regular) | `22px` | `0` |
| **Timestamp / Badges**| JetBrains Mono | `12px - 13px` | 600 (Medium/Bold)| `16px` | `0.05em` |
| **Label Caps** | Sora | `11px - 12px` | 700 (Bold) | `14px` | `0.10em` (Uppercase)|

---

## 4. Elevation & Glassmorphism System
1. **Level 0 (App Shell)**: `#0A0F1D` solid background.
2. **Level 1 (Glass Cards)**: `bg-[#0e1416]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg`.
3. **Level 2 (Active Hub / Player Controls)**: `bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)]`.
4. **Level 3 (Voice Dictation Overlay)**: `bg-[#0A0F1D]/95 backdrop-blur-2xl border-t border-amber-400/40 shadow-[0_-10px_40px_rgba(251,191,36,0.2)]`.

---

## 5. Mobile-Native Commute Controls
- **Central Play/Pause**: 80x80px circular button with glowing cyan halo (`shadow-[0_0_20px_rgba(34,211,238,0.5)]`).
- **Skip -15s / +15s**: 52x52px rounded controls flanking play/pause.
- **Drop Note / Floating Mic**: Massive 64x64px pulsing Amber/Cyan button positioned for right/left thumb accessibility.
- **Speed Selector Pill**: Horizontal pill bar (`1.0x`, `1.25x`, `1.5x`, `2.0x`) with quick haptic touch response.
- **Bottom Navigation**: 4-tab bar (Audio Hub, Library, Notebook, Export) with 64px height and tactile active indicators.
