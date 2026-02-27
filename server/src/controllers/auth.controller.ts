import { Request, Response } from 'express';
import authService from '../services/auth.service';

class AuthController {
    async register(req: Request, res: Response) {
        try {
            const { username, email, password, displayName } = req.body;

            if (!username || !email || !password || !displayName) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            const { user, token } = await authService.register({
                username,
                email,
                password,
                displayName,
            });

            return res.status(201).json({
                message: 'User registered successfully',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    avatar: user.avatar,
                },
                token,
            });
        } catch (error: any) {
            return res.status(error.message.includes('exists') || error.message.includes('taken') ? 400 : 500).json({ message: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            const { user, token } = await authService.login(email, password);

            return res.status(200).json({
                message: 'Login successful',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    displayName: user.displayName,
                    avatar: user.avatar,
                },
                token,
            });
        } catch (error: any) {
            return res.status(401).json({ message: error.message });
        }
    }
}

export default new AuthController();
