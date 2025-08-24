/**
 * @fileoverview A dead-simple "Hello World" function to test deployment.
 */
import {onSchedule} from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

// This log runs when the function is initialized.
logger.info('Function cold start: Initializing...');

export const dailyReminderJob = onSchedule(
  'every day 09:00',
  async event => {
    logger.info("Hello from dailyReminderJob! The function triggered successfully.");
    return;
  },
);
