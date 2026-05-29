import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing AWS credentials: set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.",
  );
}

export const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const S3_BUCKET = (() => {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Missing S3_BUCKET_NAME env var.");
  return bucket;
})();

export function buildDocumentKey(siteId: string, fileName: string): string {
  const safe = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
  return `documents/sites/${siteId}/${crypto.randomUUID()}-${safe}`;
}
