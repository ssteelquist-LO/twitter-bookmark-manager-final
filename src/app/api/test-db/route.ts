import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // First test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Then test if our tables exist
    let tablesExist = false;
    try {
      await prisma.user.count();
      await prisma.bookmark.count();
      tablesExist = true;
    } catch (tableError) {
      console.log('Tables not found, might need migration:', tableError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result,
      tablesExist,
      needsMigration: !tablesExist,
      timestamp: new Date().toISOString(),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      }
    }, { status: 500 });
  }
}