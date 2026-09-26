import { getSession, sendMethodNotAllowed, userFromSession } from './_auth.js';

export default function handler(request, response) {
  if (request.method !== 'GET') return sendMethodNotAllowed(response);

  const user = userFromSession(getSession(request));
  return user ? response.status(200).json({ user }) : response.status(401).json({ error: 'Unauthenticated' });
}