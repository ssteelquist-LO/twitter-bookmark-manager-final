// Cost and usage protection limits
export const USAGE_LIMITS = {
  // OpenAI API limits
  OPENAI: {
    MAX_TOKENS_ANALYSIS: 1000,
    MAX_TOKENS_CATEGORIZATION: 500,
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_DAY: 1000,
    RATE_LIMIT_DELAY: 1000, // ms between requests
  },
  
  // Queue processing limits  
  QUEUE: {
    MAX_CONCURRENT_JOBS: 5,
    MAX_PENDING_JOBS: 500,
    MAX_RETRIES: 3,
    BATCH_SIZE: 10,
  },
  
  // Bookmark sync limits
  SYNC: {
    MAX_BOOKMARKS_PER_SYNC: 1000,
    MAX_SYNCS_PER_DAY: 24, // Every hour max
    SYNC_COOLDOWN: 3600000, // 1 hour in ms
  },
  
  // Database query limits
  DATABASE: {
    MAX_RESULTS_PER_PAGE: 100,
    DEFAULT_PAGE_SIZE: 20,
    MAX_SEARCH_RESULTS: 500,
  },
  
  // Emergency shutoffs
  EMERGENCY: {
    DAILY_COST_THRESHOLD: 10, // USD
    HOURLY_REQUEST_THRESHOLD: 500,
    ENABLE_SHUTOFFS: process.env.NODE_ENV === 'production',
  }
};

// Usage tracking
let dailyUsage = {
  openaiRequests: 0,
  tokensUsed: 0,
  lastReset: new Date().toDateString(),
};

export function trackOpenAIUsage(tokens: number) {
  const today = new Date().toDateString();
  
  // Reset daily counter
  if (dailyUsage.lastReset !== today) {
    dailyUsage = {
      openaiRequests: 0,
      tokensUsed: 0,
      lastReset: today,
    };
  }
  
  dailyUsage.openaiRequests++;
  dailyUsage.tokensUsed += tokens;
  
  // Check limits
  if (dailyUsage.openaiRequests > USAGE_LIMITS.OPENAI.MAX_REQUESTS_PER_DAY) {
    throw new Error('Daily OpenAI request limit exceeded');
  }
  
  // Estimate cost (rough calculation)
  const estimatedCost = (tokens * 0.002) / 1000; // $0.002 per 1K tokens
  console.log(`📊 Usage: ${dailyUsage.openaiRequests} requests, ${dailyUsage.tokensUsed} tokens, ~$${estimatedCost.toFixed(4)} cost`);
}

export function getDailyUsage() {
  return dailyUsage;
}

export function checkRateLimit(lastRequestTime: number) {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < USAGE_LIMITS.OPENAI.RATE_LIMIT_DELAY) {
    const waitTime = USAGE_LIMITS.OPENAI.RATE_LIMIT_DELAY - timeSinceLastRequest;
    throw new Error(`Rate limit: wait ${waitTime}ms`);
  }
}