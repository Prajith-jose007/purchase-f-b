
import { NextResponse } from 'next/server';
import { getItemTypes } from '@/lib/data';

export async function GET() {
  try {
    const types = await getItemTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error('API Error fetching item types:', error);
    // Log the full error for server-side debugging
    return NextResponse.json({ message: 'Failed to fetch item types', error: (error as Error).message }, { status: 500 });
  }
}
