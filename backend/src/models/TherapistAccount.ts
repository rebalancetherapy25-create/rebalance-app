import mongoose, { Document, Schema, Types } from 'mongoose';

export type TherapistAccountStatus = 'active' | 'suspended';

export interface ITherapistAccount extends Document {
    therapistId: Types.ObjectId;
    email: string;
    passwordHash: string;
    refreshToken?: string | undefined;
    status: TherapistAccountStatus;
    createdAt: Date;
    updatedAt: Date;
}

const therapistAccountSchema = new Schema<ITherapistAccount>(
    {
        therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true },
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        refreshToken: { type: String },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    },
    { timestamps: true }
);

// Enforce a single portal account per therapist.
therapistAccountSchema.index({ therapistId: 1 }, { unique: true });

export const TherapistAccount = mongoose.model<ITherapistAccount>('TherapistAccount', therapistAccountSchema);
