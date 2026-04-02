import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient(
  endpoint ? { endpoint, region: 'eu-west-3', credentials: { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = process.env.USERS_TABLE || 'Users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
};

export const handler = async (event) => {
  const method = event.httpMethod;
  const userId = event.pathParameters?.id;

  try {
    // GET /api/users — list all
    if (method === 'GET') {
      const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
      return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
    }

    // PUT /api/users/{id} — update subscription
    if (method === 'PUT' && userId) {
      const body = JSON.parse(event.body);

      const updates = [];
      const values = {};
      const names = {};

      for (const [key, val] of Object.entries(body)) {
        if (key === 'userId') continue;
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
        Key: { userId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW'
      }));

      return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('User Lambda Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
