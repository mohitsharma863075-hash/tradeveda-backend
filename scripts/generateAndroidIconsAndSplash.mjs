import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Vector design for TradeVeda Brand Symbol (1080x1080 canvas)
function getBrandIconSvg({ round = false, foregroundOnly = false, monochrome = false } = {}) {
  const bgFill = monochrome ? 'none' : '#0b0f19';
  const cardFill = monochrome ? 'none' : '#0f172a';
  const cardStroke = monochrome ? 'none' : '#1e293b';
  const candle1 = monochrome ? '#FFFFFF' : '#10b981'; // Emerald
  const candle2 = monochrome ? '#FFFFFF' : '#10b981'; // Emerald
  const candle3 = monochrome ? '#FFFFFF' : '#3b82f6'; // Electric Blue
  const arrowColor = monochrome ? '#FFFFFF' : '#38bdf8'; // Sky blue / cyan accent
  const glowColor = monochrome ? 'none' : '#3b82f6';

  let backgroundLayer = '';
  if (!foregroundOnly) {
    if (round) {
      backgroundLayer = `<circle cx="540" cy="540" r="540" fill="${bgFill}"/>`;
    } else {
      backgroundLayer = `<rect width="1080" height="1080" rx="240" fill="${bgFill}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="24" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  ${backgroundLayer}

  <!-- Emblem Container (Inside Safe Zone: Center 540,540, R=330) -->
  <g transform="translate(0, 0)">
    <!-- Rounded Inner Shield/Card -->
    <rect x="240" y="240" width="600" height="600" rx="140" fill="url(#cardGrad)" stroke="${cardStroke}" stroke-width="8" />

    <!-- Subtle Ambient Glow -->
    <circle cx="540" cy="540" r="220" fill="${glowColor}" opacity="0.12" filter="url(#glow)"/>

    <!-- Candlestick 1: Bullish Green -->
    <!-- Wick -->
    <line x1="390" y1="460" x2="390" y2="700" stroke="${candle1}" stroke-width="8" stroke-linecap="round" />
    <!-- Candle Body -->
    <rect x="365" y="520" width="50" height="130" rx="8" fill="${candle1}" />

    <!-- Candlestick 2: Tall Bullish Green -->
    <!-- Wick -->
    <line x1="510" y1="360" x2="510" y2="670" stroke="${candle2}" stroke-width="8" stroke-linecap="round" />
    <!-- Candle Body -->
    <rect x="485" y="420" width="50" height="180" rx="8" fill="${candle2}" />

    <!-- Candlestick 3: Breakout Blue -->
    <!-- Wick -->
    <line x1="630" y1="280" x2="630" y2="610" stroke="${candle3}" stroke-width="8" stroke-linecap="round" />
    <!-- Candle Body -->
    <rect x="605" y="320" width="50" height="210" rx="8" fill="${candle3}" />

    <!-- Dynamic Upward Growth Trendline with Arrow -->
    <path d="M 330 650 Q 450 560 560 480 T 730 320" fill="none" stroke="${arrowColor}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <!-- Arrowhead -->
    <polygon points="750,305 680,320 720,360" fill="${arrowColor}" />
  </g>
</svg>`;
}

// 2. Vector design for Splash Screen (Centrally balanced artwork)
function getSplashSvg(width, height) {
  const isLandscape = width > height;
  const emblemScale = isLandscape ? Math.min(width, height) * 0.42 : Math.min(width, height) * 0.46;
  const centerX = width / 2;
  const centerY = height / 2 - (isLandscape ? 15 : 35);

  const titleFontSize = Math.max(24, Math.round(Math.min(width, height) * 0.052));
  const subFontSize = Math.max(10, Math.round(titleFontSize * 0.32));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080c14" />
      <stop offset="100%" stop-color="#0b0f19" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
  </defs>

  <!-- Solid Deep Dark Background -->
  <rect width="${width}" height="${height}" fill="url(#splashBg)" />

  <!-- Center Emblem Group -->
  <g transform="translate(${centerX}, ${centerY})">
    <g transform="scale(${emblemScale / 600}) translate(-300, -300)">
      <!-- Card background -->
      <rect x="0" y="0" width="600" height="600" rx="140" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="8" />

      <!-- Candlestick 1 -->
      <line x1="150" y1="220" x2="150" y2="460" stroke="#10b981" stroke-width="8" stroke-linecap="round" />
      <rect x="125" y="280" width="50" height="130" rx="8" fill="#10b981" />

      <!-- Candlestick 2 -->
      <line x1="270" y1="120" x2="270" y2="430" stroke="#10b981" stroke-width="8" stroke-linecap="round" />
      <rect x="245" y="180" width="50" height="180" rx="8" fill="#10b981" />

      <!-- Candlestick 3 -->
      <line x1="390" y1="60" x2="390" y2="370" stroke="#3b82f6" stroke-width="8" stroke-linecap="round" />
      <rect x="365" y="100" width="50" height="210" rx="8" fill="#3b82f6" />

      <!-- Breakout Trendline -->
      <path d="M 90 410 Q 210 320 320 240 T 490 80" fill="none" stroke="#38bdf8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      <polygon points="510,65 440,80 480,120" fill="#38bdf8" />
    </g>
  </g>

  <!-- Brand Typography -->
  <text x="${centerX}" y="${centerY + emblemScale * 0.65}" font-family="system-ui, -apple-system, sans-serif" font-size="${titleFontSize}" font-weight="800" text-anchor="middle" fill="#f8fafc" letter-spacing="-0.5">
    Trade<tspan fill="url(#titleGrad)">Veda</tspan>
  </text>
  <text x="${centerX}" y="${centerY + emblemScale * 0.65 + subFontSize * 2}" font-family="system-ui, -apple-system, sans-serif" font-size="${subFontSize}" font-weight="600" text-anchor="middle" fill="#64748b" letter-spacing="2">
    INDIAN STOCK MARKET PAPER TRADING
  </text>
</svg>`;
}

async function generateAllAssets() {
  console.log('🚀 Generating TradeVeda Android Launcher & Splash Assets...');

  const resDir = path.resolve('android/app/src/main/res');

  // Density specifications for launcher icons
  const iconDensities = [
    { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  const standardIconSvg = Buffer.from(getBrandIconSvg({ round: false, foregroundOnly: false }));
  const roundIconSvg = Buffer.from(getBrandIconSvg({ round: true, foregroundOnly: false }));
  const foregroundSvg = Buffer.from(getBrandIconSvg({ round: false, foregroundOnly: true }));

  // Generate Mipmap Icons
  for (const { folder, iconSize, fgSize } of iconDensities) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // 1. Standard square/squircle legacy icon
    await sharp(standardIconSvg)
      .resize(iconSize, iconSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. Round legacy icon
    await sharp(roundIconSvg)
      .resize(iconSize, iconSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. Adaptive foreground layer
    await sharp(foregroundSvg)
      .resize(fgSize, fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`  ✓ Generated icons for ${folder} (${iconSize}x${iconSize}, fg: ${fgSize}x${fgSize})`);
  }

  // Generate Web PWA icons in /public
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  await sharp(roundIconSvg).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(roundIconSvg).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('  ✓ Generated PWA icons in /public (192x192, 512x512)');

  // Splash Screen Density Dimensions
  const splashSpecs = [
    { folder: 'drawable', width: 480, height: 320 },
    { folder: 'drawable-port-mdpi', width: 320, height: 480 },
    { folder: 'drawable-port-hdpi', width: 480, height: 800 },
    { folder: 'drawable-port-xhdpi', width: 720, height: 1280 },
    { folder: 'drawable-port-xxhdpi', width: 960, height: 1600 },
    { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
    { folder: 'drawable-land-mdpi', width: 480, height: 320 },
    { folder: 'drawable-land-hdpi', width: 800, height: 480 },
    { folder: 'drawable-land-xhdpi', width: 1280, height: 720 },
    { folder: 'drawable-land-xxhdpi', width: 1600, height: 960 },
    { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
  ];

  for (const { folder, width, height } of splashSpecs) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const splashSvg = Buffer.from(getSplashSvg(width, height));
    await sharp(splashSvg)
      .resize(width, height)
      .png()
      .toFile(path.join(targetDir, 'splash.png'));

    console.log(`  ✓ Generated splash for ${folder} (${width}x${height})`);
  }

  console.log('✨ All Android launcher and splash screen assets generated successfully!\n');
}

generateAllAssets().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
