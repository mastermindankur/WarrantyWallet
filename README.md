
# 🛡️ WarrantyWallet

**Stop Losing Receipts. Start Winning at Warranties.**

WarrantyWallet is a modern, AI-powered application designed to help you effortlessly manage all your product warranties. Simply snap a photo of your receipt or warranty card, and let our AI do the rest. Never miss a claim deadline again!

## ✨ Key Features

- **🔒 Secure User Authentication**: Easy sign-up and login to keep your personal warranty collection private and secure.
- **🤖 AI-Powered Data Extraction**: Upload a document, and our AI automatically detects purchase dates, expiry dates, and warranty periods, saving you from manual entry.
- **⚠️ Intelligent Warnings**: The AI proactively warns you about potentially short warranty periods for certain product types, helping you make informed decisions.
- **📊 Centralized Dashboard**: A clear and intuitive overview of all your warranties. Filter by category and sort by expiry date to find what you need in seconds.
- **☁️ Secure Cloud Storage**: Your sensitive documents are uploaded to a private cloud vault, not stored publicly. We use presigned URLs to grant temporary, secure access only when you need it.
- **🗂️ Category Management**: Organize your warranties by category (Electronics, Appliances, etc.) for easy filtering and access.
- **✏️ Full CRUD Control**: Easily add, edit, and delete warranty information as needed.
- **📧 Automated Email Reminders**: A daily job checks for expiring warranties and sends you a summary email, so you're always ahead of deadlines. It also sends engagement emails to new users.

## 🛠️ Tech Stack

This project is built with a modern, robust, and scalable tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router for server-side rendering)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI Toolkit**: [Genkit](https://firebase.google.com/docs/genkit) with the [Google AI Plugin](https://firebase.google.com/docs/genkit/plugins/google-ai) (Gemini)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) for flexible, scalable data storage.
- **File Storage**: [Amazon S3](https://aws.amazon.com/s3/) for secure, private file storage.
- **Email Delivery**: [Resend](https://resend.com/) for reliable transactional emails.
- **Scheduled Jobs**: [Google Cloud Functions](https://firebase.google.com/docs/functions) for running background tasks like sending daily reminders.
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react) for clean and consistent icons.

## 🏗️ App Architecture

The application is structured for maintainability and separation of concerns.

- **`src/app`**: Contains all Next.js pages, layouts, and server actions.
  - **`(public)`**: Public-facing pages like the landing page, login, and signup.
  - **`dashboard`**: Protected routes accessible only to authenticated users.
  - **`actions`**: Next.js Server Actions for handling server-side logic like file uploads and database operations securely.
  - **`api`**: API routes, including a deprecated cron job endpoint now replaced by a Cloud Function.
- **`src/components`**: Reusable React components. Custom components and UI elements from ShadCN (`/ui`) are located here.
- **`src/contexts`**: Manages global state, primarily the `auth-context` for user authentication status.
- **`src/lib`**: Core utilities, including Firebase configuration (`firebase.ts`), type definitions (`types.ts`), and helper functions (`utils.ts`).
- **`src/ai`**: Home to all AI-related logic.
    - **`flows`**: Genkit flows that define the AI's capabilities, like `detect-warranty-period.ts`.
    - **`genkit.ts`**: Configures and initializes the global Genkit instance.
- **`functions`**: A separate Node.js project for the daily scheduled Google Cloud Function that sends email reminders. This runs on the server with elevated privileges using the Firebase Admin SDK.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)
- A Firebase project with Authentication and Firestore enabled.
- An AWS account with an S3 bucket configured.
- A Google AI API key for Genkit.
- A Resend account and API key for sending emails.

### 1. Installation

Clone the repository and install the dependencies for both the Next.js app and the Cloud Function.

```bash
# Clone the repository
git clone https://github.com/your-username/warranty-wallet.git
cd warranty-wallet

# Install dependencies for the main app
npm install

# Install dependencies for the Cloud Function
cd functions
npm install
cd ..
```

### 2. Environment Variables

This project requires credentials for several services. You will need to create **two** `.env` files.

**A. Root `.env` file (for the Next.js app):**
Create a `.env` file in the project's root directory. This file is used by the Next.js development server.

```sh
# Firebase Client SDK Config (from your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Google AI (Genkit)
GOOGLE_API_KEY="AIza..."

# AWS S3 Config (for file uploads)
# NOTE: These are custom variable names read by the server action
AWS_S3_BUCKET_NAME="your-s3-bucket-name"
AWS_S3_REGION="us-east-1"
MY_AWS_ACCESS_KEY_ID="..."
MY_AWS_SECRET_ACCESS_KEY="..."

# Resend (for sending test emails from the client)
RESEND_API_KEY="re_..."
FROM_EMAIL="you@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**B. `functions/.env` file (for the Cloud Function):**
Create a `.env` file inside the `functions` directory. This is used by the daily reminder job.

```sh
# Resend (for the scheduled email job)
RESEND_API_KEY="re_..."
FROM_EMAIL="you@yourdomain.com"

# Test Mode Toggle
# Set to "true" to send all emails to TEST_EMAIL_ADDRESS
# Set to "false" to send emails to real user addresses
IS_TEST_MODE="true"
TEST_EMAIL_ADDRESS="your-test-email@example.com"

# App URL for email links
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Running the Application

You need to run two processes in separate terminals: one for the Next.js frontend and one for the Genkit AI backend.

**Terminal 1: Start the Next.js development server:**

```bash
npm run dev
```

Your application will be available at `http://localhost:3000`.

**Terminal 2: Start the Genkit development server:**

```bash
npm run genkit:dev
```

This starts the Genkit flows required for the AI features. The AI functionality will not work without this server running.

## 📜 Available Scripts

- **`npm run dev`**: Starts the Next.js application in development mode.
- **`npm run genkit:dev`**: Starts the Genkit flows in development mode.
- **`npm run build`**: Builds the Next.js application for production.
- **`npm run start`**: Starts a production server.
- **`npm run lint`**: Lints the codebase.
- **`npm run deploy:functions`**: Deploys the scheduled Cloud Function to Firebase.
