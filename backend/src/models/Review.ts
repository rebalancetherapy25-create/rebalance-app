import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
    userId: Types.ObjectId;
    therapistId: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
