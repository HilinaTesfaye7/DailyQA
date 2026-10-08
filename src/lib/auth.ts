import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET is not set; falling back to an insecure default secret.');
}

export const AUTH_COOKIE = 'auth_token';

export type SessionPayload = { id: string; username: string };

export function signToken(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') return null;
    return { id: String(decoded.id), username: String(decoded.username) };
  } catch {
    return null;
  }
}

/** Reads the session from the auth cookie (Server Components, Route Handlers, Server Actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/** Throws when there is no valid session. Use inside Server Actions. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
