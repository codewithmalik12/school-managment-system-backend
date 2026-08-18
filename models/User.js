import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'admin', 'student'], required: true },
    phoneNumber: { type: String }, 
    subject: { type: String }, 
    grade: { type: String }, 
    dp: { type: String, default: "" },
    
    // Student specific fields
    rollNo: { type: String, unique: true, sparse: true },
    feeStatus: { type: String, enum: ['Paid', 'Unpaid', 'Pending'], default: 'Unpaid' },
    feeAmount: { type: Number, default: 0 },
    feeDueDate: { type: Date },
    paymentHistory: [{
        amount: { type: Number, required: true },
        paymentMethod: { type: String, required: true },
        transactionId: { type: String, required: true },
        accountDetails: { type: String },
        paidAt: { type: Date, default: Date.now }
    }],
    latestPaymentMethod: { type: String },
    latestTransactionId: { type: String },
    latestPaidAt: { type: Date },
    results: [{
        subject: { type: String, required: true },
        marks: { type: Number, required: true },
        totalMarks: { type: Number, required: true },
        examName: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],

    // Teacher specific fields
    classes: [{
        className: { type: String, required: true }, // e.g. "Grade 10"
        subject: { type: String, required: true }    // e.g. "Physics"
    }]
}, { timestamps: true });

export default mongoose.model('Login', userSchema, 'logins');

