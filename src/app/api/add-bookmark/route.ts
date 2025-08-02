import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tweetUrl } = await request.json();
    
    if (!tweetUrl || !tweetUrl.includes('twitter.com') && !tweetUrl.includes('x.com')) {
      return NextResponse.json({ error: 'Invalid Twitter URL' }, { status: 400 });
    }

    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/\/status\/(\d+)/);
    if (!tweetIdMatch) {
      return NextResponse.json({ error: 'Could not extract tweet ID from URL' }, { status: 400 });
    }
    
    const tweetId = tweetIdMatch[1];
    
    // For now, create a bookmark with basic info
    // In a real implementation, we'd fetch the tweet content from Twitter API
    const bookmark = {
      id: `manual-${tweetId}`,
      userId: session.user.id,
      tweetId: tweetId,
      tweetUrl: tweetUrl,
      authorHandle: 'unknown',
      authorName: 'Unknown User',
      content: `Manually added tweet: ${tweetUrl}`,
      bookmarkedAt: new Date(),
      category: 'Manual',
      summary: 'Manually added bookmark - content to be analyzed',
      sentiment: 'neutral',
      keywords: 'manual, bookmark',
      isThread: false,
      threadSummary: null,
      exportedToSheets: false,
      exportedAt: null,
      createdAt: new Date(),
    };

    // For now, just return the bookmark data
    // Later we'd save to database and queue for AI analysis
    return NextResponse.json({
      success: true,
      message: 'Bookmark added successfully',
      bookmark: bookmark,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error adding bookmark:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}