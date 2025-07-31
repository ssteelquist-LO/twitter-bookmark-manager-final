import OpenAI from 'openai';
import { USAGE_LIMITS, trackOpenAIUsage } from './usage-limits';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface BookmarkAnalysis {
  category: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  isThread: boolean;
  threadSummary?: string;
}

export class OpenAIService {
  async analyzeBookmark(content: string, isThread: boolean = false, threadContent?: string[]): Promise<BookmarkAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(content, isThread, threadContent);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes Twitter bookmarks and provides structured JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: USAGE_LIMITS.OPENAI.MAX_TOKENS_ANALYSIS,
        temperature: 0.3,
      });

      // Track usage for cost monitoring
      const tokensUsed = response.usage?.total_tokens || 0;
      trackOpenAIUsage(tokensUsed);

      const analysisText = response.choices[0]?.message?.content || '';
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
      console.error('Error parsing OpenAI analysis:', error);
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

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that categorizes content and returns JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const categoriesText = response.choices[0]?.message?.content || '[]';
      const categories = JSON.parse(categoriesText.replace(/```json\n?|\n?```/g, '').trim());
      
      return Array.isArray(categories) ? categories : ['Technology', 'Business', 'Education', 'Entertainment'];
    } catch (error) {
      console.error('Error categorizing bookmarks:', error);
      return ['Technology', 'Business', 'Education', 'Entertainment'];
    }
  }
}