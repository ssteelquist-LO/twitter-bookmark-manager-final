# API Setup Guide for Twitter Bookmark Manager

## Required API Keys

### 1. Twitter API (developer.twitter.com)
```env
TWITTER_API_KEY="your-api-key"
TWITTER_API_SECRET="your-api-secret"
TWITTER_BEARER_TOKEN="your-bearer-token"
TWITTER_ACCESS_TOKEN="your-access-token"
TWITTER_ACCESS_SECRET="your-access-token-secret"
```

**Setup Steps:**
1. Go to https://developer.twitter.com
2. Create new app or use existing
3. Set OAuth 1.0a callback: `http://localhost:3000/api/auth/callback/twitter`
4. For production: `https://your-domain.com/api/auth/callback/twitter`
5. Generate all required tokens from "Keys and Tokens" tab

### 2. OpenAI API (platform.openai.com)
```env
OPENAI_API_KEY="sk-..."
```

**Setup Steps:**
1. Go to https://platform.openai.com
2. Create account and navigate to API Keys
3. Create new API key
4. Copy the key (starts with sk-)

### 3. Google Sheets API (console.cloud.google.com)
```env
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_SHEET_ID="your-sheet-id-from-url"
```

**Setup Steps:**
1. Go to Google Cloud Console
2. Create project and enable Google Sheets API
3. Create Service Account credentials
4. Download JSON key file and extract client_email and private_key
5. Create a Google Sheet and extract ID from URL

### 4. Upstash Redis (upstash.com) - Optional for Local
```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Setup Steps:**
1. Go to https://upstash.com
2. Create Redis database (free tier available)
3. Copy REST URL and Token

### 5. Additional Required Variables
```env
NEXTAUTH_SECRET="your-random-secret-32-chars+"
CRON_SECRET="your-cron-protection-secret"
```

Generate random secrets:
```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For CRON_SECRET  
openssl rand -hex 32
```

## Testing Your Setup

Once you have the API keys:

1. Update your `.env.local` file with the real values
2. Restart the development server: `npm run dev`
3. Try the "Sign in with Twitter" button
4. Test bookmark sync functionality
5. Test export to Google Sheets

## Production Deployment (Vercel)

1. Push your code to GitHub
2. Connect to Vercel
3. Add Vercel Postgres add-on
4. Set all environment variables in Vercel dashboard
5. Deploy!

## Troubleshooting

- **Twitter Auth Issues**: Check callback URL matches exactly
- **OpenAI API Issues**: Verify API key starts with sk- and has sufficient credits
- **Google Sheets Issues**: Ensure service account has access to the sheet
- **Redis Issues**: Local development works without Redis (uses file-based queue)