import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const therapistSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, sparse: true },
        bio: { type: String, required: true },
        credentials: { type: String, required: true },
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
const TherapistTest = mongoose.model('TherapistTest', therapistSchema);

async function run() {
    console.log('Connecting...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rebalance');
    console.log('Connected');
    try {
        const payload = {
  name: 'Test',
  specialties: [],
  price: 100,
  about: 'test about',
  languages: [],
  sessionTypes: [ 'Video' ],
  responseRate: 100,
  totalSessions: 0,
  experienceYears: 5,
  credentials: 'PhD',
  faq: [ { question: '', answer: '' } ],
  availability: [
    { day: 'Monday', slots: [] },
  ],
  bio: 'test about',
  weeklyAvailability: [
    { dayOfWeek: 1, slots: [] },
  ]
};

        const t = await TherapistTest.create(payload);
        console.log('Success:', t._id);
    } catch (e) {
        console.error('Validation error:', e);
    }
    process.exit(0);
}
run();
