import fs from 'fs';
import path from 'path';

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

export class LocalQueue {
  private queueDir: string;
  private queueFile: string;
  private processingFile: string;

  constructor(queueName: string) {
    this.queueDir = path.join(process.cwd(), '.queue');
    this.queueFile = path.join(this.queueDir, `${queueName}.json`);
    this.processingFile = path.join(this.queueDir, `${queueName}_processing.json`);
    
    this.ensureQueueDir();
  }

  private ensureQueueDir() {
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
    }
  }

  private readQueue(): QueueJob[] {
    try {
      if (!fs.existsSync(this.queueFile)) {
        return [];
      }
      const data = fs.readFileSync(this.queueFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeQueue(jobs: QueueJob[]) {
    fs.writeFileSync(this.queueFile, JSON.stringify(jobs, null, 2));
  }

  private readProcessing(): QueueJob[] {
    try {
      if (!fs.existsSync(this.processingFile)) {
        return [];
      }
      const data = fs.readFileSync(this.processingFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeProcessing(jobs: QueueJob[]) {
    fs.writeFileSync(this.processingFile, JSON.stringify(jobs, null, 2));
  }

  async add(jobData: Omit<QueueJob, 'id' | 'attempts' | 'createdAt' | 'processAt'>): Promise<string> {
    const job: QueueJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      attempts: 0,
      createdAt: Date.now(),
      processAt: Date.now(),
      ...jobData,
    };

    const queue = this.readQueue();
    queue.push(job);
    this.writeQueue(queue);
    
    return job.id;
  }

  async process(processor: (job: QueueJob) => Promise<void>, concurrency: number = 1): Promise<number> {
    let processedCount = 0;
    const queue = this.readQueue();
    const processing = this.readProcessing();

    // Move jobs from queue to processing
    const jobsToProcess = queue.splice(0, Math.min(concurrency, queue.length));
    if (jobsToProcess.length === 0) {
      return 0;
    }

    processing.push(...jobsToProcess);
    this.writeQueue(queue);
    this.writeProcessing(processing);

    // Process jobs
    for (const job of jobsToProcess) {
      try {
        await processor(job);
        
        // Remove from processing on success
        const updatedProcessing = this.readProcessing();
        const jobIndex = updatedProcessing.findIndex(j => j.id === job.id);
        if (jobIndex !== -1) {
          updatedProcessing.splice(jobIndex, 1);
          this.writeProcessing(updatedProcessing);
        }
        
        processedCount++;
        
      } catch (error) {
        console.error('Job processing error:', error);
        
        // Handle retry logic
        const updatedProcessing = this.readProcessing();
        const jobIndex = updatedProcessing.findIndex(j => j.id === job.id);
        
        if (jobIndex !== -1) {
          const failedJob = updatedProcessing[jobIndex];
          failedJob.attempts++;
          
          if (failedJob.attempts < failedJob.maxAttempts) {
            // Retry: move back to queue with delay
            failedJob.processAt = Date.now() + (failedJob.attempts * 60000);
            updatedProcessing.splice(jobIndex, 1);
            
            const updatedQueue = this.readQueue();
            updatedQueue.push(failedJob);
            this.writeQueue(updatedQueue);
            this.writeProcessing(updatedProcessing);
          } else {
            // Max attempts reached: remove from processing
            console.error(`Job ${failedJob.id} failed after ${failedJob.attempts} attempts`);
            updatedProcessing.splice(jobIndex, 1);
            this.writeProcessing(updatedProcessing);
          }
        }
      }
    }

    return processedCount;
  }

  async getQueueLength(): Promise<number> {
    return this.readQueue().length;
  }

  async getProcessingLength(): Promise<number> {
    return this.readProcessing().length;
  }

  async clear(): Promise<void> {
    this.writeQueue([]);
    this.writeProcessing([]);
  }
}