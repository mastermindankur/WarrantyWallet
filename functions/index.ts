'use server';

/**
 * @fileoverview A "Hello World" function to test deployment and email sending.
 */
import * as functions from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import {Resend} from 'resend';

// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');

// For 2nd Gen functions, we use process.env to access environment variables.
// These are set during deployment from the .env file.
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;

let resend: Resend | null = null;
if (resendApiKey) {
    resend = new Resend(resendApiKey);
    logger.info('Resend client initialized.');
} else {
    logger.warn('RESEND_API_KEY is not configured in the environment.');
}

export const dailyReminderJob = functions.scheduler.onSchedule('every day 09:00', async (event) => {
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
        logger.info(`Attempting to send email from ${fromEmail} to ${testUserEmail}...`);
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: testUserEmail,
            subject: 'Hello from WarrantyWallet!',
            html: `
                <h1>Hello World!</h1>
                <p>This is a test email from your successfully deployed Cloud Function.</p>
            `,
        });

        if (error) {
            logger.error("Error response from Resend:", error);
            throw new Error(`Resend failed to send email: ${error.message}`);
        }

        logger.info(`Successfully sent test email to ${testUserEmail}. Response ID: ${data?.id}`);
    } catch (error) {
        logger.error("Error in email sending block:", error);
    }
    
    return;
});
