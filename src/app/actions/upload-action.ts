'use server';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

let s3Client: S3Client | null = null;
let s3InitializationError: string | null = null;

try {
  const requiredAwsVars = [
    'AWS_S3_REGION',
    'MY_AWS_ACCESS_KEY_ID',
    'MY_AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];
  const missingAwsVars = requiredAwsVars.filter(v => !process.env[v]);

  if (missingAwsVars.length > 0) {
    throw new Error(`Missing S3 environment variables on the server: ${missingAwsVars.join(', ')}`);
  }

  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION!,
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    },
  });
} catch (error: any) {
  s3InitializationError = error.message || 'An unknown error occurred during S3 client initialization.';
  console.error(`[S3_CONFIG_ERROR] S3 client failed to initialize. ${s3InitializationError}`);
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
  if (s3InitializationError || !s3Client) {
    const errorMsg = `AWS S3 client is not configured on the server. Reason: ${s3InitializationError || 'Unknown error.'}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Convert data URI to buffer
  const fileBuffer = Buffer.from(fileDataUri.split(',')[1], 'base64');
  const mimeType = fileDataUri.split(';')[0].split(':')[1];
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${randomUUID()}.${fileExtension}`;
  const s3Key = `warranties/${userId}/${warrantyId}/${uniqueFileName}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
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
    if (s3InitializationError || !s3Client) {
        const errorMsg = `AWS S3 client is not configured on the server. Reason: ${s3InitializationError || 'Unknown error.'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
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
