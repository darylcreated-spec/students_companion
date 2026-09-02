import fs from 'fs';

// High-fidelity Nocturnal HUD PWA Icon with Cyan & Amber accents
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="50%" stop-color="#0A0F1D"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8AEBFF"/>
      <stop offset="100%" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base Rounded Container -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" stroke="#1E293B" stroke-width="6"/>

  <!-- Glowing Ambient Grid Ring -->
  <circle cx="256" cy="256" r="190" stroke="#22D3EE" stroke-width="3" stroke-dasharray="12 12" opacity="0.25"/>
  <circle cx="256" cy="256" r="160" stroke="#22D3EE" stroke-width="1.5" opacity="0.15"/>

  <!-- Headphone Audio Arch -->
  <path d="M146 256 C146 190, 195 136, 256 136 C317 136, 366 190, 366 256" fill="none" stroke="url(#cyanGrad)" stroke-width="26" stroke-linecap="round" filter="url(#cyanGlow)"/>

  <!-- Left & Right Ear Cushions -->
  <rect x="126" y="240" width="38" height="74" rx="18" fill="#0A0F1D" stroke="#22D3EE" stroke-width="8"/>
  <rect x="348" y="240" width="38" height="74" rx="18" fill="#0A0F1D" stroke="#22D3EE" stroke-width="8"/>

  <!-- Audio Waveform Center Graphic -->
  <line x1="200" y1="230" x2="200" y2="282" stroke="url(#cyanGrad)" stroke-width="10" stroke-linecap="round"/>
  <line x1="228" y1="205" x2="228" y2="307" stroke="url(#cyanGrad)" stroke-width="10" stroke-linecap="round"/>
  <line x1="256" y1="180" x2="256" y2="332" stroke="url(#cyanGrad)" stroke-width="12" stroke-linecap="round"/>
  <line x1="284" y1="205" x2="284" y2="307" stroke="url(#cyanGrad)" stroke-width="10" stroke-linecap="round"/>
  <line x1="312" y1="230" x2="312" y2="282" stroke="url(#cyanGrad)" stroke-width="10" stroke-linecap="round"/>

  <!-- Glowing Commute Bookmark / Note Star (Top Right) -->
  <circle cx="375" cy="135" r="32" fill="url(#amberGrad)" filter="url(#amberGlow)"/>
  <path d="M366 122 L384 122 L384 148 L375 141 L366 148 Z" fill="#0A0F1D"/>
</svg>`;

fs.writeFileSync('public/favicon.svg', svgIcon);
fs.writeFileSync('public/icon-512.svg', svgIcon);
fs.writeFileSync('public/icon-192.svg', svgIcon);

console.log('High-fidelity Nocturnal HUD PWA icons generated successfully.');
