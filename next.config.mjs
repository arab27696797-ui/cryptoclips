/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ← НОВАЯ СТРОКА для Railway!
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
}

export default nextConfig
