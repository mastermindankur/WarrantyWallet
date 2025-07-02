'use server';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

let s3Client: S3Client | null = null;

if (
  process.env.AWS_S3_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
) {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
        // We will not throw an error here, to allow Firestore deletion to proceed even if S3 file deletion fails.
        // This prevents orphaned Firestore documents if S3 permissions are misconfigured.
    }
}

interface DeleteWarrantyParams {
    warrantyId: string;
    invoiceKey?: string;
    warrantyCardKey?: string;
}

export async function deleteWarranty({ warrantyId, invoiceKey, warrantyCardKey }: DeleteWarrantyParams): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Firebase is not configured.' };
    }

    try {
        // Attempt to delete files from S3 first. This is non-critical; we prioritize deleting the DB record.
        if (invoiceKey) {
            await deleteFileFromS3(invoiceKey);
        }
        if (warrantyCardKey) {
            await deleteFileFromS3(warrantyCardKey);
        }

        // Delete the document from Firestore
        await deleteDoc(doc(db, 'warranties', warrantyId));

        return { success: true, message: 'Warranty deleted successfully.' };
    } catch (error: any) {
        console.error('Error deleting warranty:', error);
        return { success: false, message: error.message || 'An unexpected error occurred during deletion.' };
    }
}
