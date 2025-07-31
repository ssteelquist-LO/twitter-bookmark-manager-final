import { google } from 'googleapis';

export interface SheetBookmark {
  id: string;
  tweetUrl: string;
  author: string;
  content: string;
  category: string;
  summary: string;
  sentiment: string;
  keywords: string;
  isThread: boolean;
  threadSummary?: string;
  bookmarkedAt: string;
}

export class GoogleSheetsService {
  private sheets;
  private auth;

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async createBookmarkSheet(bookmarks: SheetBookmark[]): Promise<string> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Twitter Bookmarks - ${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [
            {
              properties: {
                title: 'Bookmarks',
                gridProperties: {
                  rowCount: bookmarks.length + 1,
                  columnCount: 10,
                },
              },
            },
            {
              properties: {
                title: 'Categories',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 5,
                },
              },
            },
          ],
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;
      
      await this.populateBookmarksSheet(spreadsheetId, bookmarks);
      await this.populateCategoriesSheet(spreadsheetId, bookmarks);
      
      return spreadsheetId;
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      throw new Error('Failed to create Google Sheet');
    }
  }

  private async populateBookmarksSheet(spreadsheetId: string, bookmarks: SheetBookmark[]) {
    const headers = [
      'Tweet URL',
      'Author',
      'Content',
      'Category',
      'Summary',
      'Sentiment',
      'Keywords',
      'Is Thread',
      'Thread Summary',
      'Bookmarked Date',
    ];

    const rows = bookmarks.map(bookmark => [
      bookmark.tweetUrl,
      bookmark.author,
      bookmark.content,
      bookmark.category || 'Uncategorized',
      bookmark.summary || '',
      bookmark.sentiment || 'neutral',
      bookmark.keywords || '',
      bookmark.isThread ? 'Yes' : 'No',
      bookmark.threadSummary || '',
      new Date(bookmark.bookmarkedAt).toLocaleDateString(),
    ]);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Bookmarks!A1:J' + (bookmarks.length + 1),
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    });

    await this.formatBookmarksSheet(spreadsheetId);
  }

  private async populateCategoriesSheet(spreadsheetId: string, bookmarks: SheetBookmark[]) {
    const categoryStats = this.calculateCategoryStats(bookmarks);
    
    const headers = ['Category', 'Count', 'Percentage', 'Most Recent', 'Avg Sentiment'];
    const rows = Object.entries(categoryStats).map(([category, stats]) => [
      category,
      stats.count.toString(),
      `${((stats.count / bookmarks.length) * 100).toFixed(1)}%`,
      stats.mostRecent,
      stats.avgSentiment,
    ]);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Categories!A1:E' + (rows.length + 1),
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    });
  }

  private calculateCategoryStats(bookmarks: SheetBookmark[]) {
    const stats: Record<string, {
      count: number;
      mostRecent: string;
      sentiments: string[];
      avgSentiment: string;
    }> = {};

    bookmarks.forEach(bookmark => {
      const category = bookmark.category || 'Uncategorized';
      
      if (!stats[category]) {
        stats[category] = {
          count: 0,
          mostRecent: bookmark.bookmarkedAt,
          sentiments: [],
          avgSentiment: 'neutral',
        };
      }

      stats[category].count++;
      stats[category].sentiments.push(bookmark.sentiment || 'neutral');
      
      if (new Date(bookmark.bookmarkedAt) > new Date(stats[category].mostRecent)) {
        stats[category].mostRecent = bookmark.bookmarkedAt;
      }
    });

    Object.keys(stats).forEach(category => {
      const sentiments = stats[category].sentiments;
      const positiveCount = sentiments.filter(s => s === 'positive').length;
      const negativeCount = sentiments.filter(s => s === 'negative').length;
      
      if (positiveCount > negativeCount && positiveCount > sentiments.length / 2) {
        stats[category].avgSentiment = 'positive';
      } else if (negativeCount > positiveCount && negativeCount > sentiments.length / 2) {
        stats[category].avgSentiment = 'negative';
      } else {
        stats[category].avgSentiment = 'neutral';
      }
      
      stats[category].mostRecent = new Date(stats[category].mostRecent).toLocaleDateString();
    });

    return stats;
  }

  private async formatBookmarksSheet(spreadsheetId: string) {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 2,
                endIndex: 3,
              },
              properties: { pixelSize: 300 },
              fields: 'pixelSize',
            },
          },
        ],
      },
    });
  }

  async updateExistingSheet(spreadsheetId: string, bookmarks: SheetBookmark[]): Promise<void> {
    try {
      await this.populateBookmarksSheet(spreadsheetId, bookmarks);
      await this.populateCategoriesSheet(spreadsheetId, bookmarks);
    } catch (error) {
      console.error('Error updating Google Sheet:', error);
      throw new Error('Failed to update Google Sheet');
    }
  }
}