import mongoose from 'mongoose';
import { TherapistAccount } from './src/models';

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/rebalance');
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    if (db) {
        const accounts = await db.collection('therapistaccounts').find({}).toArray();
        console.log('accounts:', accounts.length);
        if (accounts.length > 0) {
            console.log('accounts emails:', accounts.map(a => a.email));
        }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    setTimeout(() => process.exit(0), 100);
  }
}

run();
