
'use server';

import { getUserByUsername } from '@/lib/data';
import type { User } from '@/types';

export async function loginUserAction(username: string, passwordProvided: string): Promise<User | null> {
  try {
    const user = await getUserByUsername(username);
    if (user && user.password === passwordProvided) {
      // IMPORTANT: In a real app, user.password would be a HASH.
      // You would compare password with bcrypt.compare(passwordProvided, user.password)
      const { password, ...userToStore } = user;
      return userToStore as User;
    }
    return null;
  } catch (error) {
    console.error("Login action error:", error); // The specific error is logged here
    // Optionally, rethrow a more specific error or return an error object
    throw new Error("An error occurred during login.");
  }
}

    