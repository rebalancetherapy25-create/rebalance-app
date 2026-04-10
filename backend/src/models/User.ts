import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String }, // Optional for cases where OAuth might be added later
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        refreshToken: { type: String },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
