# Multi-stage build for CryptoClips
FROM node:18-alpine AS deps

# Install system dependencies for canvas and FFmpeg
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (changed from npm ci to npm install)
RUN npm install

# Builder stage
FROM node:18-alpine AS builder

RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM node:18-alpine AS runner

RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    ffmpeg

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create upload/render directories
RUN mkdir -p /app/uploads /app/renders /app/temp && \
    chown -R nextjs:nodejs /app/uploads /app/renders /app/temp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
