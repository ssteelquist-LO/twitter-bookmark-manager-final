'use client';

import { useState, useEffect } from 'react';
import { BookmarkCard } from './BookmarkCard';
import { QueueStatus } from './QueueStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, RefreshCw, Globe, Upload } from 'lucide-react';
import { Bookmark } from '@prisma/client';

interface Category {
  name: string;
  count: number;
}

interface BookmarkListProps {
  initialBookmarks: Bookmark[];
  initialCategories: Category[];
}

export function BookmarkList({ initialBookmarks, initialCategories }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/bookmarks?${params}`);
      const data = await response.json();
      setBookmarks(data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncBookmarks = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/bookmarks/sync', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Successfully synced ${data.syncedCount} new bookmarks!`);
        await fetchBookmarks();
        await fetchCategories();
      } else {
        throw new Error('Failed to sync bookmarks');
      }
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      alert('Failed to sync bookmarks. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/bookmarks/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const exportToSheets = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/bookmarks/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
        alert(`Successfully exported ${data.exportedCount} bookmarks to Google Sheets!`);
      } else {
        throw new Error('Failed to export bookmarks');
      }
    } catch (error) {
      console.error('Error exporting bookmarks:', error);
      alert('Failed to export bookmarks. Please check your Google Sheets configuration.');
    } finally {
      setExporting(false);
    }
  };

  const extractBookmarks = async () => {
    setExtracting(true);
    try {
      const response = await fetch('/api/extract-bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Successfully extracted ${data.extractedCount} bookmarks from Twitter!\n\nSaved: ${data.savedCount} bookmarks\nQueued for AI analysis: ${data.queuedCount} bookmarks`);
        await fetchBookmarks();
        await fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract bookmarks');
      }
    } catch (error) {
      console.error('Error extracting bookmarks:', error);
      alert(`Failed to extract bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExtracting(false);
    }
  };

  const importBookmarks = async () => {
    const jsonData = prompt('Paste your bookmark JSON data here:');
    if (!jsonData) return;
    
    setImporting(true);
    try {
      const bookmarks = JSON.parse(jsonData);
      
      const response = await fetch('/api/import-bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Successfully imported ${data.savedCount} real bookmarks!\n\nQueued for AI analysis: ${data.queuedCount} bookmarks`);
        await fetchBookmarks();
        await fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import bookmarks');
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      alert(`Failed to import bookmarks: ${error instanceof Error ? error.message : 'Please check your JSON format'}`);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBookmarks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      <QueueStatus />
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="all">All Categories ({bookmarks.length})</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={syncBookmarks}
            disabled={syncing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          
          <Button
            onClick={extractBookmarks}
            disabled={extracting}
            size="sm"
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Globe className={`h-4 w-4 mr-2 ${extracting ? 'animate-spin' : ''}`} />
            {extracting ? 'Extracting...' : 'Extract Real Bookmarks'}
          </Button>
          
          <Button
            onClick={importBookmarks}
            disabled={importing}
            size="sm"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
          >
            <Upload className={`h-4 w-4 mr-2 ${importing ? 'animate-spin' : ''}`} />
            {importing ? 'Importing...' : 'Import Bookmarks'}
          </Button>
          
          <Button
            onClick={exportToSheets}
            disabled={exporting}
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export to Sheets'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading bookmarks...</span>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookmarks found.</p>
          {searchQuery || selectedCategory !== 'all' ? (
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your search or filter criteria.
            </p>
          ) : (
            <Button onClick={syncBookmarks} className="mt-4" disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Your First Bookmarks
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      )}
    </div>
  );
}