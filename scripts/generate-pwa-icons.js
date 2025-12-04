// Simple script to create placeholder icon files
// Since we don't have image generation libraries, we'll create simple SVG-based PNGs

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Create a simple SVG icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="url(#bg)"/>

  <!-- Calculator body -->
  <rect x="${size * 0.15}" y="${size * 0.15}"
        width="${size * 0.7}" height="${size * 0.7}"
        rx="${size * 0.08}" fill="white"/>

  <!-- Display area -->
  <rect x="${size * 0.22}" y="${size * 0.22}"
        width="${size * 0.56}" height="${size * 0.15}"
        rx="${size * 0.04}" fill="#dbeafe"/>

  <!-- Calculator buttons (3x3 grid) -->
  ${Array.from({length: 9}).map((_, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const buttonSize = size * 0.12;
    const gap = size * 0.06;
    const startX = size * 0.26;
    const startY = size * 0.45;
    const x = startX + col * (buttonSize + gap);
    const y = startY + row * (buttonSize + gap);
    return `<rect x="${x}" y="${y}" width="${buttonSize}" height="${buttonSize}" rx="${buttonSize * 0.2}" fill="#2563eb"/>`;
  }).join('\n  ')}
</svg>
`;

// Create icon files
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

// Create apple-touch-icon (180x180 for iOS)
const appleSVG = createIconSVG(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleSVG);
console.log('✅ Created apple-touch-icon.svg');

// Create favicon
const faviconSVG = createIconSVG(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
console.log('✅ Created favicon.svg');

console.log('\n📝 ملاحظة: تم إنشاء أيقونات SVG. لاستخدام PNG، افتح ملف generate-icons.html في المتصفح.');
