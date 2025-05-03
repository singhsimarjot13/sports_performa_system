const express = require('express');
const router = express.Router();
const Student = require('../models/student');
const InterYearStudent = require('../models/interyear_student');
const interyearStudentController = require('../controllers/interyearStudentController');

// Add event to a student
router.post('/interyear-students/:studentId/events', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activity, position } = req.body;

    if (!activity || !position) {
      return res.status(400).json({ message: 'Activity and position are required' });
    }

    const student = await InterYearStudent.findById(studentId);
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

// Get non-matching interyear students
router.get('/interyear-students/non-matching', async (req, res) => {
  try {
    // Get all regular students' URNs
    const regularStudents = await Student.find({}, 'universityRegNo');
    const regularUrns = regularStudents.map(s => s.universityRegNo);

    // Find interyear students whose URNs don't match with regular students
    const nonMatchingStudents = await InterYearStudent.find({
      urn: { $nin: regularUrns, $ne: '' }
    }).select('name urn branch crn email events _id');

    console.log('Non-matching students query result:', nonMatchingStudents);
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
    }).select('name universityRegNo branchYear crn email events _id');

    // Get interyear students with empty urn
    const nullUrnInteryearStudents = await InterYearStudent.find({
      $or: [
        { urn: '' },
        { urn: { $exists: false } }
      ]
    }).select('name urn branch crn email events _id');

    console.log('Null URN students query result:', [...nullUrnStudents, ...nullUrnInteryearStudents]);

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
      // Use case-insensitive regex for partial matching
      query.urn = { $regex: urn, $options: 'i' };
      console.log('Searching for interyear students with URN:', urn);
    }

    const students = await InterYearStudent.find(query)
      .select('name urn branch crn email events _id');
    
    console.log('Found students:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Error fetching interyear students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by URN or CRN
router.get('/interyear-students/by-:type', interyearStudentController.getStudentByIdentifier);

// Add a new interyear student
router.post('/interyear-students', interyearStudentController.addInteryearStudent);

// Update position for an interyear student
router.put('/interyear-students/:studentId/update-position', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activity, position } = req.body;

    if (!activity || !position) {
      return res.status(400).json({ message: 'Activity and position are required' });
    }

    const student = await InterYearStudent.findById(studentId);
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

// PUT /interyear-students - update student events
router.put('/interyear-students', async (req, res) => {
  try {
    const { urn, crn, events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Events array is required' });
    }

    let query = {};
    if (urn) {
      query.urn = urn;
    } else if (crn) {
      query.crn = crn;
    } else {
      return res.status(400).json({ message: 'Either URN or CRN is required' });
    }

    const student = await InterYearStudent.findOne(query);
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

// Add or update an interyear student
router.post('/interyear-students', async (req, res) => {
  try {
    const { name, urn, branch, crn, email, events } = req.body;

    // Validate required fields
    if (!name || !branch) {
      return res.status(400).json({ message: 'Name and branch are required' });
    }

    // Format events according to schema
    let formattedEvents = [];
    if (events && Array.isArray(events)) {
      formattedEvents = events.map(event => ({
        activity: event.activity,
        position: event.position
      }));
    }

    // Validate each event
    for (const event of formattedEvents) {
      if (!event.activity || !event.position) {
        return res.status(400).json({ message: 'Each event must have activity and position' });
      }
    }

    // Check if student exists by CRN or URN
    let existingStudent = null;
    if (crn) {
      existingStudent = await InterYearStudent.findOne({ crn });
    } else if (urn) {
      existingStudent = await InterYearStudent.findOne({ urn });
    }

    console.log('Looking for student with CRN:', crn, 'or URN:', urn);
    console.log('Found existing student:', existingStudent);

    if (existingStudent) {
      console.log('Updating existing student:', existingStudent._id);
      
      // Update existing student
      existingStudent.name = name;
      existingStudent.branch = branch;
      existingStudent.urn = urn || existingStudent.urn;
      existingStudent.email = email || existingStudent.email;

      // Get the last event from the formatted events (the new one being added)
      const newEvent = formattedEvents[formattedEvents.length - 1];
      
      // Check if this exact event already exists
      const eventExists = existingStudent.events.some(event => 
        event.activity === newEvent.activity && event.position === newEvent.position
      );

      if (!eventExists) {
        // Only add the new event if it doesn't exist
        existingStudent.events = [...existingStudent.events, newEvent];
      }

      const updatedStudent = await existingStudent.save();
      console.log('Updated student:', updatedStudent);

      res.status(200).json({
        message: 'Interyear student updated successfully',
        student: updatedStudent
      });
    } else {
      console.log('Creating new student');
      
      // Create new student
      const newStudent = new InterYearStudent({
        name,
        urn,
        branch,
        crn,
        email,
        events: formattedEvents
      });

      const savedStudent = await newStudent.save();
      console.log('Created student:', savedStudent);

      res.status(201).json({
        message: 'Interyear student created successfully',
        student: savedStudent
      });
    }
  } catch (error) {
    console.error('Error in add/update interyear student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an interyear student by ID
router.put('/interyear-students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, urn, branch, crn, email, events } = req.body;
    console.log('Received update request for student ID:', studentId);
    console.log('Request body:', { name, urn, branch, crn, email, events });

    // Validate required fields
    if (!name || !branch) {
      console.log('Missing required fields:', { name, branch });
      return res.status(400).json({ message: 'Name and branch are required' });
    }

    // Find student by ID
    const existingStudent = await InterYearStudent.findById(studentId);
    console.log('Found existing student:', existingStudent ? {
      _id: existingStudent._id,
      name: existingStudent.name,
      crn: existingStudent.crn,
      urn: existingStudent.urn,
      eventsCount: existingStudent.events?.length
    } : 'Not found');

    if (!existingStudent) {
      console.log('Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    try {
      // Update student details
      existingStudent.name = name;
      existingStudent.branch = branch;
      existingStudent.urn = urn || existingStudent.urn;
      existingStudent.email = email || existingStudent.email;

      // Get the last event from the formatted events (the new one being added)
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
        message: 'Interyear student updated successfully',
        student: updatedStudent
      });
    } catch (saveError) {
      console.error('Error saving student:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Error updating interyear student:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update URN for a specific interyear student
router.put('/interyear-students/:studentId/update-urn', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { urn } = req.body;

    console.log('Updating URN for student:', studentId);
    console.log('New URN:', urn);

    if (!urn) {
      return res.status(400).json({ message: 'URN is required' });
    }

    const student = await InterYearStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.urn = urn;
    await student.save();

    console.log('URN updated successfully');
    res.json({ message: 'URN updated successfully', student });
  } catch (error) {
    console.error('Error updating URN:', error);
    res.status(500).json({ message: 'Error updating URN', error: error.message });
  }
});

module.exports = router; 