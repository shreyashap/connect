import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import userRepository from '../repository/user.repository';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

class AuthMiddleware {
    async protect(req: Request, res: Response, next: NextFunction) {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            try {
                token = req.headers.authorization.split(' ')[1];
                const decoded = authService.verifyToken(token);
                if (!decoded) {
                    return res.status(401).json({ message: 'Not authorized, token failed' });
                }

                const user = await userRepository.findById(decoded.id);
                if (!user) {
                    return res.status(401).json({ message: 'Not authorized, user not found' });
                }

                req.user = user;
                next();
            } catch (error) {
                console.error(error);
                res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }

        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    }
}

export default new AuthMiddleware();
