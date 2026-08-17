import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    phoneNumber: { type: String },
    dp: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema, 'users');
