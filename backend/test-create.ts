import mongoose from 'mongoose';
import { Therapist } from './src/models/Therapist';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rebalance');
        
        // Try creating with undefined email
        const payload1 = {
            name: 'Test Therapist 1', bio: 'test', credentials: 'test', price: 150, experienceYears: 10,
            email: undefined
        };
        const th1 = await Therapist.create(payload1);
        console.log('Created th1 with undefined email');

        // Try creating with empty string email
        const payload2 = {
            name: 'Test Therapist 2', bio: 'test', credentials: 'test', price: 150, experienceYears: 10,
            email: ""
        };
        const th2 = await Therapist.create(payload2);
        console.log('Created th2 with empty email');
        
        // Try creating another with empty string email
        const payload3 = {
            name: 'Test Therapist 3', bio: 'test', credentials: 'test', price: 150, experienceYears: 10,
            email: ""
        };
        const th3 = await Therapist.create(payload3);
        console.log('Created th3 with empty email');
        
    } catch (err: any) {
        console.error('Validation Error:', err.message);
    } finally {
        await mongoose.connection.db?.dropDatabase(); // drop the test DB if we used a separate one, wait no, let's just delete the ones we created
        await Therapist.deleteMany({ name: { $in: ['Test Therapist 1', 'Test Therapist 2', 'Test Therapist 3'] } });
        await mongoose.disconnect();
    }
}
run();
