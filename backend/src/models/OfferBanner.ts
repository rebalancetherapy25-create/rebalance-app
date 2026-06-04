import mongoose, { Document, Schema } from 'mongoose';

export interface IOfferBanner extends Document {
    type: 'text' | 'image';
    text: string;
    code: string;
    link: string;
    mobileImageUrl: string;
    desktopImageUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const offerBannerSchema = new Schema(
    {
        type: { type: String, enum: ['text', 'image'], default: 'text' },
        text: { type: String, default: '' },
        code: { type: String, default: '' },
        link: { type: String, default: '' },
        mobileImageUrl: { type: String, default: '' },
        desktopImageUrl: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const OfferBanner = mongoose.model<IOfferBanner>('OfferBanner', offerBannerSchema);
