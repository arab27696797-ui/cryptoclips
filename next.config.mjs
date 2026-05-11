/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    'prisma',
    '@prisma/client',
    'canvas',
    'fluent-ffmpeg',
    'edge-tts',
    '@ffmpeg-installer/ffmpeg',
  ],
  experimental: {},
}

export default nextConfig
