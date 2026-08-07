import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
    userId?: Types.ObjectId;
    therapistId: Types.ObjectId;
    rating: number;
    comment: string;
    reviewerName?: string;
    status?: string;
    createdAt: Date;
    updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        reviewerName: { type: String, default: 'Verified Patient' },
        status: { type: String, default: 'Verified Patient' },
    },
    { timestamps: true }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
