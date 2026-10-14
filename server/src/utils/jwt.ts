import jwt from 'jsonwebtoken';
import env from '@/utils/env.js';
import type { JwtPayload } from '@/validators/crypto.validator.js';
import { InvalidUserError } from '@/types/error.types.js';


const JWT_SECRET = env.JWT_SECRET;

// JWT Token
export function signJwt(payload: object): string {
  // return jwt.sign(payload, JWT_SECRET, { expiresIn: tokenExpiryInSeconds });
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyJwt(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new InvalidUserError()
  }
}

export const tokenExpiryInSeconds = 60 * 60; // 1h
export const cookieOptions = {
  httpOnly: true,       // Prevents JS access (stops XSS stealing)
  secure: true,         // Only sent over HTTPS (stops MITM attacks)
  sameSite: 'strict',   // Prevents cross-site requests (blocks CSRF)
  maxAge: 1000 * tokenExpiryInSeconds, // Token expiry (1 hour)
} as const;