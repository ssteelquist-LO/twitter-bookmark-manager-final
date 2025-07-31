require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sample tweets that represent common bookmark categories
const sampleTweets = [
  {
    author: "Elon Musk",
    content: "Mars is looking more beautiful every day. Can't wait to see humans there in our lifetime. The engineering challenges are immense but solvable.",
    tweetId: "demo-1",
    tweetUrl: "https://twitter.com/elonmusk/status/demo-1"
  },
  {
    author: "Paul Graham",
    content: "The most important thing for startup founders: talk to your users. Not just once, but continuously. Build what they actually want, not what you think they want.",
    tweetId: "demo-2", 
    tweetUrl: "https://twitter.com/paulg/status/demo-2"
  },
  {
    author: "Naval",
    content: "Reading is faster than listening. Doing is faster than watching. The internet rewards unique knowledge. Compound your learnings.",
    tweetId: "demo-3",
    tweetUrl: "https://twitter.com/naval/status/demo-3"
  },
  {
    author: "OpenAI",
    content: "GPT-4 can now analyze images and generate code, stories, and essays. We're seeing amazing creativity from developers building new AI applications.",
    tweetId: "demo-4",
    tweetUrl: "https://twitter.com/openai/status/demo-4"
  },
  {
    author: "Vercel",
    content: "Deploy your Next.js app in seconds with zero configuration. Our new Edge Runtime makes your apps faster globally with automatic optimization.",
    tweetId: "demo-5",
    tweetUrl: "https://twitter.com/vercel/status/demo-5"
  }
];

async function createDemoUser() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        id: 'demo-user-id',
        email: 'demo@example.com',
        name: 'Demo User',
      },
    });
    return user;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
}

async function analyzeBookmark(bookmark) {
  try {
    console.log(`🤖 Analyzing: "${bookmark.content.substring(0, 50)}..."`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze this tweet and return JSON with: {"category": "single_word", "summary": "brief_summary", "sentiment": "positive/negative/neutral", "keywords": ["keyword1", "keyword2", "keyword3"]}'
        },
        {
          role: 'user',
          content: `Analyze this tweet: "${bookmark.content}"`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    
    const analysisText = response.choices[0]?.message?.content || '';
    console.log(`📝 Raw analysis: ${analysisText}`);
    
    // Parse the JSON response
    let analysis;
    try {
      const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.log('⚠️ Could not parse JSON, using fallback');
      analysis = {
        category: 'Technology',
        summary: bookmark.content.substring(0, 100),
        sentiment: 'neutral',
        keywords: ['technology', 'innovation']
      };
    }
    
    // Update bookmark with analysis
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: {
        category: analysis.category || 'Uncategorized',
        summary: analysis.summary || bookmark.content.substring(0, 100),
        sentiment: analysis.sentiment || 'neutral',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords.join(', ') : '',
      },
    });
    
    console.log(`✅ Category: ${analysis.category} | Sentiment: ${analysis.sentiment}\n`);
    return updatedBookmark;
    
  } catch (error) {
    console.error('Error analyzing bookmark:', error);
    return bookmark;
  }
}

async function createDemoData() {
  try {
    console.log('🚀 Creating demo bookmark data...\n');
    
    // 1. Create demo user
    console.log('👤 Creating demo user...');
    const user = await createDemoUser();
    console.log(`✅ Demo user created: ${user.name}\n`);
    
    // 2. Create sample bookmarks
    console.log('📚 Creating sample bookmarks...');
    const bookmarks = [];
    
    for (const tweet of sampleTweets) {
      const bookmark = await prisma.bookmark.upsert({
        where: { tweetId: tweet.tweetId },
        update: {},
        create: {
          userId: user.id,
          tweetId: tweet.tweetId,
          tweetUrl: tweet.tweetUrl,
          author: tweet.author,
          content: tweet.content,
          bookmarkedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
        },
      });
      
      bookmarks.push(bookmark);
      console.log(`📝 Created: @${tweet.author}`);
    }
    
    console.log(`✅ Created ${bookmarks.length} demo bookmarks\n`);
    
    // 3. Analyze bookmarks with OpenAI
    console.log('🤖 Analyzing bookmarks with OpenAI...\n');
    
    for (const bookmark of bookmarks) {
      await analyzeBookmark(bookmark);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause to avoid rate limits
    }
    
    // 4. Show final results
    console.log('📊 Final Results:');
    const analyzedBookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { bookmarkedAt: 'desc' },
    });
    
    console.log('\n' + '='.repeat(80));
    analyzedBookmarks.forEach((bookmark, i) => {
      console.log(`\n${i + 1}. @${bookmark.author}`);
      console.log(`   Tweet: "${bookmark.content.substring(0, 80)}..."`);
      console.log(`   📂 Category: ${bookmark.category}`);
      console.log(`   😊 Sentiment: ${bookmark.sentiment}`);
      console.log(`   🏷️  Keywords: ${bookmark.keywords}`);
      console.log(`   📝 Summary: ${bookmark.summary?.substring(0, 100)}...`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Demo data created successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Visit http://localhost:3000');
    console.log('2. Click "Demo Login (Local Testing)"');
    console.log('3. View your analyzed bookmarks!');
    
  } catch (error) {
    console.error('❌ Demo data creation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData();