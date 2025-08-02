import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test table access
    const userCount = await prisma.user.count();
    const bookmarkCount = await prisma.bookmark.count();
    
    return NextResponse.json({
      status: 'connected',
      message: 'Database connection successful',
      tables: {
        users: userCount,
        bookmarks: bookmarkCount
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Database connection failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'failed',
      error: errorMessage,
      isConnectivityIssue: errorMessage.includes("Can't reach database server"),
      timestamp: new Date().toISOString(),
      suggestion: errorMessage.includes("Can't reach database server") 
        ? "Database server is unreachable. Check Supabase status and connection settings."
        : "Database connection failed. Check credentials and schema."
    }, { status: 500 });
  }
}