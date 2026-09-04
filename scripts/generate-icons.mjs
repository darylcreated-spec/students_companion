import fs from 'fs';

const imgBase64 = fs.readFileSync('public/icon-512.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="squircleClip">
      <rect width="512" height="512" rx="115" ry="115"/>
    </clipPath>
  </defs>
  <rect width="512" height="512" rx="115" fill="#070B14"/>
  <image href="data:image/png;base64,${imgBase64}" width="512" height="512" clip-path="url(#squircleClip)"/>
</svg>`;

fs.writeFileSync('public/favicon.svg', svg);
fs.writeFileSync('public/icon-512.svg', svg);
fs.writeFileSync('public/icon-192.svg', svg);

console.log('Concept D Acoustic Owl SVGs and icons successfully generated.');
