import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISlot {
    time: string; // e.g., "09:00", "09:30"
    isBooked: boolean;
    reservedUntil?: Date | undefined; // For atomic slot locking
    reservedBookingId?: Types.ObjectId | undefined;
}

export interface IAvailability extends Document {
    therapistId: Types.ObjectId;
    date: string; // YYYY-MM-DD
    slots: ISlot[];
}

const slotSchema = new Schema<ISlot>({
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    reservedUntil: { type: Date },
    reservedBookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
});

const availabilitySchema = new Schema<IAvailability>(
    {
        therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true, index: true },
        date: { type: String, required: true, index: true },
        slots: [slotSchema],
    },
    { timestamps: true }
);

// Compound index to quickly find a therapist's availability on a specific date
availabilitySchema.index({ therapistId: 1, date: 1 }, { unique: true });

export const Availability = mongoose.model<IAvailability>('Availability', availabilitySchema);
