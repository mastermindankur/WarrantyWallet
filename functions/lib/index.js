"use strict";
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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyreminderemails = void 0;
/**
 * This file is not part of the Next.js app. It is a Google Cloud Function.
 * It must be deployed separately using the Firebase CLI.
 *
 * To deploy:
 * 1. Make sure you have the Firebase CLI installed and are logged in.
 * 2. Run `npm run deploy:functions` from the project root.
 */
const app_1 = require("firebase-admin/app");
const functions = __importStar(require("firebase-functions"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const resend_1 = require("resend");
// A simple "Hello World" function to test deployment.
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
// Initialize Resend using Firebase Functions Config
let resend = null;
const config = functions.config();
const resendApiKey = (_a = config.resend) === null || _a === void 0 ? void 0 : _a.api_key;
const fromEmail = (_b = config.from) === null || _b === void 0 ? void 0 : _b.email;
if (resendApiKey) {
    resend = new resend_1.Resend(resendApiKey);
}
else {
    console.warn("Resend API key is missing from config. Run 'firebase functions:config:set resend.api_key=\"YOUR_KEY\"'");
}
if (!fromEmail) {
    console.warn("From email is missing from config. Run 'firebase functions:config:set from.email=\"YOUR_EMAIL\"'");
}
// --- Main Cloud Function ---
exports.dailyreminderemails = (0, scheduler_1.onSchedule)("every day 09:00", async (event) => {
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
    }
    catch (error) {
        console.error(`Failed to send test email to ${fromEmail}:`, error);
    }
    console.log("'Hello World' email job finished.");
});
//# sourceMappingURL=index.js.map
