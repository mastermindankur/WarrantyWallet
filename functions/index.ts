
'use server';
/**
 * @fileoverview A daily scheduled Cloud Function to send warranty reminder emails.
 */
import 'dotenv/config'; // Load environment variables from .env file

import * as functions from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import { Resend } from 'resend';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { format, isPast, intervalToDuration, addDays } from 'date-fns';
import type { Warranty, WarrantyFromFirestore } from './types';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;
let resend: Resend | null = null;

if (resendApiKey) {
    resend = new Resend(resendApiKey);
    logger.info('Resend client initialized.');
} else {
    logger.warn('RESEND_API_KEY is not configured in the environment.');
}

/**
 * A scheduled function that runs daily, finds users with expiring or expired warranties,
 * and sends them a summary email.
 */
export const dailyReminderJob = functions.scheduler.onSchedule('every day 09:00', async (event) => {
    logger.info("Daily reminder job started.");

    if (!resend || !fromEmail) {
        logger.error("Resend is not initialized or FROM_EMAIL is missing. Aborting job.");
        return;
    }

    try {
        const now = new Date();
        const expiryLimitDate = addDays(now, 30); // 30 days from now

        // Find all warranties that are expiring in the next 30 days or have already expired.
        const expiringSnapshot = await db.collection('warranties')
            .where('expiryDate', '<=', Timestamp.fromDate(expiryLimitDate))
            .get();

        if (expiringSnapshot.empty) {
            logger.info("No expiring or expired warranties found. Job finished.");
            return;
        }

        // Group warranties by userId
        const userWarrantiesMap = new Map<string, { expiring: Warranty[], expired: Warranty[] }>();

        expiringSnapshot.docs.forEach(doc => {
            const data = doc.data() as WarrantyFromFirestore;
            const warranty: Warranty = {
                ...data,
                id: doc.id,
                purchaseDate: data.purchaseDate.toDate(),
                expiryDate: data.expiryDate.toDate(),
            };

            const userId = warranty.userId;
            if (!userWarrantiesMap.has(userId)) {
                userWarrantiesMap.set(userId, { expiring: [], expired: [] });
            }

            if (isPast(warranty.expiryDate)) {
                userWarrantiesMap.get(userId)!.expired.push(warranty);
            } else {
                userWarrantiesMap.get(userId)!.expiring.push(warranty);
            }
        });

        // Process emails for each user
        const testUserEmail = 'mastermindankur@duck.com';
        for (const [userId, warranties] of userWarrantiesMap.entries()) {
            try {
                // The user's real email is no longer fetched.
                // We send directly to the test email address.
                await sendReminderEmail({
                    userEmail: testUserEmail,
                    expiringWarranties: warranties.expiring,
                    expiredWarranties: warranties.expired,
                });
                logger.info(`Successfully sent reminder email to test address ${testUserEmail} for user ${userId}`);

            } catch (error) {
                logger.error(`Failed to process reminders for user ${userId}:`, error);
            }
        }

    } catch (error) {
        logger.error("Error executing daily reminder job:", error);
    }
});


// --- Email Sending Logic ---

interface SendReminderEmailParams {
    userEmail: string;
    expiringWarranties: Warranty[];
    expiredWarranties: Warranty[];
}

function formatRemainingTimeForEmail(expiryDate: Date): string {
  const now = new Date();
  const hasExpired = isPast(expiryDate);

  const duration = hasExpired
    ? intervalToDuration({ start: expiryDate, end: now })
    : intervalToDuration({ start: now, end: expiryDate });

  const parts = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years}y`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months}m`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days}d`);

  if (parts.length === 0) {
    return hasExpired ? 'Expired today' : 'Expires today';
  }

  const formattedDuration = parts.slice(0, 2).join(', ');
  
  return hasExpired ? `Expired ${formattedDuration} ago` : `in ${formattedDuration}`;
}

async function sendReminderEmail({ userEmail, expiringWarranties, expiredWarranties }: SendReminderEmailParams) {
    if (!resend || !fromEmail) {
        throw new Error("Email provider (Resend) is not configured.");
    }
    
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://warrantywallet.online';

    const renderWarrantySection = (title: string, warranties: Warranty[], isExpired = false) => {
        if (warranties.length === 0) return '';
        
        return `
            <h3 style="color: ${isExpired ? '#c00' : '#005050'}; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">${title}</h3>
            <div class="warranty-list">
                ${warranties.map(w => `
                    <div class="warranty-item">
                        <div class="product-name">${w.productName}</div>
                        <div class="expiry-detail">
                            <span class="expiry-date">Expires: ${format(w.expiryDate, 'MMM d, yyyy')}</span>
                            <span class="expiry-status">(${formatRemainingTimeForEmail(w.expiryDate)})</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    try {
        const { error } = await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Your Warranty Status Update from WarrantyWallet',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warranty Status Update</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F0F0F0; font-family: 'Inter', sans-serif, Arial; color: #0a0a0a; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
        .header { background-color: #008080; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 24px; }
        .content p { font-size: 16px; line-height: 1.5; margin: 0 0 16px; }
        .warranty-list { padding-top: 10px; }
        .warranty-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .warranty-item:last-child { border-bottom: none; }
        .product-name { font-weight: 600; color: #333; font-size: 16px; }
        .expiry-detail { font-size: 14px; color: #555; text-align: right; }
        .expiry-date { display: block; }
        .expiry-status { font-weight: 500; color: #333; }
        .button-container { text-align: center; margin: 24px 0; }
        .button { background-color: #FFD700; color: #0a0a0a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #7f7f7f; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>WarrantyWallet</h1></div>
        <div class="content">
            <p>Hi there,</p>
            <p>Here is your daily summary of product warranties that require your attention.</p>
            ${renderWarrantySection('Expiring Soon', expiringWarranties)}
            ${renderWarrantySection('Recently Expired', expiredWarranties, true)}
            <p style="margin-top: 24px;">You can view and manage all your items by visiting your dashboard.</p>
            <div class="button-container"><a href="${dashboardUrl}/dashboard" class="button">View My Dashboard</a></div>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} WarrantyWallet. All rights reserved.</p></div>
    </div>
</body>
</html>`,
        });

        if (error) {
            logger.error("Error response from Resend:", JSON.stringify(error, null, 2));
            throw new Error(`Resend failed to send email. Details: ${JSON.stringify(error)}`);
        }
    } catch (error) {
        logger.error("Failed to send email via Resend:", error);
        throw new Error("There was an error sending the reminder email.");
    }
}
