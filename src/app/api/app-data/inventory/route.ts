
import { NextResponse } from 'next/server';
import { getInventoryItems } from '@/lib/data';

export async function GET() {
  try {
    const inventory = await getInventoryItems();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('API Error fetching inventory:', error);
    return NextResponse.json({ message: 'Failed to fetch inventory', error: (error as Error).message }, { status: 500 });
  }
}
