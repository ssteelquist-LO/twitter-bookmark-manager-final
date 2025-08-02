import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running database migration...');
    
    // Push the schema to the database
    // This is equivalent to `prisma db push` but can be run from the API
    await prisma.$executeRaw`
      -- Create User table if not exists
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "name" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await prisma.$executeRaw`
      -- Create Account table if not exists  
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
      );
    `;

    await prisma.$executeRaw`
      -- Create Session table if not exists
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;

    await prisma.$executeRaw`
      -- Create VerificationToken table if not exists
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expires" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
      );
    `;

    await prisma.$executeRaw`
      -- Create Bookmark table if not exists
      CREATE TABLE IF NOT EXISTS "Bookmark" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "tweetId" TEXT NOT NULL,
        "tweetUrl" TEXT NOT NULL,
        "authorHandle" TEXT NOT NULL,
        "authorName" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "bookmarkedAt" TIMESTAMP(3) NOT NULL,
        "category" TEXT,
        "summary" TEXT,
        "sentiment" TEXT,
        "keywords" TEXT,
        "isThread" BOOLEAN NOT NULL DEFAULT false,
        "threadSummary" TEXT,
        "exportedToSheets" BOOLEAN NOT NULL DEFAULT false,
        "exportedAt" TIMESTAMP(3),
        CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Bookmark_userId_tweetId_key" UNIQUE ("userId", "tweetId")
      );
    `;

    await prisma.$executeRaw`
      -- Create indexes if not exist
      CREATE INDEX IF NOT EXISTS "Bookmark_userId_idx" ON "Bookmark"("userId");
      CREATE INDEX IF NOT EXISTS "Bookmark_category_idx" ON "Bookmark"("category");
      CREATE INDEX IF NOT EXISTS "Bookmark_bookmarkedAt_idx" ON "Bookmark"("bookmarkedAt");
    `;

    console.log('Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}