'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToS3(
  userId: string,
  warrantyId: string,
  fileDataUri: string,
  fileName: string
) {
  if (
    !process.env.AWS_S3_BUCKET_NAME ||
    !process.env.AWS_S3_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
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
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3.');
  }
}
