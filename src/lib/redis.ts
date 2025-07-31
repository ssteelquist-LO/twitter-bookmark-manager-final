import { Redis } from '@upstash/redis';

const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasRedisConfig ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

export const isRedisAvailable = () => redis !== null;

export interface QueueJob {
  id: string;
  type: 'analyze_bookmark';
  data: {
    bookmarkId: string;
  };
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  processAt: number;
}

export class SimpleQueue {
  private queueKey: string;
  private processingKey: string;

  constructor(queueName: string) {
    this.queueKey = `queue:${queueName}`;
    this.processingKey = `processing:${queueName}`;
  }

  async add(jobData: Omit<QueueJob, 'id' | 'attempts' | 'createdAt' | 'processAt'>): Promise<string> {
    if (!redis) {
      throw new Error('Redis not available');
    }

    const job: QueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: Date.now(),
      processAt: Date.now(),
      ...jobData,
    };

    await redis.lpush(this.queueKey, JSON.stringify(job));
    return job.id;
  }

  async process(processor: (job: QueueJob) => Promise<void>, concurrency: number = 1): Promise<number> {
    if (!redis) {
      throw new Error('Redis not available');
    }

    let processedCount = 0;
    
    for (let i = 0; i < concurrency; i++) {
      const jobData = await redis.rpop(this.queueKey);
      if (!jobData) continue;
      await redis.lpush(this.processingKey, jobData);

      try {
        const job: QueueJob = JSON.parse(jobData);
        
        await processor(job);
        
        await redis.lrem(this.processingKey, 1, jobData);
        processedCount++;
        
      } catch (error) {
        console.error('Job processing error:', error);
        
        try {
          const job: QueueJob = JSON.parse(jobData);
          job.attempts++;
          
          if (job.attempts < job.maxAttempts) {
            job.processAt = Date.now() + (job.attempts * 60000);
            await redis.lpush(this.queueKey, JSON.stringify(job));
          } else {
            console.error(`Job ${job.id} failed after ${job.attempts} attempts`);
          }
          
          await redis.lrem(this.processingKey, 1, jobData);
        } catch (parseError) {
          console.error('Failed to parse job for retry:', parseError);
          await redis.lrem(this.processingKey, 1, jobData);
        }
      }
    }

    return processedCount;
  }

  async getQueueLength(): Promise<number> {
    if (!redis) return 0;
    return await redis.llen(this.queueKey);
  }

  async getProcessingLength(): Promise<number> {
    if (!redis) return 0;
    return await redis.llen(this.processingKey);
  }

  async clear(): Promise<void> {
    if (!redis) return;
    await redis.del(this.queueKey);
    await redis.del(this.processingKey);
  }
}