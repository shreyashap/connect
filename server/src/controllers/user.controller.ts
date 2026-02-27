import { Request, Response } from 'express';
import userService from '../services/user.service';

class UserController {
    async getProfile(req: Request, res: Response) {
        try {
            const user = await userService.getProfile(req.user._id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const user = await userService.updateProfile(req.user._id, req.body);
            return res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    _id: user?._id,
                    username: user?.username,
                    displayName: user?.displayName,
                    about: user?.about,
                    avatar: user?.avatar,
                },
            });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async searchUsers(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }

            const users = await userService.searchUsers(query, req.user._id);
            return res.status(200).json(users);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new UserController();
