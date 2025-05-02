const InterYearStudent = require('../models/interyear_student');
const Student = require('../models/student');

// Get student by URN
const getStudentByUrn = async (req, res) => {
  try {
    const { urn } = req.query;
    
    if (!urn) {
      return res.status(400).json({ message: 'URN is required' });
    }

    // First check in regular students
    let student = await Student.findOne({ universityRegNo: urn });
    let isRegularStudent = true;

    // If not found in regular students, check in interyear students
    if (!student) {
      student = await InterYearStudent.findOne({ urn });
      isRegularStudent = false;
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Format the response based on student type
    const response = {
      name: student.name,
      urn: isRegularStudent ? student.universityRegNo : student.urn,
      branch: isRegularStudent ? student.branchYear : student.branch,
      crn: student.crn || '',
      email: student.email || '',
      activities: isRegularStudent ? student.events : [{
        activity: student.activity,
        position: student.position
      }],
      isRegularStudent
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or update an interyear student
const addInteryearStudent = async (req, res) => {
  try {
    const { name, urn, branch, crn, email, activity, position } = req.body;

    // Validate required fields
    if (!name || !branch || !activity || !position) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if student with URN exists
    let existingStudent = null;
    if (urn) {
      existingStudent = await InterYearStudent.findOne({ urn });
    }

    if (existingStudent) {
      // Update existing student
      existingStudent.name = name;
      existingStudent.branch = branch;
      existingStudent.crn = crn || existingStudent.crn;
      existingStudent.email = email || existingStudent.email;
      existingStudent.activity = activity;
      existingStudent.position = position;

      await existingStudent.save();

      res.status(200).json({
        message: 'Interyear student updated successfully',
        student: existingStudent
      });
    } else {
      // Create new interyear student
      const newStudent = new InterYearStudent({
        name,
        urn: urn || '', // Allow empty URN
        branch,
        crn: crn || '', // Optional
        email: email || '', // Optional
        activity,
        position
      });

      await newStudent.save();

      res.status(201).json({
        message: 'Interyear student added successfully',
        student: newStudent
      });
    }
  } catch (error) {
    console.error('Error adding/updating interyear student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addInteryearStudent,
  getStudentByUrn
}; 