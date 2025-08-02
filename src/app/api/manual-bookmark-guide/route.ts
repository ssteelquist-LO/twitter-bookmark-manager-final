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

    const guide = {
      title: "Manual X.com Bookmark Extraction Guide",
      steps: [
        {
          step: 1,
          title: "Open X.com Bookmarks",
          description: "Go to https://x.com/i/bookmarks and make sure you're logged in"
        },
        {
          step: 2,
          title: "Open Browser Developer Tools",
          description: "Press F12 or right-click and select 'Inspect Element'"
        },
        {
          step: 3,
          title: "Run Extraction Script",
          description: "Copy and paste this script into the Console tab:",
          code: `
// X.com Bookmark Extraction Script
const bookmarks = [];
const tweets = document.querySelectorAll('[data-testid="tweet"]');

tweets.forEach((tweet, index) => {
  if (index >= 20) return; // Limit to first 20
  
  try {
    const textElement = tweet.querySelector('[data-testid="tweetText"]');
    const authorElement = tweet.querySelector('[data-testid="User-Name"] span');
    const handleElement = tweet.querySelector('[data-testid="User-Name"] a');
    const timeElement = tweet.querySelector('time');
    const linkElement = tweet.querySelector('a[href*="/status/"]');
    
    if (textElement && linkElement) {
      bookmarks.push({
        content: textElement.textContent || '',
        author: authorElement?.textContent || 'Unknown',
        handle: handleElement?.href?.split('/').pop() || 'unknown',
        url: linkElement.href || '',
        date: timeElement?.getAttribute('datetime') || new Date().toISOString()
      });
    }
  } catch (err) {
    console.log('Error extracting tweet:', err);
  }
});

console.log('Extracted bookmarks:', bookmarks);
console.log('Copy this JSON data:');
console.log(JSON.stringify(bookmarks, null, 2));
          `.trim()
        },
        {
          step: 4,
          title: "Copy the Results",
          description: "Copy the JSON output from the console and paste it into the bookmark manager"
        }
      ]
    };

    return NextResponse.json(guide);

  } catch (error) {
    console.error('Error generating manual guide:', error);
    
    return NextResponse.json({
      error: 'Failed to generate guide',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}