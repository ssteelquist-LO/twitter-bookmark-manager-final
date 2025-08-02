import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test basic Twitter API connection
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_SECRET!,
    });

    try {
      // Test 1: Get user info (should work with basic API)
      const userInfo = await client.v2.me();
      
      return NextResponse.json({
        success: true,
        message: 'Twitter API connection working',
        userInfo: {
          id: userInfo.data.id,
          username: userInfo.data.username,
          name: userInfo.data.name,
        },
        timestamp: new Date().toISOString(),
      });
      
    } catch (apiError) {
      console.error('Twitter API Error:', apiError);
      
      return NextResponse.json({
        success: false,
        error: `Twitter API failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        details: 'API credentials might be incorrect or expired',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing Twitter API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}