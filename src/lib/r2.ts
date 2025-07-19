import { S3Client } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto', // R2 usa 'auto' como região
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export { r2Client };