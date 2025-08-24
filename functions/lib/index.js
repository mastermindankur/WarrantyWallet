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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyReminderJob = void 0;
/**
 * @fileoverview A "Hello World" function to test deployment and email sending.
 */
const functions = __importStar(require("firebase-functions/v2"));
const logger = __importStar(require("firebase-functions/logger"));
const resend_1 = require("resend");
// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');
// For 2nd Gen functions, we use process.env to access environment variables.
// These are set during deployment from the .env file.
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
exports.dailyReminderJob = functions.scheduler.onSchedule('every day 09:00', async (event) => {
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
            // Log the entire error object for better diagnostics
            logger.error("Error response from Resend:", JSON.stringify(error, null, 2));
            throw new Error(`Resend failed to send email. Details: ${JSON.stringify(error)}`);
        }
        logger.info(`Successfully sent test email to ${testUserEmail}. Response ID: ${data?.id}`);
    }
    catch (error) {
        logger.error("Error in email sending block:", error);
    }
    return;
});
