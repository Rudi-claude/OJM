const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// 오렌지 배경에 밥그릇 모양의 간단한 SVG 아이콘
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 -->
  <rect width="512" height="512" rx="100" fill="#f97316"/>

  <!-- 밥그릇 -->
  <ellipse cx="256" cy="320" rx="140" ry="60" fill="white"/>
  <path d="M116 320 Q116 400 256 400 Q396 400 396 320" fill="white"/>

  <!-- 밥 (둥근 부분) -->
  <ellipse cx="256" cy="280" rx="120" ry="50" fill="#fef3c7"/>

  <!-- 김가루/토핑 -->
  <circle cx="220" cy="270" r="15" fill="#374151"/>
  <circle cx="280" cy="285" r="12" fill="#374151"/>
  <circle cx="250" cy="260" r="10" fill="#374151"/>

  <!-- 연기 -->
  <path d="M200 200 Q190 170 210 150" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M256 190 Q246 160 266 140" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
  <path d="M312 200 Q302 170 322 150" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>

  <!-- ? 마크 -->
  <text x="400" y="150" font-size="80" font-weight="bold" fill="white" font-family="Arial">?</text>
</svg>
`;

async function generateIcons() {
  // 출력 디렉토리 확인
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 각 사이즈별 아이콘 생성
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  console.log('\n모든 아이콘이 생성되었습니다!');
}

generateIcons().catch(console.error);
