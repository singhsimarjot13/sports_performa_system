const InterYearStudent = require('../models/interyear_student');
const Student = require('../models/student');

// Get all non-matching interyear students
const getNonMatchingStudents = async (req, res) => {
  try {
    const students = await InterYearStudent.find({});
    res.json(students);
  } catch (error) {
    console.error('Error fetching non-matching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student by URN or CRN
const getStudentByIdentifier = async (req, res) => {
  try {
    const { urn, crn } = req.query;
    const identifier = urn || crn;
    const type = urn ? 'urn' : 'crn';
    
    if (!identifier) {
      return res.status(400).json({ message: `${type.toUpperCase()} is required` });
    }

    // Only check in interyear students
    const student = await InterYearStudent.findOne({ 
      [type]: identifier 
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found in interyear records' });
    }

    // Format the response
    const response = {
      name: student.name,
      urn: student.urn,
      branch: student.branch,
      crn: student.crn,
      email: student.email,
      events: student.events || [],
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching interyear student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or update an interyear student
const addInteryearStudent = async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Debug log
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

    console.log('Formatted events:', formattedEvents); // Debug log

    // Validate each event
    for (const event of formattedEvents) {
      if (!event.activity || !event.position) {
        return res.status(400).json({ message: 'Each event must have activity and position' });
      }
    }

    // Check if student with URN exists
    let existingStudent = null;
    if (urn) {
      existingStudent = await InterYearStudent.findOne({ urn });
    }

    if (existingStudent) {
      console.log('Updating existing student:', existingStudent._id); // Debug log
      
      // Update existing student
      existingStudent.name = name;
      existingStudent.branch = branch;
      existingStudent.crn = crn || existingStudent.crn;
      existingStudent.email = email || existingStudent.email;
      existingStudent.events = formattedEvents;

      const updatedStudent = await existingStudent.save();
      console.log('Updated student:', updatedStudent); // Debug log

      res.status(200).json({
        message: 'Interyear student updated successfully',
        student: updatedStudent
      });
    } else {
      console.log('Creating new student'); // Debug log
      
      // Create new interyear student
      const newStudent = new InterYearStudent({
        name,
        urn: urn || '',
        branch,
        crn: crn || '',
        email: email || '',
        events: formattedEvents
      });

      const savedStudent = await newStudent.save();
      console.log('Saved student:', savedStudent); // Debug log

      res.status(201).json({
        message: 'Interyear student added successfully',
        student: savedStudent
      });
    }
  } catch (error) {
    console.error('Error adding/updating interyear student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNonMatchingStudents,
  getStudentByIdentifier,
  addInteryearStudent
}; 