import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET assigned classes for a teacher
router.get('/classes/:teacherId', async (req, res) => {
    try {
        const teacher = await User.findById(req.params.teacherId);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        res.json({ status: 'success', classes: teacher.classes || [] });
    } catch (error) {
        console.error("Error fetching teacher classes:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch teacher classes' });
    }
});

// GET all students in a grade (class)
router.get('/students/:grade', async (req, res) => {
    try {
        const students = await User.find({ role: 'student', grade: req.params.grade }).select('-password');
        res.json({ status: 'success', students });
    } catch (error) {
        console.error("Error fetching students by grade:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch students' });
    }
});

// POST or update marks for a student
router.post('/marks', async (req, res) => {
    try {
        const { studentId, subject, marks, totalMarks, examName } = req.body;

        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ status: 'error', message: 'Student not found' });
        }

        // Initialize results array if undefined
        if (!student.results) {
            student.results = [];
        }

        // Check if marks for this examName + subject already exist
        const resultIndex = student.results.findIndex(
            r => r.examName.toLowerCase() === examName.toLowerCase() && r.subject.toLowerCase() === subject.toLowerCase()
        );

        if (resultIndex > -1) {
            // Update existing marks
            student.results[resultIndex].marks = Number(marks);
            student.results[resultIndex].totalMarks = Number(totalMarks);
            student.results[resultIndex].date = new Date();
        } else {
            // Add new marks
            student.results.push({
                subject,
                marks: Number(marks),
                totalMarks: Number(totalMarks),
                examName,
                date: new Date()
            });
        }

        await student.save();
        res.json({ status: 'success', message: 'Marks saved successfully', results: student.results });
    } catch (error) {
        console.error("Error saving marks:", error);
        res.status(500).json({ status: 'error', message: 'Failed to save marks' });
    }
});

export default router;
