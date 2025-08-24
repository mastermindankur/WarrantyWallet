'use server';

/**
 * @fileoverview A "Hello World" function to test deployment and email sending.
 */
import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import {Resend} from 'resend';

// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');

// For 2nd Gen functions, we use process.env to access environment variables.
// These are set during deployment.
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;

let resend: Resend | null = null;
if (resendApiKey) {
    resend = new Resend(resendApiKey);
} else {
    logger.warn('RESEND_API_KEY is not configured in the environment.');
}

export const dailyReminderJob = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
    logger.info("Hello from dailyReminderJob! The function triggered successfully.");

    if (!resend) {
        logger.error("Resend is not initialized. Aborting job.");
        return;
    }
    
    if (!fromEmail) {
        logger.error("FROM_EMAIL is not configured in the environment. Aborting job.");
        return;
    }
    
    // Hardcoded for simplicity during testing
    const testUserEmail = 'mastermindankur@duck.com'; 

    try {
        await resend.emails.send({
            from: fromEmail,
            to: testUserEmail,
            subject: 'Hello from WarrantyWallet!',
            html: `
                <h1>Hello World!</h1>
                <p>This is a test email from your successfully deployed Cloud Function.</p>
            `,
        });
        logger.info(`Successfully sent test email to ${testUserEmail}`);
    } catch (error) {
        logger.error("Error sending email:", error);
    }
    
    return;
});
