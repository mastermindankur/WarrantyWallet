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
    
    // Construct the URL to the dashboard
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : 'https://warrantywallet.online/dashboard';

    try {
        await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Your Upcoming Warranty Expirations',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warranty Expiration Reminder</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #F0F0F0;
            font-family: 'Inter', sans-serif, Arial;
            color: #0a0a0a;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
        }
        .header {
            background-color: #008080;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 24px;
        }
        .content p {
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 16px;
        }
        .warranty-list {
            border-top: 1px solid #e0e0e0;
            border-bottom: 1px solid #e0e0e0;
            padding: 16px 0;
            margin: 16px 0;
        }
        .warranty-item {
            padding: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        .warranty-item strong {
            font-weight: 600;
            color: #005050;
        }
        .button-container {
            text-align: center;
            margin: 24px 0;
        }
        .button {
            background-color: #FFD700;
            color: #0a0a0a;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            border: none;
        }
        .footer {
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #7f7f7f;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WarrantyWallet</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>This is a friendly reminder that the following product warranties are expiring soon:</p>
            <div class="warranty-list">
                ${warranties.map(w => `
                    <div class="warranty-item">
                        <strong>${w.productName}</strong>
                        <span>Expires on ${format(w.expiryDate, 'MMM d, yyyy')}</span>
                    </div>
                `).join('')}
            </div>
            <p>You can view more details and manage your warranties by visiting your dashboard.</p>
            <div class="button-container">
                <a href="${dashboardUrl}" class="button">View My Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WarrantyWallet. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
        });
    } catch (error) {
        console.error("Failed to send email via Resend:", error);
        throw new Error("There was an error sending the reminder email.");
    }
}
