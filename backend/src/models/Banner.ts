import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
    title: string;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const bannerSchema = new Schema(
    {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
