import jwt from 'jsonwebtoken';
import userRepository from '../repository/user.repository';
import { IUser } from '../models/User';

class AuthService {
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
    }

    async register(userData: Partial<IUser>): Promise<{ user: IUser; token: string }> {
        const existingUser = await userRepository.findByEmail(userData.email!);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const existingUsername = await userRepository.findByUsername(userData.username!);
        if (existingUsername) {
            throw new Error('Username is already taken');
        }

        const user = await userRepository.createUser(userData);
        const token = this.generateToken((user._id as any).toString());

        return { user, token };
    }

    async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        const token = this.generateToken((user._id as any).toString());
        return { user, token };
    }

    generateToken(userId: string): string {
        return jwt.sign({ id: userId }, this.jwtSecret, {
            expiresIn: '30d',
        });
    }

    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }
}

export default new AuthService();
