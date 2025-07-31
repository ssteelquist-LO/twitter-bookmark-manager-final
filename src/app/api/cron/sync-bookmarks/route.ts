import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TwitterService } from '@/lib/twitter';
import { queueBookmarkAnalysis } from '@/lib/queue';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting scheduled bookmark sync...');
    
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          where: { provider: 'twitter' }
        }
      }
    });

    let totalSynced = 0;

    for (const user of users) {
      try {
        const twitterAccount = user.accounts.find(acc => acc.provider === 'twitter');
        if (!twitterAccount?.access_token) {
          console.log(`Skipping user ${user.id} - no Twitter access token`);
          continue;
        }

        const twitterService = new TwitterService();
        const bookmarks = await twitterService.getUserBookmarks(user.id);
        
        let userSyncedCount = 0;
        
        for (const bookmark of bookmarks) {
          const existingBookmark = await prisma.bookmark.findUnique({
            where: { tweetId: bookmark.id }
          });
          
          if (existingBookmark) continue;

          const savedBookmark = await prisma.bookmark.create({
            data: {
              userId: user.id,
              tweetId: bookmark.id,
              tweetUrl: bookmark.url,
              author: bookmark.author.name,
              content: bookmark.content,
              bookmarkedAt: new Date(bookmark.createdAt),
            },
          });

          await queueBookmarkAnalysis(savedBookmark.id);
          userSyncedCount++;
        }

        console.log(`Synced ${userSyncedCount} bookmarks for user ${user.id}`);
        totalSynced += userSyncedCount;

      } catch (userError) {
        console.error(`Error syncing bookmarks for user ${user.id}:`, userError);
      }
    }

    console.log(`Completed scheduled sync: ${totalSynced} total bookmarks`);

    return NextResponse.json({
      message: `Successfully synced ${totalSynced} bookmarks across ${users.length} users`,
      totalSynced,
      usersProcessed: users.length,
    });

  } catch (error) {
    console.error('Error in scheduled bookmark sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync bookmarks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}