const fs = require('fs');
const path = require('path');

const root = process.cwd();
const openApiPath = path.join(root, 'src', 'docs', 'openapi.json');
const postmanPath = path.join(root, 'src', 'docs', 'postman_collection.json');

const requiredOpenApiPaths = [
  '/health',
  '/api',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/events',
  '/api/events/{id}',
  '/api/events/{eventId}/tickets',
  '/api/events/{eventId}/tickets/{ticketId}',
  '/api/events/{eventId}/attendees',
  '/api/events/{eventId}/attendees/register',
  '/api/events/{eventId}/attendees/{attendeeId}/checkin',
  '/api/events/{eventId}/attendees/{attendeeId}',
  '/api/events/{eventId}/comments',
  '/api/events/{eventId}/comments/{id}',
  '/api/payments/{userId}',
  '/api/payments/purchase/{ticketId}',
  '/api/payments/refund/{id}',
  '/api/notifications',
  '/api/notifications/send',
  '/api/notifications/{id}/read',
  '/api/analytics/events/{id}',
  '/api/analytics/users',
  '/api/webhooks/stripe'
];

const requiredPostmanVariables = [
  'baseUrl',
  'attendeeToken',
  'organizerToken',
  'adminToken',
  'eventId',
  'ticketId'
];

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON at ${filePath}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = () => {
  const openapi = readJson(openApiPath);
  const postman = readJson(postmanPath);

  assert(openapi.openapi, 'Missing "openapi" field');
  assert(openapi.info && openapi.info.title, 'OpenAPI info.title is required');
  assert(openapi.paths && typeof openapi.paths === 'object', 'OpenAPI paths object is required');

  const availablePaths = Object.keys(openapi.paths);
  const missingPaths = requiredOpenApiPaths.filter((p) => !availablePaths.includes(p));
  assert(missingPaths.length === 0, `OpenAPI is missing required paths: ${missingPaths.join(', ')}`);

  assert(postman.info && postman.info.name, 'Postman collection info.name is required');
  assert(Array.isArray(postman.variable), 'Postman collection variable array is required');

  const variableKeys = new Set(postman.variable.map((v) => v.key));
  const missingVariables = requiredPostmanVariables.filter((k) => !variableKeys.has(k));
  assert(missingVariables.length === 0, `Postman collection is missing variables: ${missingVariables.join(', ')}`);

  console.log('Docs checks passed');
};

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
