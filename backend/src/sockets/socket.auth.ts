import { Socket } from 'socket.io';
import { verifyAccessToken, isTokenBlacklisted } from '../modules/auth/token.service';

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyAccessToken(token);
    
    const blacklisted = await isTokenBlacklisted(decoded.jti);
    if (blacklisted) {
      return next(new Error('Authentication error: Token revoked'));
    }

    socket.data.user = {
      userId: decoded.userId,
      role: decoded.role,
      permissions: decoded.permissions
    };

    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};
