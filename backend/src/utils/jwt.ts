import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  email: string;
  username: string;
  role: string;
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
