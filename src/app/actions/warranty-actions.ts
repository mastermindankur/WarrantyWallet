'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
// Firestore-related imports are no longer needed here.

let s3Client: S3Client | null = null;

if (
  process.env.AWS_S3_REGION &&
  process.env.AWS_ACCESS_KEY_ID1 &&
  process.env.AWS_SECRET_ACCESS_KEY1
) {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID1,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY1,
    },
  });
}

async function deleteFileFromS3(key: string) {
    if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) {
        throw new Error('AWS S3 environment variables are not configured for deletion.');
    }

    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
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
