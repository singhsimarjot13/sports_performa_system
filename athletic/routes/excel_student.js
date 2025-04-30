const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Students = require('../models/interyear_student.js');

const router = express.Router();

// File upload config
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // raw array
const rawHeaders = jsonData[3]; // actual header row
const rows = jsonData.slice(4); // data rows start from row index 4

// Clean headers
const headers = rawHeaders.map(h => (h || '').toString().trim().replace(/\s+/g, ' '));

// Map rows
const students = rows
  .map(row => {
    const rowObj = Object.fromEntries(headers.map((h, i) => [h, row[i]]));

    const achievement = rowObj['Achievement/Result'] || '';
    const [position, ...activityParts] = achievement.split(' in ');
    const activity = activityParts.join(' in ');
    const urn = rowObj['Univ. Roll no.']?.toString().trim() || 'Unknown'; // Default value if urn is null or empty
    return {
      name: rowObj['Name']?.toString().trim() || '',
      branch: rowObj['Course/Branch']?.toString().trim() || '',
      urn: rowObj['Univ. Roll no.']?.toString().trim() || '',
      crn: rowObj['College Roll No.']?.toString().trim() || '',
      email: rowObj['Email.Id']?.toString().trim() || '',
      position: position?.trim() || '',
      activity: activity?.trim() || '',
    };
  })
  .filter(s => s.name && s.crn); // keep only valid rows



  res.json(students);
});
router.post('/submit', async (req, res) => {
    try {
      const students = req.body;
  
      // Optional: remove existing entries if needed
      // await Student.deleteMany({});
  
      const saved = await Students.insertMany(students);
      res.status(200).json({ message: 'Students saved successfully', savedCount: saved.length });
    } catch (error) {
      console.error('Error saving students:', error);
      res.status(500).json({ error: 'Failed to save students' });
    }
  });
module.exports = router;
