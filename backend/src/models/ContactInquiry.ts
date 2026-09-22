import mongoose, { Document, Schema } from 'mongoose';

export interface IContactInquiry extends Document {
    name: string;
    email: string;
    message: string;
    status: 'pending' | 'in_progress' | 'resolved';
    ipAddress?: string;
    createdAt: Date;
    updatedAt: Date;
}

const contactInquirySchema = new Schema<IContactInquiry>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        message: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'resolved'],
            default: 'pending',
        },
        ipAddress: { type: String },
    },
    { timestamps: true }
);

contactInquirySchema.index({ createdAt: -1 });
contactInquirySchema.index({ email: 1 });
contactInquirySchema.index({ status: 1 });

export const ContactInquiry = mongoose.model<IContactInquiry>('ContactInquiry', contactInquirySchema);
