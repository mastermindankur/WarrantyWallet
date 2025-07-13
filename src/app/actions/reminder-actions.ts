'use server';

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Warranty } from '@/lib/types';
import { sendReminderEmail } from '@/lib/email';
import { addDays, isPast } from 'date-fns';

/**
 * Fetches expiring warranties for a specific user and sends a test reminder email.
 * This action is called from the client and runs on the server.
 * @param userId - The UID of the user to check warranties for.
 * @returns An object indicating success or failure with a corresponding message.
 */
export async function sendTestReminder(userId: string): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User ID is missing.' };
  }
  
  if (!db) {
    return { success: false, message: 'Database connection is not configured.' };
  }

  try {
    const now = new Date();
    // Look for warranties expiring in the next 30 days
    const expiryLimit = addDays(now, 30);

    const q = query(
      collection(db, 'warranties'),
      where('userId', '==', userId),
      where('expiryDate', '<=', Timestamp.fromDate(expiryLimit)),
      where('expiryDate', '>=', Timestamp.fromDate(now))
    );

    const querySnapshot = await getDocs(q);
    
    // This part requires getting the user's email, which we can't do securely on the server
    // without the Admin SDK. For a test, we will assume a placeholder or require it to be passed.
    // The best approach is to pass it from the client.
    // For now, let's return an error if the user's email isn't available.
    return { success: false, message: 'This is a placeholder. To complete this, pass the user\'s email to this action.' };


  } catch (error: any) {
    console.error('Error in sendTestReminder action:', error);
    // Check for Firestore permission errors
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Database permission denied. Please check your Firestore security rules.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
