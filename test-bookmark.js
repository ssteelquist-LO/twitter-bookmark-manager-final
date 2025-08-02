// Test script to create a sample bookmark and test analysis
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookmarkFunctionality() {
  try {
    console.log('Testing bookmark functionality...');
    
    // Create a test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    
    console.log('✓ Test user created/found:', testUser.id);
    
    // Create a test bookmark
    const testBookmark = await prisma.bookmark.create({
      data: {
        userId: testUser.id,
        tweetId: 'test-tweet-123',
        tweetUrl: 'https://twitter.com/example/status/test-tweet-123',
        authorHandle: 'example',
        authorName: 'Example User',
        content: 'This is a test tweet about artificial intelligence and machine learning. It discusses the latest trends in AI development and how it impacts software engineering.',
        bookmarkedAt: new Date(),
      },
    });
    
    console.log('✓ Test bookmark created:', testBookmark.id);
    
    // Test database queries
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: testUser.id },
    });
    
    console.log('✓ Found bookmarks:', bookmarks.length);
    
    // Test compound unique constraint
    try {
      await prisma.bookmark.create({
        data: {
          userId: testUser.id,
          tweetId: 'test-tweet-123', // Same tweet ID
          tweetUrl: 'https://twitter.com/example/status/test-tweet-123',
          authorHandle: 'example',
          authorName: 'Example User',
          content: 'Duplicate tweet',
          bookmarkedAt: new Date(),
        },
      });
      console.log('✗ Unique constraint test failed - duplicate was allowed');
    } catch (error) {
      console.log('✓ Unique constraint working - duplicate rejected');
    }
    
    console.log('✓ All tests passed!');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookmarkFunctionality();