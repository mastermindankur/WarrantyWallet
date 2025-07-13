'use server';

import type { Warranty } from '@/lib/types';
import { sendReminderEmail } from '@/lib/email';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * Sends a reminder email for a specific user with their expiring and expired warranties.
 * This action is called from the client and runs on the server.
 * @param {object} payload - The data for the reminder.
 * @param {string} payload.userEmail - The email of the user to send the reminder to.
 * @param {Warranty[]} payload.expiringWarranties - A list of warranties that are expiring soon.
 * @param {Warranty[]} payload.expiredWarranties - A list of warranties that have already expired.
 * @returns An object indicating success or failure with a corresponding message.
 */
export async function sendTestReminder({
  userEmail,
  expiringWarranties,
  expiredWarranties,
}: {
  userEmail: string;
  expiringWarranties: any[]; // Pass serialized data
  expiredWarranties: any[];
}): Promise<{ success: boolean; message: string }> {
  if (!userEmail) {
    return { success: false, message: 'User email is missing.' };
  }

  if (expiringWarranties.length === 0 && expiredWarranties.length === 0) {
    return { success: true, message: 'No warranties require attention. No email sent.' };
  }

  try {
    // The warranties are already fetched from the client, so we just need to send the email.
    // The dates are strings, so we convert them back to Date objects for the email template.
    const expiringWithDates = expiringWarranties.map((w) => ({
      ...w,
      expiryDate: new Date(w.expiryDate),
    }));
    const expiredWithDates = expiredWarranties.map((w) => ({
      ...w,
      expiryDate: new Date(w.expiryDate),
    }));

    await sendReminderEmail({
      userEmail,
      expiringWarranties: expiringWithDates,
      expiredWarranties: expiredWithDates,
    });

    return { success: true, message: 'Reminder email sent successfully!' };

  } catch (error: any) {
    console.error('Error in sendTestReminder action:', error);
    // Check for specific error types if needed, otherwise return a generic message.
    if (error.message.includes('Resend')) {
         return { success: false, message: 'Email provider error. Please check server logs.' };
    }
    return { success: false, message: error.message || 'An unknown error occurred.' };
  }
}
