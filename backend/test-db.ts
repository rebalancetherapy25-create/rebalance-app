import mongoose from 'mongoose';
import { Therapist } from './src/models/Therapist';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rebalance');
        const therapists = await Therapist.find({});
        console.log(`Found ${therapists.length} therapists.`);
        const nullEmails = therapists.filter(t => !t.email);
        console.log(`Therapists with no email:`, nullEmails.map(t => ({ id: t._id, name: t.name, email: t.email })));
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
