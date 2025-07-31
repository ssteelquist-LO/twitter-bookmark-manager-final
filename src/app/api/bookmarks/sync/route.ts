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

    const twitterService = new TwitterService();
    const bookmarks = await twitterService.getUserBookmarks(session.user.id);
    
    let syncedCount = 0;
    let queuedCount = 0;
    
    for (const bookmark of bookmarks) {
      const existingBookmark = await prisma.bookmark.findUnique({
        where: { tweetId: bookmark.id }
      });
      
      if (existingBookmark) continue;

      const savedBookmark = await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          tweetId: bookmark.id,
          tweetUrl: bookmark.url,
          author: bookmark.author.name,
          content: bookmark.content,
          bookmarkedAt: new Date(bookmark.createdAt),
        },
      });

      await queueBookmarkAnalysis(savedBookmark.id);
      syncedCount++;
      queuedCount++;
    }

    return NextResponse.json({
      message: `Successfully synced ${syncedCount} new bookmarks`,
      syncedCount,
      queuedForAnalysis: queuedCount,
    });
  } catch (error) {
    console.error('Error syncing bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to sync bookmarks' },
      { status: 500 }
    );
  }
}