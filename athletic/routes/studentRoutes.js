// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const studentController = require('../controllers/studentController');

// GET /students - fetch all or by URN
router.get('/students', async (req, res) => {
  try {
    const { urn, name, branch, event, position } = req.query;

    let query = {};

    // URN: exact match
    if (urn) query.universityRegNo = urn;

    // Name, Branch, Event, Position: partial match (case-insensitive)
    if (name) query.name = { $regex: name, $options: 'i' };
    if (branch) query.branchYear = { $regex: branch, $options: 'i' };
    if (event) query["events.activity"] = { $regex: event, $options: 'i' };
    if (position) query["events.position"] = { $regex: position, $options: 'i' };

    const students = await Student.find(query);

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get all students
router.get('/', studentController.getAllStudents);

// Get student by URN
router.get('/by-urn', studentController.getStudentByUrn);

// Create student (manual entry)
router.post('/manual-entry', studentController.createStudent);

// Update student
router.put('/:id', studentController.updateStudent);

// Delete student
router.delete('/:id', studentController.deleteStudent);

// Add preview endpoint
router.post('/manual-entry/preview', async (req, res) => {
  try {
    const student = req.body;
    res.status(200).json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
