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

// PUT /students - update student events
router.put('/students', async (req, res) => {
  try {
    const { universityRegNo, crn, events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Events array is required' });
    }

    let query = {};
    if (universityRegNo) {
      query.universityRegNo = universityRegNo;
    } else if (crn) {
      query.crn = crn;
    } else {
      return res.status(400).json({ message: 'Either URN or CRN is required' });
    }

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update events
    student.events = events;
    await student.save();

    res.json({ message: 'Student events updated successfully', student });
  } catch (error) {
    console.error('Error updating student events:', error);
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

// Add event to a student
router.post('/students/:studentId/events', async (req, res) => {
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

    // Initialize events array if it doesn't exist
    if (!student.events) {
      student.events = [];
    }

    // Add new event
    student.events.push({ activity, position });
    await student.save();

    res.status(200).json({
      message: 'Event added successfully',
      student
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a regular student by ID
router.put('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { events } = req.body;
    console.log('Received update request for student ID:', studentId);
    console.log('Request body:', { events });

    // Find student by ID
    const existingStudent = await Student.findById(studentId);
    console.log('Found existing student:', existingStudent ? {
      _id: existingStudent._id,
      name: existingStudent.name,
      universityRegNo: existingStudent.universityRegNo,
      eventsCount: existingStudent.events?.length
    } : 'Not found');

    if (!existingStudent) {
      console.log('Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    try {
      // Get the last event from the events array (the new one being added)
      const newEvent = events[events.length - 1];
      console.log('New event to add:', newEvent);
      
      // Check if this exact event already exists
      const eventExists = existingStudent.events.some(event => 
        event.activity === newEvent.activity && event.position === newEvent.position
      );
      console.log('Event exists:', eventExists);

      if (!eventExists) {
        // Only add the new event if it doesn't exist
        existingStudent.events = [...existingStudent.events, newEvent];
        console.log('Updated events array:', existingStudent.events);
      }

      const updatedStudent = await existingStudent.save();
      console.log('Successfully updated student:', {
        _id: updatedStudent._id,
        name: updatedStudent.name,
        eventsCount: updatedStudent.events?.length
      });

      res.status(200).json({
        message: 'Student updated successfully',
        student: updatedStudent
      });
    } catch (saveError) {
      console.error('Error saving student:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Error updating student:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
