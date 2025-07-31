import { NextRequest, NextResponse } from 'next/server';
import { processAnalysisJobs } from '@/lib/queue';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing analysis queue...');
    
    const processedCount = await processAnalysisJobs();

    console.log(`Processed ${processedCount} analysis jobs`);

    return NextResponse.json({
      message: `Successfully processed ${processedCount} analysis jobs`,
      processedCount,
    });

  } catch (error) {
    console.error('Error processing analysis queue:', error);
    return NextResponse.json(
      { error: 'Failed to process queue', details: error.message },
      { status: 500 }
    );
  }
}