const Student = require('../models/student');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('name universityRegNo branchYear crn email events _id');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get student by URN
exports.getStudentByUrn = async (req, res) => {
  try {
    const { urn } = req.query;
    const student = await Student.findOne({ universityRegNo: urn });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create student (manual entry)
exports.createStudent = async (req, res) => {
  try {
    const {
      universityRegNo,
      name,
      fatherName,
      dob,
      branchYear,
      matricYear,
      plusTwoYear,
      firstAdmissionYear,
      lastExam,
      lastExamYear,
      interCollegeGraduateYears,
      interCollegePgYears,
      interVarsityYears,
      addressWithPhone,
      signatureUrl,
      passportPhotoUrl,
      activities
    } = req.body;

    // Convert activities to events format
    const events = activities.map(activity => ({
      activity: activity.activity,
      position: activity.position
    }));

    // Check if student exists
    const existingStudent = await Student.findOne({ universityRegNo });
    
    if (existingStudent) {
      // Update existing student
      existingStudent.name = name;
      existingStudent.fatherName = fatherName;
      existingStudent.dob = dob;
      existingStudent.branchYear = branchYear;
      existingStudent.matricYear = matricYear;
      existingStudent.plusTwoYear = plusTwoYear;
      existingStudent.firstAdmissionYear = firstAdmissionYear;
      existingStudent.lastExam = lastExam;
      existingStudent.lastExamYear = lastExamYear;
      existingStudent.interCollegeGraduateYears = interCollegeGraduateYears;
      existingStudent.interCollegePgYears = interCollegePgYears;
      existingStudent.interVarsityYears = interVarsityYears;
      existingStudent.addressWithPhone = addressWithPhone;
      existingStudent.signatureUrl = signatureUrl;
      existingStudent.passportPhotoUrl = passportPhotoUrl;
      
      // Add new events if they don't exist
      events.forEach(newEvent => {
        const eventExists = existingStudent.events.some(
          existingEvent => existingEvent.activity === newEvent.activity
        );
        if (!eventExists) {
          existingStudent.events.push(newEvent);
        }
      });

      await existingStudent.save();
      return res.status(200).json({ 
        message: 'Student updated successfully', 
        student: existingStudent 
      });
    }

    // Create new student
    const student = new Student({
      universityRegNo,
      name,
      fatherName,
      dob,
      branchYear,
      matricYear,
      plusTwoYear,
      firstAdmissionYear,
      lastExam,
      lastExamYear,
      interCollegeGraduateYears,
      interCollegePgYears,
      interVarsityYears,
      addressWithPhone,
      signatureUrl,
      passportPhotoUrl,
      events
    });

    await student.save();
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Error in createStudent:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}; 