const mongoose = require("mongoose");
const studentSchema = new mongoose.Schema({
  name: String,
  branch: String,
  urn: String,
  crn: String,
  email: String,
  events: [
    {
      activity: { type: String, required: true },
      position: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('InterYearStudent', interyearStudentSchema);