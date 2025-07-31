import { TwitterApi } from 'twitter-api-v2';

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

export interface TwitterBookmark {
  id: string;
  url: string;
  author: {
    username: string;
    name: string;
  };
  content: string;
  createdAt: string;
  isThread?: boolean;
  threadTweets?: string[];
}

export class TwitterService {
  private client: TwitterApi;
  
  constructor() {
    this.client = twitterClient;
  }

  async getUserBookmarks(userId: string): Promise<TwitterBookmark[]> {
    try {
      const bookmarks = await this.client.v2.bookmarks(userId, {
        'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'public_metrics'],
        'user.fields': ['username', 'name'],
        expansions: ['author_id'],
        max_results: 100,
      });

      const bookmarkList: TwitterBookmark[] = [];
      
      for await (const tweet of bookmarks) {
        const author = bookmarks.includes?.users?.find(u => u.id === tweet.author_id);
        
        bookmarkList.push({
          id: tweet.id,
          url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
          author: {
            username: author?.username || 'unknown',
            name: author?.name || 'Unknown User',
          },
          content: tweet.text,
          createdAt: tweet.created_at || new Date().toISOString(),
        });
      }

      return bookmarkList;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw new Error('Failed to fetch Twitter bookmarks');
    }
  }

  async getTweetThread(tweetId: string): Promise<string[]> {
    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['conversation_id', 'in_reply_to_user_id'],
      });

      if (!tweet.data.conversation_id) {
        return [tweet.data.text];
      }

      const conversation = await this.client.v2.search({
        query: `conversation_id:${tweet.data.conversation_id}`,
        'tweet.fields': ['created_at', 'author_id'],
        max_results: 100,
      });

      const threadTweets: string[] = [];
      for await (const threadTweet of conversation) {
        if (threadTweet.author_id === tweet.data.author_id) {
          threadTweets.push(threadTweet.text);
        }
      }

      return threadTweets.sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
    } catch (error) {
      console.error('Error fetching thread:', error);
      return [];
    }
  }

  async isThread(tweetId: string): Promise<boolean> {
    try {
      const thread = await this.getTweetThread(tweetId);
      return thread.length > 1;
    } catch {
      return false;
    }
  }
}