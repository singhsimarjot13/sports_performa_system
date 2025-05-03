// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const studentController = require('../controllers/studentController');
const InterYearStudent = require('../models/interyear_student');

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

// Get students with pending positions
router.get('/students/pending-positions', async (req, res) => {
  try {
    // Get regular students with pending positions
    const regularStudents = await Student.find({
      'events.position': 'Pending'
    }).select('name universityRegNo branchYear crn email events _id');

    // Get interyear students with pending positions
    const interyearStudents = await InterYearStudent.find({
      'events.position': 'Pending'
    }).select('name urn branch crn email events _id');

    // Combine both results
    const allStudents = [
      ...regularStudents,
      ...interyearStudents
    ];

    res.json(allStudents);
  } catch (error) {
    console.error('Error fetching students with pending positions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update position for a student
router.put('/:studentId/update-position', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activity, position } = req.body;

    if (!activity || !position) {
      return res.status(400).json({ message: 'Activity and position are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find and update the specific event
    const eventIndex = student.events.findIndex(e => e.activity === activity);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    student.events[eventIndex].position = position;
    await student.save();

    res.json({ message: 'Position updated successfully' });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
