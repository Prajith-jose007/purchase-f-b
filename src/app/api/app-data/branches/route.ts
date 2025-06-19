
import { NextResponse } from 'next/server';
import { getBranches } from '@/lib/data';

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json(branches);
  } catch (error) {
    console.error('API Error fetching branches:', error);
    return NextResponse.json({ message: 'Failed to fetch branches', error: (error as Error).message }, { status: 500 });
  }
}
