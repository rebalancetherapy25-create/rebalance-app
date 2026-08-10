import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rebalance');
        const db = mongoose.connection.db;
        if (!db) throw new Error("No db");
        
        const therapists = await db.collection('therapists').find({}).toArray();
        console.log(`Found ${therapists.length} therapists.`);
        for (const t of therapists) {
            console.log(`- ID: ${t._id}, Email: ${t.email === undefined ? 'undefined' : `"${t.email}"`}`);
        }

        const indexes = await db.collection('therapists').indexes();
        console.log('\nIndexes:');
        console.dir(indexes, { depth: null });
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
