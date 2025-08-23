// This file is now a placeholder. The cron job logic has been migrated to a
// secure, server-side Google Cloud Function, which is the recommended approach.
import { NextResponse } from 'next/server';

/**
 * THIS ENDPOINT IS DEPRECATED.
 * The cron job for sending daily reminders is now handled by a Google Cloud Function
 * defined in `/functions/index.ts`. This is a more secure and scalable approach.
 *
 * Why the change?
 * - A Next.js API route runs with client-side SDK limitations. It cannot securely
 *   query data for all users without making Firestore rules dangerously insecure.
 * - A Google Cloud Function uses the Firebase Admin SDK, which has the necessary
 *   permissions to read all user data for administrative tasks like sending reminders.
 *
 * How to manage the new cron job:
 * 1. The function code is in `/functions/index.ts`.
 * 2. It is scheduled to run daily via Google Cloud Scheduler.
 * 3. Deploy any changes to the function by running `npm run deploy:functions`
 *    from the project root directory.
 *
 * This API route is kept to prevent breaking any old cron job setups and to provide
 * clear information about the new system.
 *
 * @param {Request} request - The incoming request object.
 * @returns {NextResponse} - A JSON response explaining the new system.
 */
export async function GET(request: Request) {
  const message = "This cron job endpoint is deprecated. Reminders are now handled by a scheduled Google Cloud Function for better security and reliability.";
  
  console.log(`[DEPRECATED] Cron endpoint was triggered. Directing to new implementation info.`);
  
  return NextResponse.json({
      message: message,
      details: "Please see the source code of this file (`src/app/api/cron/send-reminders/route.ts`) for more information on the new architecture.",
  }, { status: 410 }); // 410 Gone
}

    