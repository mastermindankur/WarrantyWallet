import { Resend } from 'resend';
import type { Warranty } from './types';
import { format } from 'date-fns';

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.warn("Resend configuration is missing. Emails will not be sent. Please set RESEND_API_KEY and FROM_EMAIL in your .env file.");
}


export async function sendReminderEmail({ userEmail, warranties }: { userEmail: string; warranties: Warranty[] }) {
    if (!resend) {
        throw new Error("Email provider (Resend) is not configured on the server.");
    }

    if (!warranties || warranties.length === 0) {
        return; // No warranties, no email to send.
    }

    const fromEmail = process.env.FROM_EMAIL;
    if (!fromEmail) {
        throw new Error("FROM_EMAIL is not set in environment variables.");
    }
    
    try {
        await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Your Upcoming Warranty Expirations',
            html: `
                <h1>Warranty Reminders from WarrantyWallet</h1>
                <p>Hi there!</p>
                <p>This is a friendly reminder that the following product warranties are expiring soon:</p>
                <ul>
                    ${warranties.map(w => `
                        <li>
                            <strong>${w.productName}</strong> - Expires on ${format(w.expiryDate, 'MMM d, yyyy')}
                        </li>
                    `).join('')}
                </ul>
                <p>Log in to your WarrantyWallet account to view more details.</p>
                <p>Best,</p>
                <p>The WarrantyWallet Team</p>
            `,
        });
    } catch (error) {
        console.error("Failed to send email via Resend:", error);
        throw new Error("There was an error sending the reminder email.");
    }
}