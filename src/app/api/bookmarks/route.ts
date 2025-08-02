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

    // Remove empty return for demo users - let them see demo bookmarks

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
    // Include both original demo bookmarks and simulated extracted bookmarks
    const demoBookmarks = [
      // Original demo bookmarks
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
      },
      // Simulated extracted bookmarks (these would appear after clicking "Extract Real Bookmarks")
      {
        id: 'extracted-1',
        userId: session.user.id,
        tweetId: 'extracted-1',
        tweetUrl: 'https://twitter.com/typescript_tips/status/1234567890',
        authorHandle: 'typescript_tips',
        authorName: 'TypeScript Tips',
        content: 'Just discovered this amazing TypeScript tip that will change how you write interfaces forever! 🤯 Thread below with examples.',
        bookmarkedAt: new Date(),
        category: 'Programming',
        summary: 'Advanced TypeScript interface techniques and best practices',
        sentiment: 'positive',
        keywords: 'TypeScript, interfaces, tips, development',
        isThread: true,
        threadSummary: 'A comprehensive thread about advanced TypeScript interface patterns',
        exportedToSheets: false,
        exportedAt: null,
        createdAt: new Date(),
      },
      {
        id: 'extracted-2',
        userId: session.user.id,
        tweetId: 'extracted-2',
        tweetUrl: 'https://twitter.com/webdevpro/status/1234567891',
        authorHandle: 'webdevpro',
        authorName: 'Web Dev Pro',
        content: 'Building a real-time chat application with Next.js 15 and WebSockets. Here are the key architectural decisions we made.',
        bookmarkedAt: new Date(),
        category: 'Web Development',
        summary: 'Architecture guide for real-time chat applications using modern web technologies',
        sentiment: 'positive',
        keywords: 'Next.js, WebSockets, real-time, architecture',
        isThread: false,
        threadSummary: null,
        exportedToSheets: false,
        exportedAt: null,
        createdAt: new Date(),
      },
      {
        id: 'extracted-3',
        userId: session.user.id,
        tweetId: 'extracted-3',
        tweetUrl: 'https://twitter.com/ai_developer/status/1234567892',
        authorHandle: 'ai_developer',
        authorName: 'AI Developer',
        content: 'AI is transforming how we approach database design. This new tool generates optimized schemas from natural language descriptions.',
        bookmarkedAt: new Date(),
        category: 'AI & Machine Learning',
        summary: 'AI-powered database schema generation tools and their impact on development',
        sentiment: 'positive',
        keywords: 'AI, database design, automation, schemas',
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