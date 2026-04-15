import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBooking extends Document {
    userId?: Types.ObjectId;
    guestContact?: {
        name: string;
        email: string;
    };
    therapistId: Types.ObjectId;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    sessionType: 'video' | 'chat' | 'audio' | 'phone';
    amount: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    meetingLink?: string | undefined;
    reminderSent?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        guestContact: {
            name: { type: String },
            email: { type: String },
        },
        therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        sessionType: { type: String, enum: ['video', 'phone', 'chat', 'audio'], required: true },
        amount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        meetingLink: { type: String },
        reminderSent: { type: Boolean, default: false },
    },
    { timestamps: true }
);

bookingSchema.index({ therapistId: 1, date: 1, time: 1, status: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ date: 1, status: 1, createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
