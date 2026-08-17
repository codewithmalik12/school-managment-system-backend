import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    target: { type: String, enum: ['all', 'student', 'teacher'], default: 'all' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);
