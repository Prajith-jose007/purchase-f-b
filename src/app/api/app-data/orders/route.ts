
import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/data';

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('API Error fetching orders:', error);
    return NextResponse.json({ message: 'Failed to fetch orders', error: (error as Error).message }, { status: 500 });
  }
}
