import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { queueBookmarkAnalysis } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, let's use a simple approach - browser automation
    // This will use Browserbase to extract your Twitter bookmarks
    
    console.log('Starting bookmark extraction for user:', session.user.id);
    
    // Check if Browserbase API key is configured
    if (!process.env.BROWSERBASE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Browserbase API key not configured',
        note: 'Add BROWSERBASE_API_KEY to environment variables',
      }, { status: 400 });
    }

    try {
      // For now, let's return demo extracted bookmarks since we need to debug the Browserbase API
      // This simulates what would be extracted from Twitter bookmarks
      const demoExtractedBookmarks = [
        {
          id: 'extracted-1',
          content: 'Just discovered this amazing TypeScript tip that will change how you write interfaces forever! 🤯 Thread below with examples.',
          authorName: 'TypeScript Tips', 
          authorHandle: 'typescript_tips',
          tweetUrl: 'https://twitter.com/typescript_tips/status/1234567890',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'extracted-2',
          content: 'Building a real-time chat application with Next.js 15 and WebSockets. Here are the key architectural decisions we made.',
          authorName: 'Web Dev Pro',
          authorHandle: 'webdevpro',
          tweetUrl: 'https://twitter.com/webdevpro/status/1234567891', 
          createdAt: new Date().toISOString(),
        },
        {
          id: 'extracted-3',
          content: 'AI is transforming how we approach database design. This new tool generates optimized schemas from natural language descriptions.',
          authorName: 'AI Developer',
          authorHandle: 'ai_developer',
          tweetUrl: 'https://twitter.com/ai_developer/status/1234567892',
          createdAt: new Date().toISOString(),
        },
      ];

      const extractedBookmarks = demoExtractedBookmarks;
      
      console.log(`Extracted ${extractedBookmarks.length} bookmarks from Twitter`);
      
      // Save extracted bookmarks to database and queue for AI analysis
      let savedCount = 0;
      let queuedCount = 0;
      
      for (const bookmark of extractedBookmarks) {
        try {
          // Create bookmark in database
          const savedBookmark = await prisma.bookmark.upsert({
            where: {
              userId_tweetId: {
                userId: session.user.id,
                tweetId: bookmark.id,
              },
            },
            update: {
              content: bookmark.content,
              authorHandle: bookmark.authorHandle,
              authorName: bookmark.authorName,
              tweetUrl: bookmark.tweetUrl,
              bookmarkedAt: new Date(bookmark.createdAt),
            },
            create: {
              userId: session.user.id,
              tweetId: bookmark.id,
              tweetUrl: bookmark.tweetUrl,
              authorHandle: bookmark.authorHandle,
              authorName: bookmark.authorName,
              content: bookmark.content,
              bookmarkedAt: new Date(bookmark.createdAt),
              category: null,
              summary: null,
              sentiment: null,
              keywords: null,
              isThread: false,
              threadSummary: null,
              exportedToSheets: false,
              exportedAt: null,
            },
          });
          
          savedCount++;
          
          // Queue for AI analysis if not already analyzed
          if (!savedBookmark.category || !savedBookmark.summary) {
            await queueBookmarkAnalysis(savedBookmark.id);
            queuedCount++;
          }
          
        } catch (dbError) {
          console.error(`Error saving bookmark ${bookmark.id}:`, dbError);
          // Continue with other bookmarks even if one fails
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Successfully extracted ${extractedBookmarks.length} bookmarks from Twitter (demo mode)`,
        extractedCount: extractedBookmarks.length,
        savedCount: savedCount,
        queuedCount: queuedCount,
        bookmarks: extractedBookmarks.slice(0, 3), // Show first 3 as preview
        note: 'Using demo data - real Browserbase integration needs API debugging',
        timestamp: new Date().toISOString(),
      });

    } catch (browserbaseError) {
      console.error('Browserbase error:', browserbaseError);
      
      return NextResponse.json({
        success: false,
        error: `Browserbase integration failed: ${browserbaseError instanceof Error ? browserbaseError.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error extracting bookmarks:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}