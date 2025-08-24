
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
import { getAuth } from 'firebase-admin/auth';
import { format, isPast, intervalToDuration } from 'date-fns';
import type { Warranty, WarrantyFromFirestore } from './types';

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();
const auth = getAuth();

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
 * A scheduled function that runs daily, finds users with warranties,
 * and sends them a summary email. It also sends a reminder to users
 * who have not yet added any warranties.
 */
export const dailyReminderJob = functions.scheduler.onSchedule('every day 09:00', async (event) => {
    logger.info("Daily reminder job started.");

    if (!resend || !fromEmail) {
        logger.error("Resend is not initialized or FROM_EMAIL is missing. Aborting job.");
        return;
    }

    try {
        const now = new Date();
        const nowTimestamp = Timestamp.fromDate(now);

        // 1. Fetch all warranties
        const upcomingSnapshot = await db.collection('warranties')
            .where('expiryDate', '>=', nowTimestamp)
            .get();
        const expiredSnapshot = await db.collection('warranties')
            .where('expiryDate', '<', nowTimestamp)
            .get();

        // 2. Group warranties by userId
        const userWarrantiesMap = new Map<string, { upcoming: Warranty[], expired: Warranty[] }>();

        const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot, type: 'upcoming' | 'expired') => {
            snapshot.docs.forEach((doc) => {
                const data = doc.data() as WarrantyFromFirestore;
                const warranty: Warranty = {
                    ...data,
                    id: doc.id,
                    purchaseDate: data.purchaseDate.toDate(),
                    expiryDate: data.expiryDate.toDate(),
                };
    
                const userId = warranty.userId;
                if (!userWarrantiesMap.has(userId)) {
                    userWarrantiesMap.set(userId, { upcoming: [], expired: [] });
                }
                
                const userGroup = userWarrantiesMap.get(userId)!;
                if (type === 'upcoming') {
                    userGroup.upcoming.push(warranty);
                } else {
                    userGroup.expired.push(warranty);
                }
            });
        }
        
        processSnapshot(upcomingSnapshot, 'upcoming');
        processSnapshot(expiredSnapshot, 'expired');

        // 3. Process emails for users with warranties
        const testUserEmail = 'mastermindankur@duck.com';
        for (const [userId, warranties] of userWarrantiesMap.entries()) {
            if (warranties.upcoming.length === 0 && warranties.expired.length === 0) {
                continue;
            }
            
            try {
                // In a real app, you would fetch the user's real email.
                // const userRecord = await auth.getUser(userId);
                // const userEmail = userRecord.email;
                await sendReminderEmail({
                    userEmail: testUserEmail,
                    upcomingWarranties: warranties.upcoming,
                    expiredWarranties: warranties.expired,
                });
                logger.info(`Successfully sent reminder email to test address ${testUserEmail} for user ${userId}`);

            } catch (error) {
                logger.error(`Failed to process reminders for user ${userId}:`, error);
            }
        }
        
        // 4. Process engagement emails for users without warranties
        const allUsers = await auth.listUsers();
        for (const user of allUsers.users) {
            if (!userWarrantiesMap.has(user.uid)) {
                try {
                    // Send to the test email for now
                    await sendEngagementEmail({ userEmail: testUserEmail });
                    logger.info(`Successfully sent engagement email to test address ${testUserEmail} for user ${user.uid}`);
                } catch (error) {
                    logger.error(`Failed to send engagement email for user ${user.uid}:`, error);
                }
            }
        }

    } catch (error) {
        logger.error("Error executing daily reminder job:", error);
    }
});


// --- Email Sending Logic ---

interface SendReminderEmailParams {
    userEmail: string;
    upcomingWarranties: Warranty[];
    expiredWarranties: Warranty[];
}

interface SendEngagementEmailParams {
    userEmail: string;
}

function formatRemainingTimeForEmail(expiryDate: Date): string {
  const now = new Date();
  const hasExpired = isPast(expiryDate);

  const duration = hasExpired
    ? intervalToDuration({ start: expiryDate, end: now })
    : intervalToDuration({ start: now, end: expiryDate });

  const parts = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);

  if (parts.length === 0) {
    return hasExpired ? 'Expired today' : 'Expires today';
  }

  const formattedDuration = parts.slice(0, 2).join(', ');
  
  return hasExpired ? `Expired ${formattedDuration} ago` : `Expires in ${formattedDuration}`;
}

async function sendReminderEmail({ userEmail, upcomingWarranties, expiredWarranties }: SendReminderEmailParams) {
    if (!resend || !fromEmail) {
        throw new Error("Email provider (Resend) is not configured.");
    }
    
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://warrantywallet.online';

    const renderWarrantySection = (title: string, warranties: Warranty[], color: string) => {
        if (warranties.length === 0) return '';
        
        // Sort warranties by expiry date
        warranties.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

        return `
            <h3 style="color: ${color}; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">${title}</h3>
            <div class="warranty-list">
                ${warranties.map(w => `
                    <div class="warranty-item">
                        <div class="product-name">${w.productName}</div>
                        <div class="expiry-detail">
                            <div class="expiry-date">Expires: ${format(w.expiryDate, 'MMM d, yyyy')}</div>
                            <div class="expiry-status">(${formatRemainingTimeForEmail(w.expiryDate)})</div>
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
        .warranty-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .warranty-item:last-child { border-bottom: none; }
        .product-name { font-weight: 600; color: #333; font-size: 16px; margin-bottom: 4px; }
        .expiry-detail { font-size: 14px; color: #555; }
        .expiry-date { display: block; margin-bottom: 4px; }
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
            <p>Here is your daily summary of your product warranties.</p>
            ${renderWarrantySection('Upcoming Warranties', upcomingWarranties, '#005050')}
            ${renderWarrantySection('Recently Expired', expiredWarranties, '#c00')}
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

async function sendEngagementEmail({ userEmail }: SendEngagementEmailParams) {
    if (!resend || !fromEmail) {
        throw new Error("Email provider (Resend) is not configured.");
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://warrantywallet.online';

    try {
        const { error } = await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Get Started with WarrantyWallet!',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Get Started with WarrantyWallet</title>
    <style>
        body { margin: 0; padding: 0; background-color: #F0F0F0; font-family: 'Inter', sans-serif, Arial; color: #0a0a0a; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
        .header { background-color: #008080; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 24px; }
        .content p { font-size: 16px; line-height: 1.5; margin: 0 0 16px; }
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
            <p>We noticed you haven't added any warranties to your wallet yet. Don't let your receipts pile up!</p>
            <p>WarrantyWallet makes it easy to store, organize, and get reminders for all your product warranties. Let our AI do the hard work for you.</p>
            <div class="button-container"><a href="${appUrl}/dashboard" class="button">Add Your First Warranty</a></div>
            <p>It only takes a minute to get started and gain peace of mind.</p>
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
        logger.error("Failed to send engagement email via Resend:", error);
        throw new Error("There was an error sending the engagement email.");
    }
}
    

    