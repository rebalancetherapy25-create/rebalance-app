import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailOutbox extends Document {
    to: string;
    subject: string;
    html: string;
    status: 'pending' | 'failed' | 'sent';
    retries: number;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

const emailOutboxSchema = new Schema<IEmailOutbox>(
    {
        to: { type: String, required: true },
        subject: { type: String, required: true },
        html: { type: String, required: true },
        status: { type: String, enum: ['pending', 'failed', 'sent'], default: 'pending' },
        retries: { type: Number, default: 0 },
        lastError: { type: String },
    },
    { timestamps: true }
);

export const EmailOutbox = mongoose.model<IEmailOutbox>('EmailOutbox', emailOutboxSchema);
