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
 * @fileoverview A "Hello World" function to test deployment and email sending.
 */
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
const resend_1 = require("resend");
// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');
// Initialize Resend with the API key from function configuration
// This is a secure way to store credentials
let resend = null;
try {
    const resendApiKey = functions.config().resend.api_key;
    if (resendApiKey) {
        resend = new resend_1.Resend(resendApiKey);
    }
    else {
        logger.warn('Resend API key is not configured.');
    }
}
catch (error) {
    logger.warn('Could not access functions.config().resend.api_key. Ensure config is set.');
}
exports.dailyReminderJob = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
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
    }
    catch (error) {
        logger.error("Error sending email:", error);
    }
    return;
});
//# sourceMappingURL=index.js.map