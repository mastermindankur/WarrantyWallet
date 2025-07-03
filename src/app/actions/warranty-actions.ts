'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
// Firestore-related imports are no longer needed here.

let s3Client: S3Client | null = null;

const requiredAwsVars = [
  'AWS_S3_REGION',
  'MY_AWS_ACCESS_KEY_ID',
  'MY_AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
];
const missingAwsVars = requiredAwsVars.filter(v => !process.env[v]);

if (missingAwsVars.length > 0) {
  console.error(`[S3_CONFIG_ERROR] S3 client not initialized for warranty actions. Missing environment variables on the server: ${missingAwsVars.join(', ')}`);
} else {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    },
  });
}


async function deleteFileFromS3(key: string) {
    if (!s3Client) {
        const errorMsg = 'AWS S3 client is not configured on the server. Please check server logs for missing environment variables.';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
    };

    try {
        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error(`Failed to delete file ${key} from S3:`, error);
        // We will not throw an error here, to allow the primary record deletion to proceed 
        // even if S3 file deletion fails (e.g., due to permissions).
    }
}

interface DeleteWarrantyFilesParams {
    invoiceKey?: string;
    warrantyCardKey?: string;
}

export async function deleteWarrantyFiles({ invoiceKey, warrantyCardKey }: DeleteWarrantyFilesParams): Promise<{ success: boolean; message: string }> {
    try {
        if (invoiceKey) {
            await deleteFileFromS3(invoiceKey);
        }
        if (warrantyCardKey) {
            await deleteFileFromS3(warrantyCardKey);
        }

        return { success: true, message: 'Associated files deleted.' };
    } catch (error: any) {
        console.error('Error deleting warranty files from S3:', error);
        return { success: false, message: error.message || 'An unexpected error occurred during file deletion.' };
    }
}
