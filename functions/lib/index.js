
"use strict";
'use server';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyReminderJob = void 0;
/**
 * @fileoverview A daily scheduled Cloud Function to send warranty reminder emails.
 */
require("dotenv/config"); // Load environment variables from .env file
const functions = __importStar(require("firebase-functions/v2"));
const logger = __importStar(require("firebase-functions/logger"));
const resend_1 = require("resend");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const date_fns_1 = require("date-fns");
// Initialize Firebase Admin SDK
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;
let resend = null;
if (resendApiKey) {
    resend = new resend_1.Resend(resendApiKey);
    logger.info('Resend client initialized.');
}
else {
    logger.warn('RESEND_API_KEY is not configured in the environment.');
}
const IS_TEST_MODE = process.env.IS_TEST_MODE === 'true';
const TEST_EMAIL_ADDRESS = 'mastermindankur@duck.com';
/**
 * A scheduled function that runs daily, finds users with warranties,
 * and sends them a summary email. It also sends a reminder to users
 * who have not yet added any warranties.
 */
exports.dailyReminderJob = functions.scheduler.onSchedule('every day 09:00', async (event) => {
    logger.info("Daily reminder job started.");
    if (!resend || !fromEmail) {
        logger.error("Resend is not initialized or FROM_EMAIL is missing. Aborting job.");
        return;
    }
    try {
        const now = new Date();
        const nowTimestamp = firestore_1.Timestamp.fromDate(now);
        // 1. Fetch all warranties
        const upcomingSnapshot = await db.collection('warranties')
            .where('expiryDate', '>=', nowTimestamp)
            .get();
        const expiredSnapshot = await db.collection('warranties')
            .where('expiryDate', '<', nowTimestamp)
            .get();
        // 2. Group warranties by userId
        const userWarrantiesMap = new Map();
        const processSnapshot = (snapshot, type) => {
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const warranty = Object.assign(Object.assign({}, data), { id: doc.id, purchaseDate: data.purchaseDate.toDate(), expiryDate: data.expiryDate.toDate() });
                const userId = warranty.userId;
                if (!userWarrantiesMap.has(userId)) {
                    userWarrantiesMap.set(userId, { upcoming: [], expired: [] });
                }
                const userGroup = userWarrantiesMap.get(userId);
                if (type === 'upcoming') {
                    userGroup.upcoming.push(warranty);
                }
                else {
                    userGroup.expired.push(warranty);
                }
            });
        };
        processSnapshot(upcomingSnapshot, 'upcoming');
        processSnapshot(expiredSnapshot, 'expired');
        // 3. Process emails for users with warranties
        for (const [userId, warranties] of userWarrantiesMap.entries()) {
            if (warranties.upcoming.length === 0 && warranties.expired.length === 0) {
                continue;
            }
            try {
                let userEmail;
                if (IS_TEST_MODE) {
                    userEmail = TEST_EMAIL_ADDRESS;
                }
                else {
                    const userRecord = await auth.getUser(userId);
                    userEmail = userRecord.email;
                }
                if (userEmail) {
                    await sendReminderEmail({
                        userEmail: userEmail,
                        upcomingWarranties: warranties.upcoming,
                        expiredWarranties: warranties.expired,
                    });
                    logger.info(`Successfully sent reminder email to ${userEmail} for user ${userId}`);
                }
                else {
                    logger.warn(`Could not find email for user ${userId}. Skipping.`);
                }
            }
            catch (error) {
                logger.error(`Failed to process reminders for user ${userId}:`, error);
            }
        }
        // 4. Process engagement emails for users without warranties
        let nextPageToken;
        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            for (const user of listUsersResult.users) {
                if (!userWarrantiesMap.has(user.uid)) {
                    try {
                        let userEmail;
                        if (IS_TEST_MODE) {
                            userEmail = TEST_EMAIL_ADDRESS;
                        }
                        else {
                            userEmail = user.email;
                        }
                        if (userEmail) {
                            await sendEngagementEmail({ userEmail });
                            logger.info(`Successfully sent engagement email to ${userEmail} for user ${user.uid}`);
                        }
                        else {
                            logger.warn(`Could not find email for user ${user.uid} for engagement email. Skipping.`);
                        }
                    }
                    catch (error) {
                        logger.error(`Failed to send engagement email for user ${user.uid}:`, error);
                    }
                }
            }
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);
    }
    catch (error) {
        logger.error("Error executing daily reminder job:", error);
    }
});
function formatRemainingTimeForEmail(expiryDate) {
    const now = new Date();
    const hasExpired = (0, date_fns_1.isPast)(expiryDate);
    const duration = hasExpired
        ? (0, date_fns_1.intervalToDuration)({ start: expiryDate, end: now })
        : (0, date_fns_1.intervalToDuration)({ start: now, end: expiryDate });
    const parts = [];
    if (duration.years && duration.years > 0)
        parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
    if (duration.months && duration.months > 0)
        parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
    if (duration.days && duration.days > 0)
        parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);
    if (parts.length === 0) {
        return hasExpired ? 'Expired today' : 'Expires today';
    }
    const formattedDuration = parts.slice(0, 2).join(', ');
    return hasExpired ? `Expired ${formattedDuration} ago` : `Expires in ${formattedDuration}`;
}
async function sendReminderEmail({ userEmail, upcomingWarranties, expiredWarranties }) {
    if (!resend || !fromEmail) {
        throw new Error("Email provider (Resend) is not configured.");
    }
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://warrantywallet.online';
    const renderWarrantySection = (title, warranties, color) => {
        if (warranties.length === 0)
            return '';
        // Sort warranties by expiry date
        warranties.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
        return `
            <h3 style="color: ${color}; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">${title}</h3>
            <div class="warranty-list">
                ${warranties.map(w => `
                    <div class="warranty-item">
                        <div class="product-name">${w.productName}</div>
                        <div class="expiry-detail">
                            <div class="expiry-date">Expires: ${(0, date_fns_1.format)(w.expiryDate, 'MMM d, yyyy')}</div>
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
    }
    catch (error) {
        logger.error("Failed to send email via Resend:", error);
        throw new Error("There was an error sending the reminder email.");
    }
}
async function sendEngagementEmail({ userEmail }) {
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
    }
    catch (error) {
        logger.error("Failed to send engagement email via Resend:", error);
        throw new Error("There was an error sending the engagement email.");
    }
}
//# sourceMappingURL=index.js.map
