'use server';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

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

/**
 * Uploads a file to a private S3 bucket.
 * @returns The S3 key of the uploaded object.
 */
export async function uploadFileToS3(
  userId: string,
  warrantyId: string,
  fileDataUri: string,
  fileName: string
) {
  if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) {
    if (!s3Client) console.error('s3Client is null because AWS environment variables are not fully configured.');
    if (!process.env.AWS_S3_BUCKET_NAME) console.error('AWS_S3_BUCKET_NAME is not set');
    throw new Error('AWS S3 environment variables are not configured.');
  }

  // Convert data URI to buffer
  const fileBuffer = Buffer.from(fileDataUri.split(',')[1], 'base64');
  const mimeType = fileDataUri.split(';')[0].split(':')[1];
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;
  const s3Key = `warranties/${userId}/${warrantyId}/${uniqueFileName}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return s3Key; // Return the key, not a public URL
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    const message = error.name === 'AccessDenied' 
      ? 'Access Denied. Please check your S3 bucket permissions and IAM policy.' 
      : `An AWS error occurred: ${error.name || 'Unknown'}.`;
    throw new Error(message);
  }
}

/**
 * Generates a temporary, secure URL to access a private S3 object.
 * @param key The S3 key of the object.
 * @returns A presigned URL valid for a limited time.
 */
export async function getPresignedUrl(key: string) {
    if (!s3Client || !process.env.AWS_S3_BUCKET_NAME) {
        throw new Error('AWS S3 environment variables are not configured.');
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
    });

    try {
        // The URL will be valid for 15 minutes.
        const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        return url;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error('Could not generate file URL.');
    }
}
