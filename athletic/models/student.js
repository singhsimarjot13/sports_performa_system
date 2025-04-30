const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  srNo: Number,
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  dob: { type: String, required: true },
  universityRegNo: { type: String, required: true, unique: true },
  branchYear: { type: String, required: true },

  // Year of passing
  matricYear: { type: String, required: true },
  plusTwoYear: { type: String, required: true },

  firstAdmissionYear: { type: String, required: true },

  // Last Exam Passed
  lastExam: { type: String, required: true },
  lastExamYear: { type: String, required: true },

  // Inter College years (graduate + pg)
  interCollegeGraduateYears: { type: String, required: true },
  interCollegePgYears: { type: String, required: true },

  // Inter Varsity
  interVarsityYears: { type: String, required: true },

  // Contact Info
  addressWithPhone: { type: String, required: true },

  // Uploaded photos
  signatureUrl: { type: String },
  passportPhotoUrl: { type: String },

  // Activities and Positions
  events: [
    {
      activity: { type: String, required: true },
      position: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model("Student", studentSchema);
