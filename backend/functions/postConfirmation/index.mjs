import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT;
const client = new DynamoDBClient(
  endpoint ? { endpoint, region: 'eu-west-3', credentials: { accessKeyId: 'fakeKey', secretAccessKey: 'fakeSecret' } } : {}
);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE = process.env.USERS_TABLE || 'Users';

export const handler = async (event) => {
  // Cognito Post Confirmation trigger event
  const { sub, email, name, given_name, family_name } = event.request.userAttributes;

  const item = {
    userId: sub,
    email,
    name: name || `${given_name || ''} ${family_name || ''}`.trim(),
    subscriptionStatus: 'active',
    joinDate: new Date().toISOString()
  };

  try {
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    console.log(`✅ User ${email} (${sub}) added to Users table.`);
  } catch (err) {
    console.error('❌ Failed to insert user into DynamoDB:', err);
    // Don't throw — Cognito would block the confirmation
  }

  // MUST return the event object for Cognito to proceed
  return event;
};
