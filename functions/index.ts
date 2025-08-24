'use server';

/**
 * @fileoverview A "Hello World" function to test deployment and email sending.
 */
import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import {Resend} from 'resend';

// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');

// Initialize Resend with the API key from function configuration
// This is a secure way to store credentials
let resend: Resend | null = null;
try {
  const resendApiKey = functions.config().resend.api_key;
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
  } else {
    logger.warn('Resend API key is not configured.');
  }
} catch (error) {
    logger.warn('Could not access functions.config().resend.api_key. Ensure config is set.');
}


export const dailyReminderJob = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
    logger.info("Hello from dailyReminderJob! The function triggered successfully.");

    if (!resend) {
        logger.error("Resend is not configured. Aborting job.");
        return;
    }

    const fromEmail = functions.config().from.email;
    if (!fromEmail) {
        logger.error("FROM_EMAIL is not configured. Aborting job.");
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
