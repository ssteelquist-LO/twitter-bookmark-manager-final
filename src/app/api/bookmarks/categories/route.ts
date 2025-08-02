import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const categories = await prisma.bookmark.groupBy({
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
      });

      const formattedCategories = categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      }));

      return NextResponse.json(formattedCategories);
    } catch (dbError) {
      console.log('Database unavailable, using demo categories:', dbError);
      
      // Return demo categories when database is unavailable
      const demoCategories = [
        { name: 'Technology', count: 5 },
        { name: 'Web Development', count: 3 },
        { name: 'Programming', count: 2 },
        { name: 'AI & Machine Learning', count: 4 },
        { name: 'Business', count: 1 },
      ];

      return NextResponse.json(demoCategories);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}