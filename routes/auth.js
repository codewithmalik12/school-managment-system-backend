import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Register a new user (Teacher, Admin, or Student)
router.post('/register', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                status: "error",
                message: "Database connection failed. Please check your MONGODB_URI in backend .env file or ensure MongoDB is running."
            });
        }

        const { firstName, lastName, email, password, role, phoneNumber, subject, grade, dp } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: "error", message: "Email and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: "error", message: "User already exists with this email" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Auto-generate Roll Number for Student
        let rollNo = undefined;
        if (role === 'student') {
            const studentCount = await User.countDocuments({ role: 'student' });
            rollNo = `SMS-${1000 + studentCount + 1}`;
        }

        // Create new user (using hashed password)
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword, 
            role,
            phoneNumber,
            subject,
            grade,
            dp,
            rollNo
        });

        await newUser.save();
        res.status(201).json({ status: "success", message: "User registered successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ status: "error", message: error.message || "Server error during registration" });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ status: "error", message: "Invalid credentials" });
        }

        // Check password using bcrypt compare
        const isMatch = await bcrypt.compare(password, user.password);
        
        // Fallback for old plain-text test accounts (optional but helpful for testing)
        if (!isMatch && password !== user.password) {
            return res.status(400).json({ status: "error", message: "Invalid credentials" });
        }

        // Check if role matches what they selected on frontend
        if (user.role !== role) {
             return res.status(403).json({ status: "error", message: `Account found, but you are not registered as a ${role}` });
        }

        // Send success payload with all user details
        res.json({ 
            status: "success", 
            message: "Login successful", 
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                dp: user.dp,
                phoneNumber: user.phoneNumber,
                subject: user.subject,
                grade: user.grade,
                rollNo: user.rollNo,
                feeStatus: user.feeStatus,
                feeAmount: user.feeAmount,
                feeDueDate: user.feeDueDate,
                classes: user.classes,
                results: user.results
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ status: "error", message: "Server error during login" });
    }
});

// Update user DP
router.put('/update-dp/:id', async (req, res) => {
    try {
        const { dp } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { dp },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ 
            status: "success", 
            message: "DP updated successfully", 
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: updatedUser.role,
                dp: updatedUser.dp,
                phoneNumber: updatedUser.phoneNumber,
                subject: updatedUser.subject,
                grade: updatedUser.grade,
                rollNo: updatedUser.rollNo,
                feeStatus: updatedUser.feeStatus,
                feeAmount: updatedUser.feeAmount,
                feeDueDate: updatedUser.feeDueDate,
                classes: updatedUser.classes,
                results: updatedUser.results
            }
        });
    } catch (error) {
        console.error("Update DP error:", error);
        res.status(500).json({ status: "error", message: "Server error during DP update" });
    }
});

// Update user profile details
router.put('/update-profile/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, subject, grade, dp, password } = req.body;
        
        // Find user
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        // Check if email is already taken by someone else
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ status: "error", message: "Email is already taken by another account" });
            }
            user.email = email;
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (subject !== undefined) user.subject = subject;
        if (grade !== undefined) user.grade = grade;
        if (dp !== undefined) user.dp = dp;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        
        res.json({
            status: "success",
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                dp: user.dp,
                phoneNumber: user.phoneNumber,
                subject: user.subject,
                grade: user.grade,
                rollNo: user.rollNo,
                feeStatus: user.feeStatus,
                feeAmount: user.feeAmount,
                feeDueDate: user.feeDueDate,
                paymentHistory: user.paymentHistory,
                latestPaymentMethod: user.latestPaymentMethod,
                latestTransactionId: user.latestTransactionId,
                latestPaidAt: user.latestPaidAt,
                classes: user.classes,
                results: user.results
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ status: "error", message: "Server error during profile update" });
    }
});

// Pay student fees (Bank Card, EasyPaisa, JazzCash)
router.post('/pay-fee', async (req, res) => {
    try {
        const { studentId, paymentMethod, accountDetails, amount } = req.body;

        const user = await User.findById(studentId);
        if (!user || user.role !== 'student') {
            return res.status(404).json({ status: "error", message: "Student account not found" });
        }

        const payAmount = Number(amount) || user.feeAmount || 0;
        const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const now = new Date();

        if (!user.paymentHistory) {
            user.paymentHistory = [];
        }

        const paymentRecord = {
            amount: payAmount,
            paymentMethod: paymentMethod || 'Bank Card',
            transactionId: transactionId,
            accountDetails: accountDetails || '',
            paidAt: now
        };

        user.paymentHistory.push(paymentRecord);
        user.feeStatus = 'Paid';
        user.latestPaymentMethod = paymentMethod || 'Bank Card';
        user.latestTransactionId = transactionId;
        user.latestPaidAt = now;

        await user.save();

        res.json({
            status: "success",
            message: "Fee payment processed successfully",
            transactionId: transactionId,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                dp: user.dp,
                phoneNumber: user.phoneNumber,
                subject: user.subject,
                grade: user.grade,
                rollNo: user.rollNo,
                feeStatus: user.feeStatus,
                feeAmount: user.feeAmount,
                feeDueDate: user.feeDueDate,
                paymentHistory: user.paymentHistory,
                latestPaymentMethod: user.latestPaymentMethod,
                latestTransactionId: user.latestTransactionId,
                latestPaidAt: user.latestPaidAt,
                classes: user.classes,
                results: user.results
            }
        });
    } catch (error) {
        console.error("Fee payment error:", error);
        res.status(500).json({ status: "error", message: error.message || "Server error processing fee payment" });
    }
});

export default router;

