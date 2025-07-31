import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface BookmarkAnalysis {
  category: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  isThread: boolean;
  threadSummary?: string;
}

export class ClaudeService {
  async analyzeBookmark(content: string, isThread: boolean = false, threadContent?: string[]): Promise<BookmarkAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(content, isThread, threadContent);
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseAnalysis(analysisText, isThread);
    } catch (error) {
      console.error('Error analyzing bookmark:', error);
      return this.getDefaultAnalysis(content, isThread);
    }
  }

  private buildAnalysisPrompt(content: string, isThread: boolean, threadContent?: string[]): string {
    const basePrompt = `
Analyze this Twitter bookmark and provide structured analysis in JSON format.

Tweet Content: "${content}"

${isThread && threadContent ? `
This is part of a thread. Full thread content:
${threadContent.join('\n\n')}
` : ''}

Please analyze and return a JSON object with:
- category: A single word category (Technology, Business, Education, Entertainment, News, Opinion, Tutorial, Personal, etc.)
- summary: A concise 1-2 sentence summary of the main point
- sentiment: Either "positive", "negative", or "neutral"
- keywords: An array of 3-5 relevant keywords
${isThread ? '- threadSummary: A brief summary of the entire thread if this is a thread' : ''}

Return only valid JSON, no additional text.
`;

    return basePrompt;
  }

  private parseAnalysis(analysisText: string, isThread: boolean): BookmarkAnalysis {
    try {
      const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      return {
        category: parsed.category || 'Uncategorized',
        summary: parsed.summary || 'No summary available',
        sentiment: parsed.sentiment || 'neutral',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        isThread,
        threadSummary: isThread ? parsed.threadSummary : undefined,
      };
    } catch (error) {
      console.error('Error parsing Claude analysis:', error);
      return this.getDefaultAnalysis('', isThread);
    }
  }

  private getDefaultAnalysis(content: string, isThread: boolean): BookmarkAnalysis {
    return {
      category: 'Uncategorized',
      summary: content.length > 100 ? content.substring(0, 100) + '...' : content,
      sentiment: 'neutral',
      keywords: [],
      isThread,
      threadSummary: isThread ? 'Thread analysis unavailable' : undefined,
    };
  }

  async categorizeBookmarks(bookmarks: { content: string; summary?: string }[]): Promise<string[]> {
    try {
      const prompt = `
Analyze these bookmark summaries and suggest 5-8 broad categories that would best organize them:

${bookmarks.map((b, i) => `${i + 1}. ${b.summary || b.content.substring(0, 100)}`).join('\n')}

Return only a JSON array of category names, no additional text.
`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const categoriesText = response.content[0].type === 'text' ? response.content[0].text : '[]';
      const categories = JSON.parse(categoriesText.replace(/```json\n?|\n?```/g, '').trim());
      
      return Array.isArray(categories) ? categories : ['Technology', 'Business', 'Education', 'Entertainment'];
    } catch (error) {
      console.error('Error categorizing bookmarks:', error);
      return ['Technology', 'Business', 'Education', 'Entertainment'];
    }
  }
}