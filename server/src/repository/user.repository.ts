import User, { IUser } from '../models/User';

class UserRepository {
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new User(userData);
        return await user.save();
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email }).select('+password');
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findById(id);
    }

    async findByUsername(username: string): Promise<IUser | null> {
        return await User.findOne({ username });
    }

    async searchUsers(query: string, excludeId: string): Promise<IUser[]> {
        return await User.find({
            $and: [
                { _id: { $ne: excludeId } },
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { displayName: { $regex: query, $options: 'i' } },
                    ],
                },
            ],
        }).limit(20);
    }

    async updatePresence(userId: string, isOnline: boolean): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            isOnline,
            lastSeen: new Date(),
        });
    }
}

export default new UserRepository();
