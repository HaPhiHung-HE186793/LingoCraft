import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode for catching React issues early
  reactStrictMode: true,
  // No standalone yet — added when deployment is configured
  // Per spec: "không cài @latest một cách không kiểm tra"
};

export default nextConfig;
