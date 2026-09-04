import fs from 'fs';

const imgBase64 = fs.readFileSync('public/icon-512.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#070B14"/>
  <image href="data:image/png;base64,${imgBase64}" width="512" height="512"/>
</svg>`;

fs.writeFileSync('public/favicon.svg', svg);
fs.writeFileSync('public/icon-512.svg', svg);
fs.writeFileSync('public/icon-192.svg', svg);

console.log('Zero-border Acoustic Owl SVGs updated.');
