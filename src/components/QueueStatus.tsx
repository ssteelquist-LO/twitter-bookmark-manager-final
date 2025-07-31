'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface QueueStats {
  pending: number;
  processing: number;
  total: number;
  usingRedis: boolean;
}

export function QueueStatus() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/queue/stats');
      if (response.ok) {
        const stats = await response.json();
        setQueueStats(stats);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processQueue = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/queue/process', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchQueueStats();
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchQueueStats();
    const interval = setInterval(fetchQueueStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !queueStats) {
    return null;
  }

  if (queueStats.total === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">All bookmarks analyzed</span>
            {!queueStats.usingRedis && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Local Queue
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>AI Analysis Queue</span>
            {!queueStats.usingRedis && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Local Queue
              </span>
            )}
          </div>
          {!queueStats.usingRedis && queueStats.total > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={processQueue}
              disabled={processing}
              className="h-6 text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              {processing ? 'Processing...' : 'Process Now'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-blue-700">Pending: {queueStats.pending}</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <span className="text-orange-700">Processing: {queueStats.processing}</span>
            </div>
          </div>
          <span className="text-blue-800 font-medium">
            Total: {queueStats.total}
          </span>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          {queueStats.usingRedis 
            ? 'Analysis jobs are processed automatically every 5 minutes'
            : 'Click "Process Now" to analyze bookmarks in local development'
          }
        </div>
      </CardContent>
    </Card>
  );
}