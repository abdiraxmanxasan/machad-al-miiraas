import { createSession, sendMethodNotAllowed, sessionCookie, verifyPassword, userFromSession } from './_auth.js';

export default function handler(request, response) {
  if (request.method !== 'POST') return sendMethodNotAllowed(response);

  try {
    const { username, password } = request.body || {};
    const configuredUsername = process.env.AUTH_USERNAME;
    const validUsername = typeof username === 'string' && typeof configuredUsername === 'string' && username.trim().toLowerCase() === configuredUsername.trim().toLowerCase();
    const validPassword = typeof password === 'string' && verifyPassword(password);

    if (!validUsername || !validPassword) {
      return response.status(401).json({ error: 'Invalid credentials' });
    }

    const normalizedUsername = configuredUsername.trim();
    response.setHeader('Set-Cookie', sessionCookie(createSession(normalizedUsername)));
    return response.status(200).json({ user: userFromSession({ username: normalizedUsername }) });
  } catch {
    return response.status(500).json({ error: 'Authentication service unavailable' });
  }
}