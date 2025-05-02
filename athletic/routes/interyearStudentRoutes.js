const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const InterYearStudent = require('../models/interyear_student');
const interyearStudentController = require('../controllers/interyearStudentController');

// Get non-matching interyear students
router.get('/interyear-students/non-matching', async (req, res) => {
  try {
    // Get all regular students' URNs
    const regularStudents = await Student.find({}, 'universityRegNo');
    const regularUrns = regularStudents.map(s => s.universityRegNo);

    // Find interyear students whose URNs don't match with regular students
    const nonMatchingStudents = await InterYearStudent.find({
      urn: { $nin: regularUrns, $ne: '' }
    }).select('name urn branch crn position activity');

    res.json(nonMatchingStudents);
  } catch (error) {
    console.error('Error fetching non-matching interyear students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students with empty URNs
router.get('/students/null-urn', async (req, res) => {
  try {
    // Get regular students with empty universityRegNo
    const nullUrnStudents = await Student.find({
      $or: [
        { universityRegNo: '' },
        { universityRegNo: { $exists: false } }
      ]
    });

    // Get interyear students with empty urn
    const nullUrnInteryearStudents = await InterYearStudent.find({
      $or: [
        { urn: '' },
        { urn: { $exists: false } }
      ]
    }).select('name urn branch crn position activity');

    // Combine both results
    const allNullUrnStudents = [
      ...nullUrnStudents,
      ...nullUrnInteryearStudents
    ];

    res.json(allNullUrnStudents);
  } catch (error) {
    console.error('Error fetching empty URN students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update URN for a student
router.put('/students/update-urn', async (req, res) => {
  try {
    const { studentId, newUrn, filterType, filterValue } = req.body;

    // Find the student in either collection
    let student = await Student.findById(studentId);
    let collection = Student;

    if (!student) {
      student = await InterYearStudent.findById(studentId);
      collection = InterYearStudent;
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update the URN
    if (collection === Student) {
      student.universityRegNo = newUrn;
    } else {
      student.urn = newUrn;
    }

    await student.save();

    res.json({ message: 'URN updated successfully' });
  } catch (error) {
    console.error('Error updating URN:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get interyear students by URN
router.get('/interyear-students', async (req, res) => {
  try {
    const { urn } = req.query;
    let query = {};
    
    if (urn) {
      query.urn = urn;
    }

    const students = await InterYearStudent.find(query)
      .select('name urn branch crn position activity');
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching interyear students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by URN
router.get('/interyear-students/by-urn', interyearStudentController.getStudentByUrn);

// Add a new interyear student
router.post('/interyear-students', interyearStudentController.addInteryearStudent);

module.exports = router; 