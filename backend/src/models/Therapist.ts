import mongoose, { Document, Schema } from 'mongoose';

export interface ITherapist extends Document {
    name: string;
    email?: string;
    bio: string;
    credentials: string;
    quote?: string;
    gender?: string;
    specialties: string[];
    experienceYears: number;
    price: number;
    profileImage?: string;
    ratingAverage: number;
    ratingCount: number;
    languages: string[];
    sessionTypes: string[];
    responseRate: number;
    totalSessions: number;
    faq: { question: string; answer: string }[];
    // Legacy weekly template kept for backward compatibility
    availability: { day: string; slots: string[] }[];
    // Canonical weekly template (0 = Sunday, 6 = Saturday)
    weeklyAvailability: { dayOfWeek: number; slots: string[] }[];
    createdAt: Date;
    updatedAt: Date;
}

const therapistSchema = new Schema<ITherapist>(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
        bio: { type: String, required: true },
        credentials: { type: String, required: true },
        quote: { type: String, default: '' },
        gender: { type: String, default: '' },
        specialties: [String],
        experienceYears: { type: Number, required: true },
        price: { type: Number, required: true },
        profileImage: { type: String },
        ratingAverage: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
        languages: [{ type: String }],
        sessionTypes: [{ type: String }],
        responseRate: { type: Number, default: 100 },
        totalSessions: { type: Number, default: 0 },
        faq: [{ question: String, answer: String }],
        availability: [{ day: String, slots: [String] }],
        weeklyAvailability: [{ dayOfWeek: Number, slots: [String] }],
    },
    { timestamps: true }
);

therapistSchema.index({ specialties: 1, ratingAverage: -1 });
therapistSchema.index({ name: 'text', specialties: 'text', bio: 'text' });
// Compound indexes for multi-filter search optimization
therapistSchema.index({ gender: 1, price: 1, ratingAverage: -1 });
therapistSchema.index({ languages: 1, sessionTypes: 1 });
therapistSchema.index({ price: 1, ratingAverage: -1 });

export const Therapist = mongoose.model<ITherapist>('Therapist', therapistSchema);
