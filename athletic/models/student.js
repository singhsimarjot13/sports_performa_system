const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  srNo: Number,
  name: String,
  fatherName: String,
  dob: String,
  universityRegNo:String,
  branchYear: String,

  // Year of passing
  matricYear: String,
  plusTwoYear: String,

  firstAdmissionYear: String,

  // Last Exam Passed
  lastExam: String,
  lastExamYear: String,

  // Inter College years (graduate + pg)
  interCollegeGraduateYears: String,
  interCollegePgYears: String,

  // Inter Varsity
  interVarsityYears: String,

  // Contact Info
  addressWithPhone: String,

  // Uploaded photos
  signatureUrl: String,
  passportPhotoUrl: String,

  // Activities and Positions
  events: [
    {
      activity: String,
      position: String,
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
