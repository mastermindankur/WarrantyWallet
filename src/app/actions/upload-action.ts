
'use server';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {randomUUID} from 'crypto';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const requiredAwsVars = [
    'AWS_S3_REGION',
    'MY_AWS_ACCESS_KEY_ID',
    'MY_AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];
  const missingAwsVars = requiredAwsVars.filter(v => !process.env[v]);

  if (missingAwsVars.length > 0) {
    const errorMsg = `Missing S3 environment variables on the server: ${missingAwsVars.join(
      ', '
    )}. Please set them in your hosting environment.`;
    console.error(`[S3_CONFIG_ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    console.log('[S3_CONFIG] Initializing S3 client...');
    s3Client = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
      },
    });
    console.log('[S3_CONFIG] S3 client initialized successfully.');
    return s3Client;
  } catch (error: any) {
    const errorMsg = `Failed to initialize S3 client: ${error.message}`;
    console.error(`[S3_CONFIG_ERROR] ${errorMsg}`, error);
    throw new Error(errorMsg);
  }
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
  console.log(`[S3_UPLOAD] Starting upload for user: ${userId}, warranty: ${warrantyId}, file: ${fileName}`);
  const client = getS3Client();

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
    await client.send(new PutObjectCommand(params));
    console.log(`[S3_UPLOAD_SUCCESS] File uploaded successfully. S3 Key: ${s3Key}`);
    return s3Key; // Return the key, not a public URL
  } catch (error: any) {
    console.error('[S3_UPLOAD_ERROR] Error uploading to S3:', error);
    const message =
      error.name === 'AccessDenied'
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
  console.log(`[S3_PRESIGN] Generating presigned URL for key: ${key}`);
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  try {
    // The URL will be valid for 15 minutes.
    const url = await getSignedUrl(client, command, {expiresIn: 900});
    console.log(`[S3_PRESIGN_SUCCESS] Presigned URL generated for key: ${key}`);
    return url;
  } catch (error: any) {
    console.error('[S3_PRESIGN_ERROR] Error generating presigned URL:', error);
    throw new Error('Could not generate file URL.');
  }
}
