require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function resetPassword() {
  const email = 'khushiar242@gmail.com';
  const newPassword = process.argv[2] || 'Password123!';
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rebalance';

  console.log(`Connecting to: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    if (!db) {
      console.error('Failed to get db connection.');
      return;
    }

    const account = await db.collection('therapistaccounts').findOne({ email });
    
    if (!account) {
      console.log(`Therapist account not found for email: ${email}`);
      console.log('Note: If you are trying to reset a production account, please ensure MONGO_URI is set to your production database URL.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.collection('therapistaccounts').updateOne(
      { email },
      { $set: { passwordHash }, $unset: { refreshToken: "" } }
    );

    console.log(`Password reset successfully for ${email}.`);
    console.log(`New password: ${newPassword}`);
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();
