import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const BUCKET = process.env.S3_BUCKET || 'tpfinal-aws-buckets3-icham-243017877765-eu-west-3-an';
const REGION = process.env.AWS_REGION || 'eu-west-3';
const s3 = new S3Client({ region: REGION });

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    const ext = body.fileName?.split('.').pop() || 'jpg';
    const key = `covers/${randomUUID()}.${ext}`;
    const contentType = body.contentType || 'image/jpeg';

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ uploadUrl, publicUrl, key })
    };
  } catch (err) {
    console.error('Upload Lambda Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
