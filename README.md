# Twitter Bookmark Manager

A modern Twitter bookmark management application with AI-powered analysis, built for Vercel's serverless infrastructure.

🚀 **Status: Successfully deployed and ready!**

## ✨ Features

- **🔄 Automatic Sync**: Fetches your Twitter bookmarks every 6 hours
- **🧠 AI Analysis**: Uses Claude AI to categorize, summarize, and analyze sentiment
- **🧵 Thread Detection**: Automatically detects and summarizes Twitter threads
- **📊 Smart Export**: Export to Google Sheets with organized categories and analytics
- **🔍 Search & Filter**: Real-time search and category-based filtering
- **⚡ Serverless-First**: Optimized for Vercel's free tier with background processing

## 🚀 Quick Start (No External Services Required)

Get started immediately without setting up external services:

```bash
# Clone and install
git clone <your-repo-url>
cd twitter-bookmark-manager
npm install

# Basic setup
cp .env.example .env.local
# Edit .env.local and set:
# DATABASE_URL="file:./dev.db"
# NEXTAUTH_SECRET="your-random-secret-here"

# Initialize database
npm run db:generate
npm run db:push

# Start development
npm run dev
```

Visit `http://localhost:3000` and the app will run with:
- ✅ Local SQLite database
- ✅ File-based queue system (no Redis needed)
- ✅ Basic functionality without external APIs

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Vercel Postgres (production), SQLite (development)
- **Queue**: Upstash Redis (production), File-based (development)
- **AI**: Anthropic Claude API
- **Authentication**: NextAuth.js with Twitter OAuth
- **Deployment**: Vercel with automated cron jobs

## 📚 Full Setup Guide

For production deployment with all features, see the complete setup guide in [CLAUDE.md](./CLAUDE.md).

## 🔧 Environment Variables

### Required (Minimum)
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret"
```

### Optional (Full Features)
```bash
# Twitter API
TWITTER_API_KEY="your-key"
TWITTER_API_SECRET="your-secret"
TWITTER_ACCESS_TOKEN="your-token"
TWITTER_ACCESS_SECRET="your-token-secret"

# Claude AI
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Google Sheets
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Production Only
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
CRON_SECRET="your-cron-secret"
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # Serverless API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── bookmarks/     # Bookmark management
│   │   ├── cron/          # Vercel cron jobs
│   │   └── queue/         # Background queue APIs
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── BookmarkCard.tsx   # Individual bookmark display
│   ├── BookmarkList.tsx   # Main listing with filters
│   └── QueueStatus.tsx    # Background job status
└── lib/                   # Core libraries
    ├── auth.ts            # NextAuth configuration
    ├── claude.ts          # AI analysis
    ├── queue.ts           # Background jobs
    ├── local-queue.ts     # Development queue
    ├── redis.ts           # Production queue
    └── twitter.ts         # Twitter API integration
```

## 🎯 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Database | SQLite | Vercel Postgres |
| Queue System | File-based | Upstash Redis |
| Job Processing | Manual button | Automated cron |
| Authentication | Optional | Twitter OAuth |
| External APIs | Optional/Mock | Required |

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete technical documentation
- **[.env.example](./.env.example)** - Environment variable reference

## 🚀 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/twitter-bookmark-manager)

See [CLAUDE.md](./CLAUDE.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking: `npm run lint && npm run type-check`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

