import { sendMethodNotAllowed, sessionCookie } from './_auth.js';

export default function handler(request, response) {
  if (request.method !== 'POST') return sendMethodNotAllowed(response);
  response.setHeader('Set-Cookie', sessionCookie('', 0));
  return response.status(204).end();
}