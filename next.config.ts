import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Turbopack 설정 (Next.js 16+ 호환)
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // 개발 모드에서는 비활성화
});

export default pwaConfig(nextConfig);
