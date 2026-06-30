import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'uniqualis-super-secret-key-change-in-production';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

import { NextRequest } from "next/server";

export async function getPayload(req: Request | NextRequest): Promise<any> {
  let token = null;
  
  if (req instanceof NextRequest) {
    token = req.cookies.get('uniqualis_session')?.value;
  }
  
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Also check standard request cookies if not NextRequest
  if (!token && !(req instanceof NextRequest)) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('='))
      );
      token = cookies['uniqualis_session'];
    }
  }

  if (!token) return null;
  return verifyToken(token);
}
