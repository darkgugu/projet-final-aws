import { handler } from './index.mjs';

const event = {
  httpMethod: 'GET',
  pathParameters: null,
  body: null
};

handler(event).then(res => console.log('Response:', res)).catch(err => console.error('Error:', err));
