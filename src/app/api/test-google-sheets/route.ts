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

    // Test Google Sheets configuration
    const hasGoogleEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
    const hasGoogleKey = !!process.env.GOOGLE_PRIVATE_KEY;
    
    const emailPreview = process.env.GOOGLE_CLIENT_EMAIL 
      ? `${process.env.GOOGLE_CLIENT_EMAIL.split('@')[0]}@...`
      : 'NOT_SET';

    const keyPreview = process.env.GOOGLE_PRIVATE_KEY
      ? `${process.env.GOOGLE_PRIVATE_KEY.substring(0, 50)}...`
      : 'NOT_SET';

    return NextResponse.json({
      success: true,
      message: 'Google Sheets configuration check',
      config: {
        hasGoogleEmail,
        hasGoogleKey,
        emailPreview,
        keyPreview,
        keyStartsWith: process.env.GOOGLE_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----') || false,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking Google Sheets config:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}