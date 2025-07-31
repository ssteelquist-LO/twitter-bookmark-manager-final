'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MessageSquare, Hash, Calendar } from 'lucide-react';
import { Bookmark } from '@prisma/client';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-gray-900">
              @{bookmark.author}
            </span>
            {bookmark.isThread && (
              <MessageSquare className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(bookmark.tweetUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed">
          {bookmark.content}
        </p>
        
        {bookmark.summary && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">AI Summary:</p>
            <p className="text-sm text-blue-700">{bookmark.summary}</p>
          </div>
        )}
        
        {bookmark.isThread && bookmark.threadSummary && (
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-purple-800 font-medium mb-1">Thread Summary:</p>
            <p className="text-sm text-purple-700">{bookmark.threadSummary}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {bookmark.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                <Hash className="h-3 w-3 mr-1" />
                {bookmark.category}
              </span>
            )}
            
            {bookmark.sentiment && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(bookmark.sentiment)}`}>
                {bookmark.sentiment}
              </span>
            )}
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(bookmark.bookmarkedAt)}
          </div>
        </div>
        
        {bookmark.keywords && (
          <div className="flex flex-wrap gap-1 pt-2">
            {bookmark.keywords.split(', ').map((keyword, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}