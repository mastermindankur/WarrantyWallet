'use server';

import {S3Client, DeleteObjectCommand} from '@aws-sdk/client-s3';

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
    const errorMsg = `Missing S3 environment variables for warranty actions: ${missingAwsVars.join(
      ', '
    )}`;
    console.error(`[S3_CONFIG_ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    s3Client = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
      },
    });
    return s3Client;
  } catch (error: any) {
    const errorMsg = `Failed to initialize S3 client for warranty actions: ${error.message}`;
    console.error(
      `[S3_CONFIG_ERROR] S3 client failed to initialize for warranty actions. ${errorMsg}`,
       error
    );
    throw new Error(errorMsg);
  }
}

async function deleteFileFromS3(key: string) {
  const client = getS3Client();

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  };

  try {
    await client.send(new DeleteObjectCommand(params));
  } catch (error: any) {
    console.error(`Failed to delete file ${key} from S3:`, error);
    // We will not throw an error here, to allow the primary record deletion to proceed
    // even if S3 file deletion fails (e.g., due to permissions).
  }
}

interface DeleteWarrantyFilesParams {
  invoiceKey?: string;
  warrantyCardKey?: string;
}

export async function deleteWarrantyFiles({
  invoiceKey,
  warrantyCardKey,
}: DeleteWarrantyFilesParams): Promise<{success: boolean; message: string}> {
  try {
    // The getS3Client call is now inside deleteFileFromS3
    if (invoiceKey) {
      await deleteFileFromS3(invoiceKey);
    }
    if (warrantyCardKey) {
      await deleteFileFromS3(warrantyCardKey);
    }

    return {success: true, message: 'Associated files deleted.'};
  } catch (error: any) {
    console.error('Error deleting warranty files from S3:', error);
    return {
      success: false,
      message:
        error.message ||
        'An unexpected error occurred during file deletion.',
    };
  }
}
