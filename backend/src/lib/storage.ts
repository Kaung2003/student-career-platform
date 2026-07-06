import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env["R2_ACCOUNT_ID"] &&
      process.env["R2_ACCESS_KEY_ID"] &&
      process.env["R2_SECRET_ACCESS_KEY"] &&
      process.env["R2_BUCKET_NAME"] &&
      process.env["R2_PUBLIC_URL"],
  );
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env["R2_ACCESS_KEY_ID"]!,
        secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"]!,
      },
    });
  }
  return client;
}

export async function uploadFile(buffer: Buffer, contentType: string, keyPrefix: string): Promise<string> {
  const key = `${keyPrefix}/${randomUUID()}`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env["R2_BUCKET_NAME"],
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${process.env["R2_PUBLIC_URL"]}/${key}`;
}
