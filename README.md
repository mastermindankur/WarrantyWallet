# 🛡️ WarrantyWallet

**Stop Losing Receipts. Start Winning at Warranties.**

WarrantyWallet is a modern, AI-powered application designed to help you effortlessly manage all your product warranties. Snap a photo of your receipt or warranty card, and let our AI do the rest. Never miss a claim deadline again!

## ✨ Key Features

- **User Authentication**: Secure registration and login to manage your personal warranty collection.
- **AI-Powered Data Extraction**: Automatically detects purchase dates, expiry dates, and warranty periods from uploaded invoices and warranty cards.
- **Intelligent Warnings**: Get alerted about potentially short warranty periods for your products.
- **Centralized Dashboard**: A clear and intuitive overview of all your warranties, sortable by expiry date.
- **Secure File Storage**: Your uploaded documents are stored securely in the cloud.
- **Category Management**: Organize your warranties by category for easy filtering and access.
- **Edit & Delete**: Full control to update warranty information or remove old entries.

## 🛠️ Tech Stack

This project is built with a modern, robust tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI Toolkit**: [Genkit](https://firebase.google.com/docs/genkit) with the [Google AI Plugin](https://firebase.google.com/docs/genkit/plugins/google-ai) (Gemini)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **File Storage**: [Amazon S3](https://aws.amazon.com/s3/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## 🏗️ App Architecture

The application follows a modern web architecture, separating concerns for maintainability and scalability.

- **`src/app`**: Contains the Next.js App Router pages and layouts. Public-facing pages (Home, Login, Signup) and the protected `/dashboard` are defined here.
- **`src/components`**: Houses reusable React components, including UI elements from ShadCN (`/ui`) and custom application components.
- **`src/contexts`**: Manages global state using React's Context API, such as the `auth-context` for user authentication status.
- **`src/lib`**: Includes utility functions (`utils.ts`), Firebase configuration (`firebase.ts`), and TypeScript type definitions (`types.ts`).
- **`src/ai`**: Home to all AI-related logic.
    - **`flows`**: Contains the Genkit flows that define the AI's capabilities, such as `detect-warranty-period.ts`.
    - **`genkit.ts`**: Configures and initializes the global Genkit instance.
- **`src/app/actions`**: Implements Next.js Server Actions for server-side logic like handling file uploads to S3 and deleting records.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/warranty-wallet.git
cd warranty-wallet
npm install
```

### 2. Environment Variables

This project requires credentials for Firebase, AWS S3, and Google AI.

1.  Create a `.env` file in the root of your project.
2.  Add your credentials to the file. The application uses the following custom environment variables for AWS credentials:
    - `MY_AWS_ACCESS_KEY_ID`
    - `MY_AWS_SECRET_ACCESS_KEY`
    
    You will also need to provide your `AWS_S3_REGION`, and `AWS_S3_BUCKET_NAME`. You can get these values from:
    - Your Firebase project settings.
    - Your AWS IAM console for S3 access.
    - Google AI Studio or Google Cloud Console for the Gemini API key.

### 3. Running the Application

You need to run two processes in separate terminals: one for the Next.js frontend and one for the Genkit AI backend.

**Terminal 1: Start the Next.js development server:**

```bash
npm run dev
```

Your application will be available at `http://localhost:9002`.

**Terminal 2: Start the Genkit development server:**

```bash
npm run genkit:dev
```

This starts the Genkit flows required for the AI features. The AI functionality will not work without this server running.

## 📜 Available Scripts

- **`npm run dev`**: Starts the Next.js application in development mode.
- **`npm run genkit:dev`**: Starts the Genkit flows in development mode.
- **`npm run build`**: Builds the application for production.
- **`npm run start`**: Starts a production server.
- **`npm run lint`**: Lints the codebase using Next.js's built-in ESLint configuration.
