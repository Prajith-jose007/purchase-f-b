
import { NextResponse, type NextRequest } from 'next/server';
import { getItemCategories } from '@/lib/data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || undefined;
  try {
    const categories = await getItemCategories(type);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('API Error fetching item categories:', error);
    // Log the full error for server-side debugging
    return NextResponse.json({ message: 'Failed to fetch item categories', error: (error as Error).message }, { status: 500 });
  }
}
