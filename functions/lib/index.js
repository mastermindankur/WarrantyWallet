"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyReminderJob = void 0;
/**
 * @fileoverview A dead-simple "Hello World" function to test deployment.
 */
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');
exports.dailyReminderJob = (0, scheduler_1.onSchedule)('every day 09:00', async (event) => {
    logger.info("Hello from dailyReminderJob! The function triggered successfully.");
    return;
});
