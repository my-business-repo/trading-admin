import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';
import { prisma } from './prisma';

export function getTokenFromHeader(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

export async function validateToken(token: string) {
  try {
    // Check if token is invalidated
    const isInvalid = await isTokenInvalid(token);
    if (isInvalid) {
      return null;
    }

    const decoded = verifyToken(token);
    return {
      id: decoded.customerId,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateRequest(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return null;
  }
  return validateToken(token);
}

export async function isTokenInvalid(token: string): Promise<boolean> {
  const invalidToken = await prisma.invalidtoken.findUnique({
    where: { token },
  });

  if (!invalidToken) {
    return false;
  }

  // If token has expired, clean it up
  if (invalidToken.expiresAt < new Date()) {
    await prisma.invalidtoken.delete({
      where: { id: invalidToken.id },
    });
    return false;
  }

  return true;
}

export async function invalidateToken(token: string, expiresAt: Date): Promise<void> {
  await prisma.invalidtoken.create({
    data: {
      token,
      expiresAt,
    },
  });
}