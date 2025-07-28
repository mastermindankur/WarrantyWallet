"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyreminderemails = void 0;
/**
 * This file is not part of the Next.js app. It is a Google Cloud Function.
 * It must be deployed separately using the Firebase CLI.
 *
 * To deploy:
 * 1. Make sure you have the Firebase CLI installed and are logged in.
 * 2. Run `firebase deploy --only functions` from the project root.
 */
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const resend_1 = require("resend");
const date_fns_1 = require("date-fns");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// Initialize Resend
let resend = null;
if (process.env.RESEND_API_KEY) {
    resend = new resend_1.Resend(process.env.RESEND_API_KEY);
}
else {
    console.warn("Resend API key is missing. Emails will not be sent.");
}
// --- Email Formatting Logic (copied from src/lib/email.ts for standalone function) ---
function formatRemainingTimeForEmail(expiryDate) {
    const now = new Date();
    const hasExpired = (0, date_fns_1.isPast)(expiryDate);
    const duration = hasExpired
        ? (0, date_fns_1.intervalToDuration)({ start: expiryDate, end: now })
        : (0, date_fns_1.intervalToDuration)({ start: now, end: expiryDate });
    const parts = [];
    if (duration.years && duration.years > 0)
        parts.push(`${duration.years} year${duration.years > 1 ? "s" : ""}`);
    if (duration.months && duration.months > 0)
        parts.push(`${duration.months} month${duration.months > 1 ? "s" : ""}`);
    if (duration.days && duration.days > 0)
        parts.push(`${duration.days} day${duration.days > 1 ? "s" : ""}`);
    if (parts.length === 0) {
        return hasExpired ? "Expired today" : "Expires today";
    }
    const formattedDuration = parts.join(", ");
    return hasExpired ? `Expired ${formattedDuration} ago` : `Expires in ${formattedDuration}`;
}
const renderWarrantySection = (title, warranties, isExpired = false) => {
    if (warranties.length === 0)
        return "";
    return `
        <h3 style="color: ${isExpired ? "#c00" : "#005050"}; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">${title}</h3>
        <div class="warranty-list">
            ${warranties
        .map((w) => `
                <div class="warranty-item">
                    <div class="product-name">${w.productName}</div>
                    <div class="expiry-detail">
                        <div class="expiry-date">Expires: ${(0, date_fns_1.format)(w.expiryDate, "MMM d, yyyy")}</div>
                        <div class="expiry-status">(${formatRemainingTimeForEmail(w.expiryDate)})</div>
                    </div>
                </div>
            `)
        .join("")}
        </div>
    `;
};
const createEmailHtml = (expiringWarranties, expiredWarranties) => {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : 'https://warrantywallet.online/dashboard';
    return `
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
        .warranty-list { padding: 10px 0; margin: 10px 0; }
        .warranty-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .warranty-item:last-child { border-bottom: none; }
        .product-name { font-weight: 600; color: #333; font-size: 16px; margin-bottom: 6px; }
        .expiry-detail { font-size: 14px; color: #555; line-height: 1.4; }
        .expiry-date { margin-bottom: 4px; }
        .expiry-status { font-weight: 500; color: #333; }
        .button-container { text-align: center; margin: 24px 0; }
        .button { background-color: #FFD700; color: #0a0a0a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; border: none; }
        .footer { padding: 24px; text-align: center; font-size: 12px; color: #7f7f7f; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>WarrantyWallet</h1></div>
        <div class="content">
            <p>Hi there,</p>
            <p>This is a summary of your product warranties that require your attention.</p>
            ${renderWarrantySection("Expiring Soon", expiringWarranties)}
            ${renderWarrantySection("Expired - Action Recommended", expiredWarranties, true)}
            <p style="margin-top: 24px;">You can view more details and manage all your warranties by visiting your dashboard.</p>
            <div class="button-container"><a href="${dashboardUrl}" class="button">View My Dashboard</a></div>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} WarrantyWallet. All rights reserved.</p></div>
    </div>
</body>
</html>`;
};
// --- Main Cloud Function ---
// This function will run every day at 9:00 AM.
exports.dailyreminderemails = (0, scheduler_1.onSchedule)("every day 09:00", async (event) => {
    var _a, _b, _c;
    console.log("Starting daily reminder email job.");
    if (!resend || !process.env.FROM_EMAIL) {
        console.error("Resend is not configured. Aborting job.");
        return;
    }
    const fromEmail = process.env.FROM_EMAIL;
    // Get all warranties that are either expiring in the next 30 days or already expired.
    const now = new Date();
    const expiryLimit = (0, date_fns_1.addDays)(now, 30);
    const warrantiesSnapshot = await db.collection("warranties")
        .where("expiryDate", "<=", expiryLimit)
        .get();
    if (warrantiesSnapshot.empty) {
        console.log("No warranties found that need reminders. Job finished.");
        return;
    }
    // Group warranties by user
    const userWarrantiesMap = new Map();
    for (const doc of warrantiesSnapshot.docs) {
        const warranty = Object.assign(Object.assign({ id: doc.id }, doc.data()), { purchaseDate: doc.data().purchaseDate.toDate(), expiryDate: doc.data().expiryDate.toDate() });
        const userId = warranty.userId;
        if (!userWarrantiesMap.has(userId)) {
            // Fetch user's email from the 'users' collection (assuming you have one)
            // For this example, we'll try to get it from an associated user document.
            // In a real app, you might store user emails directly or in a separate collection.
            // This is a placeholder for fetching user details.
            // Let's assume for now we don't have emails stored and will need to implement that.
            // For now, we will skip sending email if user doc is not found.
            // A better approach would be to store user email with the warranty, or have a users collection.
            // This example will proceed with a conceptual `users` collection.
            // This part needs to be adapted to how you store user emails.
            // Let's assume a 'users' collection where the doc ID is the UID.
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.email)) {
                    userWarrantiesMap.set(userId, { email: (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.email, warranties: [] });
                }
                else {
                    console.warn(`User document or email not found for userId: ${userId}. Skipping.`);
                    continue;
                }
            }
            catch (e) {
                console.error(`Could not fetch user data for ${userId}`, e);
                continue;
            }
        }
        (_c = userWarrantiesMap.get(userId)) === null || _c === void 0 ? void 0 : _c.warranties.push(warranty);
    }
    // Process and send emails for each user
    for (const [userId, data] of userWarrantiesMap.entries()) {
        const { email, warranties } = data;
        const expiringWarranties = warranties.filter(w => !(0, date_fns_1.isPast)(w.expiryDate));
        const expiredWarranties = warranties.filter(w => (0, date_fns_1.isPast)(w.expiryDate));
        if (expiringWarranties.length === 0 && expiredWarranties.length === 0) {
            continue; // Skip if no relevant warranties for this user
        }
        try {
            await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: "Your Warranty Status Update from WarrantyWallet",
                html: createEmailHtml(expiringWarranties, expiredWarranties),
            });
            console.log(`Successfully sent reminder to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send email to ${email} for user ${userId}:`, error);
        }
    }
    console.log("Daily reminder email job finished.");
});
//# sourceMappingURL=index.js.map