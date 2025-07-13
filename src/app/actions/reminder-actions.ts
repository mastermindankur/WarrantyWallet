'use server';

import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Warranty } from '@/lib/types';
import { sendReminderEmail } from '@/lib/email';
import { addDays } from 'date-fns';

/**
 * Fetches expiring warranties for a specific user and sends a test reminder email.
 * This action is called from the client and runs on the server.
 * @param userId - The UID of the user to check warranties for.
 * @param userEmail - The email address of the user to send the reminder to.
 * @returns An object indicating success or failure with a corresponding message.
 */
export async function sendTestReminder(userId: string, userEmail: string): Promise<{ success: boolean; message: string }> {
  if (!userId || !userEmail) {
    return { success: false, message: 'User information is missing.' };
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

    const expiringWarranties = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        purchaseDate: (data.purchaseDate as Timestamp).toDate(),
        expiryDate: (data.expiryDate as Timestamp).toDate(),
      } as Warranty;
    });

    if (expiringWarranties.length === 0) {
      return { success: true, message: "You have no warranties expiring in the next 30 days." };
    }

    // Send the reminder email
    await sendReminderEmail({
      userEmail,
      warranties: expiringWarranties
    });

    return { success: true, message: `Reminder sent for ${expiringWarranties.length} expiring item(s).` };

  } catch (error: any) {
    console.error('Error in sendTestReminder action:', error);
    // Check for Firestore permission errors
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Database permission denied. Please check your Firestore security rules.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}