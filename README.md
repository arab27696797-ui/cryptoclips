# CryptoClips

Turn crypto news into branded video content in minutes. AI-powered script generation and video creation for crypto creators.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with jose
- **AI**: OpenRouter (GPT-4.1 + Claude 3.7 Sonnet fallback)
- **TTS**: Microsoft Edge TTS (free)
- **Video**: FFmpeg
- **UI**: Tailwind CSS + Radix UI
- **Deployment**: Railway (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenRouter API key
- FFmpeg installed

### Local Development

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd cryptoclips
## 🎨 Video Template System

CryptoClips uses a sophisticated template generation system based on **Golden Ratio (φ = 1.618)** principles for maximum visual appeal.

### Template Styles

10 unique styles, each available in 3 sentiments (bullish/bearish/neutral):

1. **Crypto Matrix** - Matrix-style falling crypto symbols
2. **Bull Run** - Ascending lines and green theme
3. **Bear Market** - Descending lines and red theme
4. **Golden Spiral** - Fibonacci spiral animation
5. **Particle Flow** - Flowing particles along golden paths
6. **Geometric Harmony** - Rotating geometric shapes
7. **Gradient Wave** - Flowing gradient waves
8. **Bitcoin Network** - Network nodes and connections
9. **Neon Pulse** - Pulsing neon circles
10. **Data Stream** - Streaming data visualization

### Generate Templates

**First deployment:**

```bash
# After Railway deployment, run this ONCE to generate all templates:
npm run generate-templates
