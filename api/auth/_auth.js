import crypto from 'node:crypto';

export const COOKIE_NAME = 'sms_session';
const SESSION_MAX_AGE = 60 * 60 * 8;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function verifyPassword(password) {
  const encodedHash = requiredEnv('AUTH_PASSWORD_HASH');
  const [algorithm, cost, blockSize, parallelization, salt, expected] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !expected) return false;

  const derived = crypto.scryptSync(password, salt, Buffer.from(expected, 'base64url').length, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: 128 * Number(cost) * Number(blockSize) + 1024 * 1024
  });
  return crypto.timingSafeEqual(derived, Buffer.from(expected, 'base64url'));
}

function sign(value) {
  return crypto.createHmac('sha256', requiredEnv('SESSION_SECRET')).update(value).digest('base64url');
}

export function createSession(username) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function getSession(request) {
  const cookieHeader = request.headers.cookie || '';
  const token = cookieHeader.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expectedSignature = Buffer.from(sign(payload));
  const receivedSignature = Buffer.from(signature);
  if (receivedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(receivedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function userFromSession(session) {
  return session ? { username: session.username, fullName: session.username, role: 'Administrator' } : null;
}

export function sessionCookie(token, maxAge = SESSION_MAX_AGE) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function sendMethodNotAllowed(response) {
  response.status(405).json({ error: 'Method not allowed' });
}