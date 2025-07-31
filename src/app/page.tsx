import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookmarkList } from '@/components/BookmarkList';
import { SignInButton, SignOutButton } from '@/components/AuthButtons';
import { Twitter } from 'lucide-react';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Twitter className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Twitter Bookmark Manager
            </h1>
            <p className="text-gray-600 mb-6">
              Organize and analyze your Twitter bookmarks with AI-powered insights
            </p>
            <SignInButton />
          </div>
        </div>
      </div>
    );
  }

  const [bookmarks, categories] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { bookmarkedAt: 'desc' },
      take: 20,
    }),
    prisma.bookmark.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        category: { not: null },
      },
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    }),
  ]);

  const formattedCategories = categories.map(cat => ({
    name: cat.category!,
    count: cat._count.category,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Twitter className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Bookmark Manager
              </h1>
            </div>
            
            <SignOutButton userName={session.user.name} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookmarkList 
          initialBookmarks={bookmarks} 
          initialCategories={formattedCategories}
        />
      </main>
    </div>
  );
}
