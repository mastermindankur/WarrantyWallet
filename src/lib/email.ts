import { Resend } from 'resend';
import type { Warranty } from './types';
import { format, isPast, intervalToDuration } from 'date-fns';

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY && process.env.FROM_EMAIL) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.warn("Resend configuration is missing. Emails will not be sent. Please set RESEND_API_KEY and FROM_EMAIL in your .env file.");
}

interface SendReminderEmailParams {
    userEmail: string;
    expiringWarranties: Warranty[];
    expiredWarranties: Warranty[];
}

function formatRemainingTimeForEmail(expiryDate: Date): string {
  const now = new Date();
  const hasExpired = isPast(expiryDate);

  const duration = hasExpired
    ? intervalToDuration({ start: expiryDate, end: now })
    : intervalToDuration({ start: now, end: expiryDate });

  const parts = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years} year${duration.years > 1 ? 's' : ''}`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months} month${duration.months > 1 ? 's' : ''}`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days} day${duration.days > 1 ? 's' : ''}`);

  if (parts.length === 0) {
    return hasExpired ? 'Expired today' : 'Expires today';
  }

  const formattedDuration = parts.join(', ');
  
  return hasExpired ? `Expired ${formattedDuration} ago` : `Expires in ${formattedDuration}`;
}

export async function sendReminderEmail({ userEmail, expiringWarranties, expiredWarranties }: SendReminderEmailParams) {
    if (!resend) {
        throw new Error("Email provider (Resend) is not configured on the server.");
    }

    if (expiringWarranties.length === 0 && expiredWarranties.length === 0) {
        return; // No warranties, no email to send.
    }

    const fromEmail = process.env.FROM_EMAIL;
    if (!fromEmail) {
        throw new Error("FROM_EMAIL is not set in environment variables.");
    }
    
    // Construct the URL to the dashboard
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : 'https://warrantywallet.online/dashboard';

    const renderWarrantySection = (title: string, warranties: Warranty[], isExpired = false) => {
        if (warranties.length === 0) return '';
        
        return `
            <h3 style="color: ${isExpired ? '#c00' : '#005050'}; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px;">${title}</h3>
            <div class="warranty-list">
                ${warranties.map(w => `
                    <div class="warranty-item">
                        <div class="product-name">${w.productName}</div>
                        <div class="expiry-detail">
                            <div class="expiry-date">Expires: ${format(w.expiryDate, 'MMM d, yyyy')}</div>
                            <div class="expiry-status">(${formatRemainingTimeForEmail(w.expiryDate)})</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    try {
        await resend.emails.send({
            from: fromEmail,
            to: userEmail,
            subject: 'Your Warranty Status Update from WarrantyWallet',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warranty Status Update</title>
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
            padding: 10px 0;
            margin: 10px 0;
        }
        .warranty-item {
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .warranty-item:last-child {
            border-bottom: none;
        }
        .product-name {
            font-weight: 600;
            color: #333;
            font-size: 16px;
            margin-bottom: 6px;
        }
        .expiry-detail {
            font-size: 14px;
            color: #555;
            line-height: 1.4;
        }
        .expiry-date {
             margin-bottom: 4px;
        }
        .expiry-status {
            font-weight: 500;
            color: #333;
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
            <p>This is a summary of your product warranties that require your attention.</p>
            
            ${renderWarrantySection('Expiring Soon', expiringWarranties)}
            ${renderWarrantySection('Expired - Action Recommended', expiredWarranties, true)}

            <p style="margin-top: 24px;">You can view more details and manage all your warranties by visiting your dashboard.</p>
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
