
import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/data';

export async function GET() {
  try {
    const users = await getUsers();
    // Ensure passwords are not sent to the client
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error('API Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}
