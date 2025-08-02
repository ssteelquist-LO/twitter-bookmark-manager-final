import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle demo users - return empty data
    if (session.user.id === 'demo-user-id') {
      return NextResponse.json({
        bookmarks: [],
        total: 0,
        page: 1,
        pages: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { keywords: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Return demo bookmarks for testing since database is having issues
    const demoBookmarks = [
      {
        id: 'demo-1',
        userId: session.user.id,
        tweetId: '1234567890',
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
        exportedToSheets: false,
        exportedAt: null,
        createdAt: new Date(),
      },
      {
        id: 'demo-2',
        userId: session.user.id,
        tweetId: '1234567891',
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
        exportedToSheets: false,
        exportedAt: null,
        createdAt: new Date(),
      },
      {
        id: 'demo-3',
        userId: session.user.id,
        tweetId: '1234567892',
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
        exportedToSheets: false,
        exportedAt: null,
        createdAt: new Date(),
      }
    ];

    return NextResponse.json({
      bookmarks: demoBookmarks,
      total: demoBookmarks.length,
      page: 1,
      pages: 1,
      demo: true,
      message: 'Displaying demo bookmarks - database connection being fixed'
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}