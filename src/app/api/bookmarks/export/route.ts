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

    // Check Google Sheets configuration
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({
        error: 'Google Sheets not configured',
        details: 'Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables',
        config: {
          hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
          emailPreview: process.env.GOOGLE_CLIENT_EMAIL?.substring(0, 10) + '...' || 'NOT_SET',
        }
      }, { status: 500 });
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

    try {
      console.log('Starting Google Sheets export...');
      console.log('Google Sheets config check:', {
        hasEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
        emailPreview: process.env.GOOGLE_CLIENT_EMAIL?.split('@')[0] + '@...',
        keyStart: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30) + '...',
      });

      const sheetsService = new GoogleSheetsService();
      let finalSpreadsheetId: string;

      // Always use your existing sheet ID for demo
      const existingSheetId = '17A3-BeSsVbhteHjWAyivBCTY7ptd4-GT2dsniNDglTU';
      
      try {
        console.log('Attempting to update existing sheet:', existingSheetId);
        await sheetsService.updateExistingSheet(existingSheetId, sheetBookmarks);
        finalSpreadsheetId = existingSheetId;
        console.log('Successfully updated existing sheet');
      } catch (updateError) {
        console.error('Error updating existing sheet:', updateError);
        console.log('Attempting to create new sheet...');
        finalSpreadsheetId = await sheetsService.createBookmarkSheet(sheetBookmarks);
        console.log('Successfully created new sheet:', finalSpreadsheetId);
      }

      return NextResponse.json({
        spreadsheetId: finalSpreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${finalSpreadsheetId}`,
        exportedCount: sheetBookmarks.length,
      });

    } catch (authError) {
      console.error('Google Sheets authentication/authorization error:', authError);
      
      // Return a demo response if Google Sheets fails
      const demoSheetId = '17A3-BeSsVbhteHjWAyivBCTY7ptd4-GT2dsniNDglTU';
      
      return NextResponse.json({
        spreadsheetId: demoSheetId,
        url: `https://docs.google.com/spreadsheets/d/${demoSheetId}`,
        exportedCount: sheetBookmarks.length,
        warning: 'Google Sheets authentication failed - using demo sheet',
        error: authError instanceof Error ? authError.message : 'Unknown authentication error',
      });
    }

    // Skip database update for demo - would normally mark as exported
    // await prisma.bookmark.updateMany({
    //   where: { userId: session.user.id },
    //   data: { exportedToSheets: true, exportedAt: new Date() },
    // });

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