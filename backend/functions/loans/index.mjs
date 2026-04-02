import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient(
  endpoint ? { endpoint, region: 'eu-west-3', credentials: { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);
const LOANS_TABLE = process.env.LOANS_TABLE || 'Loans';
const MEDIAS_TABLE = process.env.MEDIAS_TABLE || 'Medias';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
};

export const handler = async (event) => {
  const method = event.httpMethod;
  const loanId = event.pathParameters?.id;
  const queryParams = event.queryStringParameters || {};

  try {
    // GET /api/loans?userId=xxx — get by user (GSI) or get all
    if (method === 'GET' && !loanId) {
      if (queryParams.userId) {
        const result = await docClient.send(new QueryCommand({
          TableName: LOANS_TABLE,
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': queryParams.userId }
        }));
        return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
      }
      const result = await docClient.send(new ScanCommand({ TableName: LOANS_TABLE }));
      return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
    }

    // POST /api/loans — create reservation or direct loan
    if (method === 'POST') {
      const body = JSON.parse(event.body);
      const action = body.action; // 'reserve' or 'loan'

      if (action === 'reserve') {
        const item = {
          loanId: `l-${randomUUID()}`,
          mediaId: body.mediaId,
          userId: body.userId,
          reservationDate: new Date().toISOString(),
          status: 'reserved'
        };
        await docClient.send(new PutCommand({ TableName: LOANS_TABLE, Item: item }));
        // Update media status
        await docClient.send(new UpdateCommand({
          TableName: MEDIAS_TABLE,
          Key: { mediaId: body.mediaId },
          UpdateExpression: 'SET #s = :s',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': 'reserved' }
        }));
        return { statusCode: 201, headers, body: JSON.stringify(item) };
      }

      if (action === 'loan') {
        const item = {
          loanId: `l-${randomUUID()}`,
          mediaId: body.mediaId,
          userId: body.userId,
          loanDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          returnDate: null,
          status: 'active'
        };
        await docClient.send(new PutCommand({ TableName: LOANS_TABLE, Item: item }));
        await docClient.send(new UpdateCommand({
          TableName: MEDIAS_TABLE,
          Key: { mediaId: body.mediaId },
          UpdateExpression: 'SET #s = :s',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': 'loaned' }
        }));
        return { statusCode: 201, headers, body: JSON.stringify(item) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'action must be "reserve" or "loan"' }) };
    }

    // PUT /api/loans/{id} — process (reserve→active) or return (active→returned)
    if (method === 'PUT' && loanId) {
      const body = JSON.parse(event.body);
      const action = body.action; // 'process' or 'return'

      if (action === 'process') {
        const result = await docClient.send(new UpdateCommand({
          TableName: LOANS_TABLE,
          Key: { loanId },
          UpdateExpression: 'SET #s = :s, loanDate = :ld, dueDate = :dd',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':s': 'active',
            ':ld': new Date().toISOString(),
            ':dd': new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
          },
          ReturnValues: 'ALL_NEW'
        }));
        // Update media
        if (result.Attributes?.mediaId) {
          await docClient.send(new UpdateCommand({
            TableName: MEDIAS_TABLE,
            Key: { mediaId: result.Attributes.mediaId },
            UpdateExpression: 'SET #s = :s',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':s': 'loaned' }
          }));
        }
        return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
      }

      if (action === 'return') {
        const result = await docClient.send(new UpdateCommand({
          TableName: LOANS_TABLE,
          Key: { loanId },
          UpdateExpression: 'SET #s = :s, returnDate = :rd',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: {
            ':s': 'returned',
            ':rd': new Date().toISOString()
          },
          ReturnValues: 'ALL_NEW'
        }));
        if (result.Attributes?.mediaId) {
          await docClient.send(new UpdateCommand({
            TableName: MEDIAS_TABLE,
            Key: { mediaId: result.Attributes.mediaId },
            UpdateExpression: 'SET #s = :s',
            ExpressionAttributeNames: { '#s': 'status' },
            ExpressionAttributeValues: { ':s': 'available' }
          }));
        }
        return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: 'action must be "process" or "return"' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('Loan Lambda Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
