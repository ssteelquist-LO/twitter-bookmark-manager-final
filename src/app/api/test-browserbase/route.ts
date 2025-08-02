import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Browserbase configuration
    const hasBrowserbaseKey = !!process.env.BROWSERBASE_API_KEY;
    const hasBrowserbaseProject = !!process.env.BROWSERBASE_PROJECT_ID;
    
    const apiKeyPreview = process.env.BROWSERBASE_API_KEY 
      ? `${process.env.BROWSERBASE_API_KEY.substring(0, 10)}...`
      : 'NOT_SET';

    return NextResponse.json({
      success: true,
      message: 'Browserbase configuration check',
      config: {
        hasBrowserbaseKey,
        hasBrowserbaseProject,
        apiKeyPreview,
        projectId: process.env.BROWSERBASE_PROJECT_ID || 'NOT_SET',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking Browserbase config:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}