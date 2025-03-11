import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, always use environment variable
const TOKEN_EXPIRY = '30d'; // Token will now expire in 1 month

export interface JWTPayload {
  customerId: string;
  email: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const extractTokenFromHeader = (authorization?: string): string => {
  if (!authorization) {
    throw new Error('No authorization header');
  }

  const [bearer, token] = authorization.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    throw new Error('Invalid authorization header format');
  }

  return token;
};
