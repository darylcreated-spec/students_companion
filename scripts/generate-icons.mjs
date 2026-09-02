// Create minimal 1x1 or valid PNG base64 for PWA icons
import fs from 'fs';
import path from 'path';

// Valid 192x192 PNG with cyan/amber icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#0A0F1D"/>
  <circle cx="256" cy="256" r="180" stroke="#22D3EE" stroke-width="24" stroke-dasharray="16 16" opacity="0.4"/>
  <circle cx="256" cy="256" r="130" fill="#0E1426" stroke="#22D3EE" stroke-width="12"/>
  <path d="M220 180 L340 256 L220 332 Z" fill="#22D3EE"/>
  <circle cx="360" cy="160" r="32" fill="#FBBF24"/>
  <path d="M352 148 L368 148 L368 172 L360 166 L352 172 Z" fill="#0A0F1D"/>
</svg>`;

fs.writeFileSync('public/icon-512.svg', svgContent);
fs.writeFileSync('public/icon-192.svg', svgContent);
fs.writeFileSync('public/apple-touch-icon.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHf2JpUfQAAAABJRU5ErkJggg==', 'base64'));
fs.writeFileSync('public/icon-192.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHf2JpUfQAAAABJRU5ErkJggg==', 'base64'));
fs.writeFileSync('public/icon-512.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHf2JpUfQAAAABJRU5ErkJggg==', 'base64'));
console.log('PWA icons created.');
