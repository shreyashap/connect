import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    displayName: string;
    about: string;
    avatar: string;
    isOnline: boolean;
    lastSeen: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true, trim: true, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        password: { type: String, required: true, select: false },
        displayName: { type: String, required: true },
        about: { type: String, default: 'Hey there! I am using Connect.' },
        avatar: { type: String, default: '' },
        isOnline: { type: Boolean, default: false },
        lastSeen: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password!, salt);
        return next();
    } catch (err: any) {
        return next(err);
    }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
