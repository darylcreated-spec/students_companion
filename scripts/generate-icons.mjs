import fs from 'fs';
import path from 'path';

// Concept 1: The Sonic Tome (Book Morphing into Soundwaves)
const sonicTomeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E172A"/>
      <stop offset="50%" stop-color="#090E1D"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Electric Cyan Gradient for Soundwaves & Page Edges -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67E8F9"/>
      <stop offset="50%" stop-color="#22D3EE"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>

    <!-- Warm Golden Bookmark Gradient -->
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="50%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Page Gradients for Depth -->
    <linearGradient id="pageLeftGrad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#0F243E"/>
    </linearGradient>
    <linearGradient id="pageRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#0F243E"/>
    </linearGradient>

    <!-- Subtle Glow Filter -->
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base Rounded Container (Squircle) -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" stroke="#1E293B" stroke-width="5"/>
  <rect x="10" y="10" width="492" height="492" rx="112" fill="none" stroke="rgba(34, 211, 238, 0.12)" stroke-width="2"/>

  <!-- Radiating Acoustic Soundwaves (Outer Flanks) -->
  <!-- Left Sound Arcs -->
  <path d="M 112 175 C 78 220, 78 295, 112 340" fill="none" stroke="url(#cyanGrad)" stroke-width="12" stroke-linecap="round" filter="url(#cyanGlow)"/>
  <path d="M 80 150 C 40 205, 40 310, 80 365" fill="none" stroke="url(#cyanGrad)" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
  <path d="M 52 128 C 6 190, 6 325, 52 388" fill="none" stroke="url(#cyanGrad)" stroke-width="7" stroke-linecap="round" opacity="0.45"/>

  <!-- Right Sound Arcs -->
  <path d="M 400 175 C 434 220, 434 295, 400 340" fill="none" stroke="url(#cyanGrad)" stroke-width="12" stroke-linecap="round" filter="url(#cyanGlow)"/>
  <path d="M 432 150 C 472 205, 472 310, 432 365" fill="none" stroke="url(#cyanGrad)" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
  <path d="M 460 128 C 506 190, 506 325, 460 388" fill="none" stroke="url(#cyanGrad)" stroke-width="7" stroke-linecap="round" opacity="0.45"/>

  <!-- Central Acoustic Equalizer Bars (Broadcasting from Top Spine) -->
  <line x1="228" y1="165" x2="228" y2="190" stroke="url(#cyanGrad)" stroke-width="7" stroke-linecap="round"/>
  <line x1="242" y1="145" x2="242" y2="194" stroke="url(#cyanGrad)" stroke-width="8" stroke-linecap="round"/>
  <line x1="256" y1="124" x2="256" y2="198" stroke="url(#amberGrad)" stroke-width="9" stroke-linecap="round"/>
  <line x1="270" y1="145" x2="270" y2="194" stroke="url(#cyanGrad)" stroke-width="8" stroke-linecap="round"/>
  <line x1="284" y1="165" x2="284" y2="190" stroke="url(#cyanGrad)" stroke-width="7" stroke-linecap="round"/>

  <!-- Book Hardcover Base (Under-Layer) -->
  <path d="M 256 390 C 205 410, 142 390, 112 368 L 112 222 C 142 244, 205 264, 256 244 Z" fill="#091322" stroke="#1E293B" stroke-width="4"/>
  <path d="M 256 390 C 307 410, 370 390, 400 368 L 400 222 C 370 244, 307 264, 256 244 Z" fill="#091322" stroke="#1E293B" stroke-width="4"/>

  <!-- Book Page Stacks (Depth Layer) -->
  <path d="M 256 372 C 210 390, 154 374, 124 354 L 124 208 C 154 228, 210 245, 256 226 Z" fill="#0E1E34" stroke="#0284C7" stroke-width="2.5" opacity="0.85"/>
  <path d="M 256 372 C 302 390, 358 374, 388 354 L 388 208 C 358 228, 302 245, 256 226 Z" fill="#0E1E34" stroke="#0284C7" stroke-width="2.5" opacity="0.85"/>

  <!-- Top Open Reading Pages -->
  <!-- Left Page -->
  <path d="M 256 354 C 214 370, 162 355, 136 338 L 136 192 C 162 210, 214 224, 256 208 Z" fill="url(#pageLeftGrad)" stroke="#22D3EE" stroke-width="4.5"/>
  <!-- Right Page -->
  <path d="M 256 354 C 298 370, 350 355, 376 338 L 376 192 C 350 210, 298 224, 256 208 Z" fill="url(#pageRightGrad)" stroke="#22D3EE" stroke-width="4.5"/>

  <!-- Page Soundwave Frequency Glyphs / Lines -->
  <!-- Left Lines -->
  <path d="M 158 238 C 182 249, 214 252, 238 243" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
  <path d="M 156 268 C 182 279, 214 282, 238 273" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
  <path d="M 154 298 C 182 309, 214 312, 238 303" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>

  <!-- Right Lines -->
  <path d="M 274 243 C 298 252, 330 249, 354 238" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
  <path d="M 274 273 C 298 282, 330 279, 356 268" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
  <path d="M 274 303 C 298 312, 330 309, 358 298" fill="none" stroke="#22D3EE" stroke-width="5" stroke-linecap="round" opacity="0.85"/>

  <!-- Golden Bookmark Ribbon Hanging from Spine -->
  <path d="M 245 198 L 267 198 L 267 400 L 256 386 L 245 400 Z" fill="url(#amberGrad)" stroke="#78350F" stroke-width="2"/>
</svg>`;

// Write SVGs
fs.writeFileSync('public/favicon.svg', sonicTomeSvg);
fs.writeFileSync('public/icon-512.svg', sonicTomeSvg);
fs.writeFileSync('public/icon-192.svg', sonicTomeSvg);

console.log('Sonic Tome PWA SVGs successfully created.');
