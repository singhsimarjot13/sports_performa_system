// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Student = require('../models/student');

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


router.post('/manual-entry', async (req, res) => {
    const { urn, name, branch, activity, position } = req.body;
  
    try {
      let student = await Student.findOne({ urn });
  
      if (student) {
        // Update existing student
        student.events.push({ activity, position });
        await student.save();
        return res.status(200).json({ message: 'Updated existing student', student });
      } else {
        // Create new student
        student = new Student({
          name,
          urn,
          branch,
          events: [{ activity, position }],
        });
        await student.save();
        return res.status(201).json({ message: 'Created new student', student });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  


module.exports = router;
