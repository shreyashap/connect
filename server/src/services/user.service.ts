import userRepository from '../repository/user.repository';
import { IUser } from '../models/User';

class UserService {
    async getProfile(userId: string): Promise<IUser | null> {
        return await userRepository.findById(userId);
    }

    async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        const allowedUpdates = ['displayName', 'about', 'avatar'];
        const filteredUpdate: any = {};

        for (const key of allowedUpdates) {
            if ((updateData as any)[key] !== undefined) {
                filteredUpdate[key] = (updateData as any)[key];
            }
        }

        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        Object.assign(user, filteredUpdate);
        return await user.save();
    }

    async searchUsers(query: string, excludeId: string): Promise<IUser[]> {
        return await userRepository.searchUsers(query, excludeId);
    }

    async updatePresence(userId: string, isOnline: boolean): Promise<void> {
        await userRepository.updatePresence(userId, isOnline);
    }
}

export default new UserService();
