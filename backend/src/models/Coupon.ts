import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountPercentage: number;
    isActive: boolean;
    expiresAt?: Date;
    maxUsage?: number;
    currentUsage: number;
    usedBy: string[];
    createdAt: Date;
    updatedAt: Date;
}

const couponSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountPercentage: { type: Number, required: true, min: 1, max: 100 },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Date },
        maxUsage: { type: Number },
        currentUsage: { type: Number, default: 0 },
        usedBy: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
