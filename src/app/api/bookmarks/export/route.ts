import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleSheetsService, SheetBookmark } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId } = await request.json();

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { bookmarkedAt: 'desc' },
    });

    const sheetBookmarks: SheetBookmark[] = bookmarks.map(bookmark => ({
      id: bookmark.id,
      tweetUrl: bookmark.tweetUrl,
      author: `${bookmark.authorName} (@${bookmark.authorHandle})`,
      content: bookmark.content,
      category: bookmark.category || 'Uncategorized',
      summary: bookmark.summary || '',
      sentiment: bookmark.sentiment || 'neutral',
      keywords: bookmark.keywords || '',
      isThread: bookmark.isThread,
      threadSummary: bookmark.threadSummary || undefined,
      bookmarkedAt: bookmark.bookmarkedAt.toISOString(),
    }));

    const sheetsService = new GoogleSheetsService();
    let finalSpreadsheetId: string;

    if (spreadsheetId) {
      await sheetsService.updateExistingSheet(spreadsheetId, sheetBookmarks);
      finalSpreadsheetId = spreadsheetId;
    } else {
      finalSpreadsheetId = await sheetsService.createBookmarkSheet(sheetBookmarks);
    }

    await prisma.bookmark.updateMany({
      where: { userId: session.user.id },
      data: {
        exportedToSheets: true,
        exportedAt: new Date(),
      },
    });

    return NextResponse.json({
      spreadsheetId: finalSpreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`,
      exportedCount: sheetBookmarks.length,
    });
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    return NextResponse.json(
      { error: 'Failed to export to Google Sheets' },
      { status: 500 }
    );
  }
}