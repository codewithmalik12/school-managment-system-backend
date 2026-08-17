import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Notice from '../models/Notice.js';

const router = express.Router();

// GET all teachers
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('-password');
        res.json({ status: 'success', teachers });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch teachers' });
    }
});

// PUT (update) a teacher (including classes)
router.put('/teachers/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, subject, phoneNumber, classes } = req.body;
        const updatedTeacher = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, subject, phoneNumber, classes },
            { new: true }
        ).select('-password');
        
        if (!updatedTeacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        res.json({ status: 'success', teacher: updatedTeacher });
    } catch (error) {
        console.error("Error updating teacher:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update teacher' });
    }
});

// DELETE a teacher
router.delete('/teachers/:id', async (req, res) => {
    try {
        const deletedTeacher = await User.findByIdAndDelete(req.params.id);
        if (!deletedTeacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        res.json({ status: 'success', message: 'Teacher removed successfully' });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete teacher' });
    }
});

// GET all students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json({ status: 'success', students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch students' });
    }
});

// POST a new student (Admin can add directly)
router.post('/students', async (req, res) => {
    try {
        const { firstName, lastName, email, password, grade, phoneNumber, rollNo, feeStatus, feeAmount, feeDueDate } = req.body;

        // Check if student already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: "error", message: "User already exists with this email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || "123456", salt); // default password if not provided

        // Generate roll number if not provided
        let finalRollNo = rollNo;
        if (!finalRollNo) {
            const studentCount = await User.countDocuments({ role: 'student' });
            finalRollNo = `SMS-${1000 + studentCount + 1}`;
        }

        // Check if rollNo is unique
        const rollExists = await User.findOne({ rollNo: finalRollNo });
        if (rollExists) {
            return res.status(400).json({ status: "error", message: "Roll number already assigned to another student" });
        }

        const newStudent = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'student',
            grade,
            phoneNumber,
            rollNo: finalRollNo,
            feeStatus: feeStatus || 'Unpaid',
            feeAmount: feeAmount || 0,
            feeDueDate
        });

        await newStudent.save();
        res.status(201).json({ status: 'success', student: newStudent });
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ status: 'error', message: 'Failed to create student' });
    }
});

// PUT (update) a student
router.put('/students/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, grade, phoneNumber, rollNo, feeStatus, feeAmount, feeDueDate, results } = req.body;
        const updatedStudent = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, grade, phoneNumber, rollNo, feeStatus, feeAmount, feeDueDate, results },
            { new: true }
        ).select('-password');
        
        if (!updatedStudent) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        res.json({ status: 'success', student: updatedStudent });
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update student' });
    }
});

// DELETE a student
router.delete('/students/:id', async (req, res) => {
    try {
        const deletedStudent = await User.findByIdAndDelete(req.params.id);
        if (!deletedStudent) {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }
        res.json({ status: 'success', message: 'Student removed successfully' });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete student' });
    }
});

// -- Notices Endpoints --

// GET all notices
router.get('/notices', async (req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        res.json({ status: 'success', notices });
    } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notices' });
    }
});

// POST a new notice
router.post('/notices', async (req, res) => {
    try {
        const { title, content, target } = req.body;
        const newNotice = new Notice({ title, content, target });
        await newNotice.save();
        res.status(201).json({ status: 'success', notice: newNotice });
    } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).json({ status: 'error', message: 'Failed to create notice' });
    }
});

// DELETE a notice
router.delete('/notices/:id', async (req, res) => {
    try {
        const deletedNotice = await Notice.findByIdAndDelete(req.params.id);
        if (!deletedNotice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found' });
        }
        res.json({ status: 'success', message: 'Notice deleted successfully' });
    } catch (error) {
        console.error("Error deleting notice:", error);
        res.status(500).json({ status: 'error', message: 'Failed to delete notice' });
    }
});

export default router;

