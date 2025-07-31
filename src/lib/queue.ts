import { SimpleQueue, QueueJob, isRedisAvailable } from './redis';
import { LocalQueue } from './local-queue';
import { prisma } from './prisma';
import { OpenAIService } from './openai';
import { TwitterService } from './twitter';

// Auto-detect environment and use appropriate queue
const analysisQueue = isRedisAvailable() 
  ? new SimpleQueue('bookmark_analysis')
  : new LocalQueue('bookmark_analysis');

export async function queueBookmarkAnalysis(bookmarkId: string): Promise<string> {
  try {
    return await analysisQueue.add({
      type: 'analyze_bookmark',
      data: { bookmarkId },
      maxAttempts: 3,
    });
  } catch (error) {
    console.warn('Queue not available, processing bookmark immediately:', error);
    // Fallback: process immediately if queue is not available
    await processBookmarkAnalysis(bookmarkId);
    return `immediate_${bookmarkId}`;
  }
}

export async function processAnalysisJobs(concurrency: number = 5): Promise<number> {
  try {
    return await analysisQueue.process(async (job: QueueJob) => {
      if (job.type === 'analyze_bookmark') {
        await processBookmarkAnalysis(job.data.bookmarkId);
      }
    }, concurrency);
  } catch (error) {
    console.warn('Queue processing not available:', error);
    return 0;
  }
}

async function processBookmarkAnalysis(bookmarkId: string): Promise<void> {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId }
    });

    if (!bookmark) {
      console.error(`Bookmark ${bookmarkId} not found`);
      return;
    }

    if (bookmark.category && bookmark.summary) {
      console.log(`Bookmark ${bookmarkId} already analyzed`);
      return;
    }

    console.log(`Analyzing bookmark ${bookmarkId}...`);

    const twitterService = new TwitterService();
    const openaiService = new OpenAIService();

    const isThread = await twitterService.isThread(bookmark.tweetId);
    let threadContent: string[] | undefined;
    
    if (isThread) {
      threadContent = await twitterService.getTweetThread(bookmark.tweetId);
    }

    const analysis = await openaiService.analyzeBookmark(
      bookmark.content,
      isThread,
      threadContent
    );

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        category: analysis.category,
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        keywords: analysis.keywords.join(', '),
        isThread: analysis.isThread,
        threadSummary: analysis.threadSummary,
      },
    });

    console.log(`Successfully analyzed bookmark ${bookmarkId}`);

  } catch (error) {
    console.error(`Error analyzing bookmark ${bookmarkId}:`, error);
    throw error;
  }
}

export async function getQueueStats() {
  try {
    const queueLength = await analysisQueue.getQueueLength();
    const processingLength = await analysisQueue.getProcessingLength();
    
    return {
      pending: queueLength,
      processing: processingLength,
      total: queueLength + processingLength,
      usingRedis: isRedisAvailable(),
    };
  } catch (error) {
    console.warn('Queue stats not available:', error);
    return {
      pending: 0,
      processing: 0,
      total: 0,
      usingRedis: false,
    };
  }
}

export async function clearQueue() {
  try {
    await analysisQueue.clear();
  } catch (error) {
    console.warn('Queue clear not available:', error);
  }
}