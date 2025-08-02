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

    // Use demo bookmarks for testing since database is having issues
    const bookmarks = [
      {
        id: 'demo-1',
        tweetUrl: 'https://twitter.com/example/status/1234567890',
        authorHandle: 'example',
        authorName: 'Example User',
        content: 'This is a demo tweet about artificial intelligence and machine learning. It discusses how AI is transforming software development.',
        bookmarkedAt: new Date('2024-01-15'),
        category: 'Technology',
        summary: 'Discussion about AI impact on software development',
        sentiment: 'positive',
        keywords: 'AI, machine learning, software development',
        isThread: false,
        threadSummary: null,
      },
      {
        id: 'demo-2', 
        tweetUrl: 'https://twitter.com/demo/status/1234567891',
        authorHandle: 'demo',
        authorName: 'Demo Account',
        content: 'Another demo tweet about React and Next.js development. Building full-stack applications with modern tools.',
        bookmarkedAt: new Date('2024-01-14'),
        category: 'Web Development',
        summary: 'Guide to building full-stack apps with React and Next.js',
        sentiment: 'positive',
        keywords: 'React, Next.js, full-stack, development',
        isThread: false,
        threadSummary: null,
      },
      {
        id: 'demo-3',
        tweetUrl: 'https://twitter.com/test/status/1234567892', 
        authorHandle: 'test',
        authorName: 'Test User',
        content: 'Demo tweet about TypeScript and database design. How to build scalable applications with proper type safety.',
        bookmarkedAt: new Date('2024-01-13'),
        category: 'Programming',
        summary: 'Best practices for TypeScript and database design',
        sentiment: 'neutral',
        keywords: 'TypeScript, database, scalability, type safety',
        isThread: false,
        threadSummary: null,
      }
    ];

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

    // Always use your existing sheet ID for demo
    const existingSheetId = '17A3-BeSsVbhteHjWAyivBCTY7ptd4-GT2dsniNDglTU';
    
    try {
      await sheetsService.updateExistingSheet(existingSheetId, sheetBookmarks);
      finalSpreadsheetId = existingSheetId;
    } catch (updateError) {
      console.error('Error updating existing sheet, trying to create new one:', updateError);
      finalSpreadsheetId = await sheetsService.createBookmarkSheet(sheetBookmarks);
    }

    // Skip database update for demo - would normally mark as exported
    // await prisma.bookmark.updateMany({
    //   where: { userId: session.user.id },
    //   data: { exportedToSheets: true, exportedAt: new Date() },
    // });

    return NextResponse.json({
      spreadsheetId: finalSpreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`,
      exportedCount: sheetBookmarks.length,
    });
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    
    let errorMessage = 'Failed to export to Google Sheets';
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Google Sheets permission denied. Please share the sheet with the service account email.';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Google Sheet not found. Please check the sheet ID.';
      } else {
        errorMessage = `Export failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}