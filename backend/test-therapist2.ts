import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    credentials: { type: String, required: true },
});
const Model = mongoose.model('TestCred', schema);

async function run() {
    try {
        const doc = new Model({ credentials: '' });
        await doc.validate();
        console.log('Passed');
    } catch (e: any) {
        console.error('Failed', e.message);
    }
    process.exit(0);
}
run();
