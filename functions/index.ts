/**
 * This file is not part of the Next.js app. It is a Google Cloud Function.
 * It must be deployed separately using the Firebase CLI.
 *
 * To deploy:
 * 1. Make sure you have the Firebase CLI installed and are logged in.
 * 2. Run `npm run deploy:functions` from the project root.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from 'firebase-functions';
import { onSchedule } from "firebase-functions/v2/scheduler";
import { Resend } from "resend";

// A simple "Hello World" function to test deployment.

// Initialize Firebase Admin SDK
initializeApp();

// Initialize Resend using Firebase Functions Config
let resend: Resend | null = null;
const config = functions.config();
const resendApiKey = config.resend?.api_key;
const fromEmail = config.from?.email;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn("Resend API key is missing from config. Run 'firebase functions:config:set resend.api_key=\"YOUR_KEY\"'");
}

if (!fromEmail) {
    console.warn("From email is missing from config. Run 'firebase functions:config:set from.email=\"YOUR_EMAIL\"'");
}


// --- Main Cloud Function ---
export const dailyreminderemails = onSchedule(
  "every day 09:00",
  async (event) => {
    console.log("Starting 'Hello World' email job.");

    if (!resend || !fromEmail) {
      console.error("Aborting job. Resend is not configured correctly. Check your Firebase Functions config by running 'firebase functions:config:get'");
      return;
    }

    try {
        await resend.emails.send({
            from: fromEmail,
            to: fromEmail, // Sending to self for testing
            subject: "Function Deployment Test: Hello World!",
            html: "<h1>Success!</h1><p>Your scheduled cloud function deployed and ran successfully.</p>",
        });
        console.log(`Successfully sent 'Hello World' email to ${fromEmail}`);
    } catch (error) {
        console.error(`Failed to send test email to ${fromEmail}:`, error);
    }
    
    console.log("'Hello World' email job finished.");
  }
);
