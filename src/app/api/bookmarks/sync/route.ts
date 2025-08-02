import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TwitterService } from '@/lib/twitter';
import { queueBookmarkAnalysis } from '@/lib/queue';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Twitter API connection first
    console.log('Testing Twitter API connection...');
    const twitterService = new TwitterService();
    
    let bookmarks;
    try {
      bookmarks = await twitterService.getUserBookmarks(session.user.id);
      console.log(`Fetched ${bookmarks.length} bookmarks from Twitter API`);
    } catch (twitterError) {
      console.error('Twitter API Error:', twitterError);
      return NextResponse.json({
        error: `Twitter API failed: ${twitterError instanceof Error ? twitterError.message : 'Unknown error'}`,
        details: 'Please check your Twitter API credentials and permissions'
      }, { status: 400 });
    }
    
    // For now, just return the bookmarks we fetched (without saving to DB)
    // This tests if the Twitter API is working
    return NextResponse.json({
      message: `Successfully fetched ${bookmarks.length} bookmarks from Twitter`,
      syncedCount: 0,
      queuedForAnalysis: 0,
      bookmarks: bookmarks.slice(0, 3).map(b => ({
        id: b.id,
        content: b.content.substring(0, 100) + '...',
        author: b.author.name,
        url: b.url
      })),
      note: 'Database sync temporarily disabled - just testing Twitter API connection'
    });
  } catch (error) {
    console.error('Error syncing bookmarks:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Twitter API credentials not configured')) {
        return NextResponse.json(
          { error: 'Twitter API not configured. Please check your Twitter API credentials in environment variables.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes("Can't reach database server")) {
        return NextResponse.json(
          { error: 'Database connection failed. Please try again in a moment.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: `Sync failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to sync bookmarks - unknown error' },
      { status: 500 }
    );
  }
}