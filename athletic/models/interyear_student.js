const mongoose = require("mongoose");
const studentSchema = new mongoose.Schema({
  name: String,
  branch: String,
  urn: String,
  crn: String,
  email: String,
  position: String,
  activity: String
});
  
module.exports = mongoose.model('InterYearStudent', studentSchema);