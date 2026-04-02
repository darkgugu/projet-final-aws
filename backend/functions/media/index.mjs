import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient(
  endpoint ? { endpoint, region: 'eu-west-3', credentials: { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = process.env.MEDIAS_TABLE || 'Medias';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

export const handler = async (event) => {
  const method = event.httpMethod;
  const mediaId = event.pathParameters?.id;

  try {
    // GET /api/media — list all
    if (method === 'GET' && !mediaId) {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
      return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
    }

    // GET /api/media/{id} — get one
    if (method === 'GET' && mediaId) {
      const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { mediaId } }));
      if (!result.Item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Media not found' }) };
      return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
    }

    // POST /api/media — create
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const item = {
        mediaId: `m-${randomUUID()}`,
        type: body.type || 'book',
        title: body.title,
        author: body.author || null,
        director: body.director || null,
        year: body.year || new Date().getFullYear(),
        coverUrl: body.coverUrl || 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=600&auto=format&fit=crop',
        status: 'available',
        description: body.description || ''
      };
      await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
      return { statusCode: 201, headers, body: JSON.stringify(item) };
    }

    // PUT /api/media/{id} — update
    if (method === 'PUT' && mediaId) {
      const body = JSON.parse(event.body);
      const updates = [];
      const values = {};
      const names = {};

      for (const [key, val] of Object.entries(body)) {
        if (key === 'mediaId') continue;
        const attr = `#${key}`;
        const placeholder = `:${key}`;
        updates.push(`${attr} = ${placeholder}`);
        names[attr] = key;
        values[placeholder] = val;
      }

      if (updates.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
      }

      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE,
        Key: { mediaId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW'
      }));

      return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
    }

    // DELETE /api/media/{id}
    if (method === 'DELETE' && mediaId) {
      await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { mediaId } }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Media Lambda Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
