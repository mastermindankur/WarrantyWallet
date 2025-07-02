'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

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
    ACL: 'public-read', // Make the file publicly readable
  };

  try {
    await s3Client.send(new PutObjectCommand(params));

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${s3Key}`;
    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    // Provide a more specific error message to help with debugging.
    // The "AccessDenied" error name is a common indicator of a permissions or public access block issue.
    const message = error.name === 'AccessDenied' 
      ? 'Access Denied. Please check your S3 bucket permissions and public access block settings.' 
      : `An AWS error occurred: ${error.name || 'Unknown'}.`;
    throw new Error(message);
  }
}
