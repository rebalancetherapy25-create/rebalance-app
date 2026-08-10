import mongoose from 'mongoose';
import { createTherapist } from './src/controllers/adminController';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rebalance');

        const req = {
            body: {
                name: 'Test Controller Therapist',
                credentials: 'PhD',
                about: 'Some test bio that will be mapped to bio',
                price: 200,
                experienceYears: 10,
                totalSessions: 0,
                responseRate: 100,
                specialties: ['Anxiety'],
                languages: ['English'],
                sessionTypes: ['Video'],
                quote: '',
                gender: '',
                faq: [],
                weeklyAvailability: [],
                portalAccess: { create: false }
            }
        } as Request;

        let sentStatus = 0;
        let sentData: any = null;
        const res = {
            locals: {},
            status: function(s: number) { sentStatus = s; return this; },
            json: function(d: any) { sentData = d; return this; }
        } as unknown as Response;

        await createTherapist(req, res);
        
        console.log(`Response Status: ${sentStatus}`);
        console.log(`Response Data:`, JSON.stringify(sentData, null, 2));

    } catch (err: any) {
        console.error('Uncaught Error:', err);
    } finally {
        await mongoose.connection.db?.dropDatabase();
        await mongoose.disconnect();
    }
}
run();
