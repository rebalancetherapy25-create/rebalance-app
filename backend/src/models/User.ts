import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    isVerified: boolean;
    otpCode?: string;
    otpExpiry?: Date;
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        password: { type: String }, // Optional for cases where OAuth might be added later
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isVerified: { type: Boolean, default: false },
        otpCode: { type: String },
        otpExpiry: { type: Date },
        refreshToken: { type: String },
    },
    { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

export const User = mongoose.model<IUser>('User', userSchema);
