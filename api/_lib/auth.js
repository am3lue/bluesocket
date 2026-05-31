import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bluesocket-default-secret-change-me';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getAuthHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function validateSession(req) {
  const token = getAuthHeader(req);
  if (!token) return null;
  return verifyToken(token);
}
