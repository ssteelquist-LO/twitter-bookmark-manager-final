import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processAnalysisJobs } from '@/lib/queue';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing analysis queue manually...');
    
    const processedCount = await processAnalysisJobs();

    console.log(`Processed ${processedCount} analysis jobs`);

    return NextResponse.json({
      message: `Successfully processed ${processedCount} analysis jobs`,
      processedCount,
    });

  } catch (error) {
    console.error('Error processing analysis queue:', error);
    return NextResponse.json(
      { error: 'Failed to process queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}