import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rebalance');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Super Admin already exists!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
        });

        console.log(`Super Admin created successfully!`);
        console.log(`Email: ${adminUser.email}`);
        console.log(`Password: ${adminPassword}`); // Only for initial setup log

        process.exit(0);
    } catch (error) {
        console.error(`Error seeding admin:`, error);
        process.exit(1);
    }
};

seedAdmin();
