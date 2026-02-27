import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
}

export interface IMessage extends Document {
    chatId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    content: string;
    type: MessageType;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
    {
        chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
    },
    { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
