import React, { useState, useEffect } from 'react';
import * as XLSX from 'sheetjs-style';
import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, TableRow as DocxTableRow, WidthType, TextRun,  ImageRun,
  HeadingLevel,Alignment
} from 'docx';
import { Button, Container, Typography, Paper, Table as MuiTable, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';
import ExcelJS from 'exceljs';

function Overall() {
  const [students, setStudents] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({
    urn: '',
    name: '',
    branch: '',
    event: '',
    position: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();

      // Only add non-empty filters
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val.trim()) {
          queryParams.append(key, val.trim());
        }
      });

      const url = `http://localhost:5000/api/students?${queryParams.toString()}`;
      console.log('Fetching URL:', url); // Debug log
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Server error');
      }
      
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update filters and trigger search
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Use useEffect to trigger search when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchStudents();
    }, 500); // Wait 500ms after last filter change before searching

    return () => clearTimeout(debounceTimer);
  }, [filters]); // Trigger when filters change

  const formatEvents = (events, lineBreak = false) => {
    const separator = lineBreak ? '\n' : ', ';
    return events.map(e => `${e.position} in ${e.activity}`).join(separator);
  };

  const fetchImagesBuffer = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}`);
      }
      const blob = await response.blob();
      return await blob.arrayBuffer();
    } catch (error) {
      console.error('Error fetching image buffer:', error);
      return null; // Return null in case of error to avoid breaking the process
    }
  };
  
  

  
  
  const exportToExcel = async (students) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');
  
    // Column widths
    worksheet.columns = [
      { width: 8 },   // A - Sr. No
      { width: 20 },  // B - Name
      { width: 20 },  // C - Father's Name
      { width: 15 },  // D - DOB
      { width: 20 },  // E - Reg. No
      { width: 25 },  // F - Branch
      { width: 10 },  // G - Matric
      { width: 10 },  // H - +2
      { width: 22 },  // I - First Admission
      { width: 18 },  // J - Exam Name
      { width: 12 },  // K - Exam Year
      { width: 12 },  // L - Grad
      { width: 12 },  // M - PG
      { width: 15 },  // N - Inter Varsity
      { width: 20 },  // O - Signature
      { width: 30 },  // P - Address
      { width: 20 },  // Q - Passport
      { width: 15 },  // R - Activity
      { width: 10 },  // S - Position
    ];
  
    // Merge cells to match screenshot
    worksheet.mergeCells('G1:H1'); // Year of Passing
    worksheet.mergeCells('I1:I2'); // First Admission
    worksheet.mergeCells('J1:K1'); // Name & year of the last Examination
    worksheet.mergeCells('L1:M1'); // No of years of
    worksheet.mergeCells('N1:N2'); // Inter Varsity
    worksheet.mergeCells('O1:O2'); // Signature
    worksheet.mergeCells('P1:P2'); // Address
    worksheet.mergeCells('Q1:Q2'); // Passport
    worksheet.mergeCells('R1:R2'); // Activity
    worksheet.mergeCells('S1:S2'); // Position
  
    // Merge vertical headers
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      worksheet.mergeCells(`${col}1:${col}2`);
    });
  
// Row 1 headers (merged cells titles)
worksheet.getCell('A1').value = 'Sr. No';
worksheet.getCell('B1').value = 'Name';
worksheet.getCell('C1').value = "Father's Name";
worksheet.getCell('D1').value = 'Date of Birth';
worksheet.getCell('E1').value = 'University Reg. No';
worksheet.getCell('F1').value = 'Present Branch/Year';
worksheet.getCell('G1').value = 'Year of Passing';
worksheet.getCell('I1').value = 'Date of First Admission to College after Matric/+2 Exam';
worksheet.getCell('J1').value = 'Name & year of the last Examination';
worksheet.getCell('L1').value = 'No of years of';
worksheet.getCell('N1').value = 'No of participation in Inter Varsity Tournament';
worksheet.getCell('O1').value = 'Signature of Student';
worksheet.getCell('P1').value = 'Home Address with Phone No';
worksheet.getCell('Q1').value = 'Passport Size Photograph';
worksheet.getCell('R1').value = 'Activity';
worksheet.getCell('S1').value = 'Position';

// Row 2 sub-headers
worksheet.getCell('G2').value = 'Matric\n7(a)';
worksheet.getCell('H2').value = '+2\n7(b)';
worksheet.getCell('J2').value = 'Name\n9(a)';
worksheet.getCell('K2').value = 'Year\n9(b)';
worksheet.getCell('L2').value = 'Graduate\n10(a)';
worksheet.getCell('M2').value = 'PG\n10(b)';

// Set alignment and styles for row 1 and 2
[1, 2].forEach(rowNum => {
  const row = worksheet.getRow(rowNum);
  row.height = 35;
  row.eachCell(cell => {
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
});

  
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const activity = s.events?.map(e => e.activity).join(', ') || '';
      const position = s.events?.map(e => e.position).join(', ') || '';
  
      const row = worksheet.addRow([
        i + 1,
        s.name || '',
        s.fatherName || '',
        s.dob || '',
        s.universityRegNo || '',
        s.branchYear || '',
        s.matricYear || '',
        s.plusTwoYear || '',
        s.firstAdmissionYear || '',
        s.lastExam || '',
        s.lastExamYear || '',
        s.interCollegeGraduateYears || '',
        s.interCollegePgYears || '',
        s.interVarsityYears || '',
        '', // Signature
        s.addressWithPhone || '',
        '', // Passport
        activity,
        position,
      ]);
  
      row.height = 90;
  
      // Signature image
      if (s.signatureUrl) {
        try {
          const buffer = await fetchImagesBuffer(s.signatureUrl);
          const imageId = workbook.addImage({ buffer, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 14, row: i + 2.3 },
            ext: { width: 100, height: 40 },
          });
        } catch (err) {
          console.error("Signature image error:", err);
        }
      }
  
      // Passport photo
      if (s.passportPhotoUrl) {
        try {
          const buffer = await fetchImagesBuffer(s.passportPhotoUrl);
          const imageId = workbook.addImage({ buffer, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 16, row: i + 2.1 },
            ext: { width: 70, height: 80 },
          });
        } catch (err) {
          console.error("Passport photo error:", err);
        }
      }
    }
  
    // Styling for all cells
    worksheet.eachRow(row => {
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  
    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'students.xlsx');
  };
  
  
  
  
  
 

  const fetchImageBuffer = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  };
  
  const exportToWord = async (students) => {
    if (!Array.isArray(students)) {
      console.error('The students data is not an array:', students);
      return;
    }
  
    const tableRows = [];
  
    // Header row 1
    tableRows.push(new DocxTableRow({
      children: [
        ...['Sr. No', 'Name', 'Father’s Name', 'Date of Birth', 'University Reg. No', 'Present Branch/Year']
          .map((text, idx) => new DocxTableCell({
            width: { size: [0, 3, 4].includes(idx) ? 2500 : 2000, type: WidthType.DXA },
            rowSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
          })),
        new DocxTableCell({
          columnSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: 'Year of Passing', bold: true })] })],
        }),
        new DocxTableCell({
          rowSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: 'Date of First Admission to College after Matric/+2 Exam', bold: true })] })],
        }),
        new DocxTableCell({
          columnSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: 'Name & year of the last Examination Passed', bold: true })] })],
        }),
        new DocxTableCell({
          columnSpan: 2,
          children: [new Paragraph({ children: [new TextRun({ text: 'No of years of participation Inter College while persuing', bold: true })] })],
        }),
        ...[
          'No of participation in Inter Varsity Tournament',
          'Signature of Student',
          'Home Address with Phone No',
          'Passport Size Photograph',
          'Activity',
          'Position',
        ].map((text) => new DocxTableCell({
          rowSpan: 2,
          width: { size: 2000, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        })),
      ]
    }));
  
    // Header row 2
    tableRows.push(new DocxTableRow({
      children: [
        'Matric\n7(a)', '+2\n7(b)', 'Name\n9(a)', 'Year\n9(b)', 'Graduate\n10(a)', 'PG\n10(b)'
      ].map((text, i) => new DocxTableCell({
        width: { size: i === 5 ? 2500 : 2000, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
      }))
    }));
  
    // Student rows
    for (const [index, s] of students.entries()) {
      const signatureImage = s.signatureUrl ? await fetchImageBuffer(s.signatureUrl) : null;
      const passportImage = s.passportPhotoUrl ? await fetchImageBuffer(s.passportPhotoUrl) : null;
  
      const events = s.events && Array.isArray(s.events) ? s.events : [];
      let activity = '';
      let position = '';
  
      if (events.length > 0) {
        activity = events.map(event => event.activity).join(', ');
        position = events.map(event => event.position).join(', ');
      }
  
      const cells = [
        (index + 1).toString(),  // Fixed Sr. No
        s.name,
        s.fatherName,
        s.dob,
        s.universityRegNo,
        s.branchYear,
        s.matricYear,
        s.plusTwoYear,
        s.firstAdmissionYear,
        s.lastExam,
        s.lastExamYear,
        s.interCollegeGraduateYears,
        s.interCollegePgYears,
        s.interVarsityYears,
        s.signatureUrl ? new ImageRun({ data: signatureImage, transformation: { width: 60, height: 30 } }) : '',
        s.addressWithPhone,
        s.passportPhotoUrl ? new ImageRun({ data: passportImage, transformation: { width: 60, height: 60 } }) : '',
        activity,
        position,
      ];
  
      tableRows.push(new DocxTableRow({
        children: cells.map((val, i) => new DocxTableCell({
          width: {
            size: [0].includes(i) ? 1500 :
                  [3, 4, 12].includes(i) ? 2500 :
                  [16, 17, 18].includes(i) ? 2000 :
                  1500,
            type: WidthType.DXA,
          },
          children: [
            new Paragraph({
              children: [
                (val instanceof TextRun || val instanceof ImageRun)
                  ? val
                  : new TextRun(val?.toString() || '')
              ]
            })
          ],
        })),
      }));
    }
  
    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: "landscape" } },
        },
        children: [
          new Paragraph({
            text: "Student List",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 }
          }),
          new DocxTable({ rows: tableRows }),
        ]
      }]
    });
  
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, "students.docx");
  };
  
  
  
  

  useEffect(() => {
    fetchStudents();
  }, []);
  

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(students.map(student => student._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (studentId) => {
    setSelectedRows(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const getStudentsToExport = () => {
    if (selectedRows.length > 0) {
      return students.filter(student => selectedRows.includes(student._id));
    } else if (filters.urn || filters.name || filters.branch || filters.event || filters.position) {
      return students;
    } else {
      return students;
    }
  };

  return (
    <Container>
      <Paper sx={{ padding: 2 }}>
        <h2>📄 Student Records</h2>

        <div style={{ marginBottom: '20px' }}>
          <input 
            placeholder="URN" 
            value={filters.urn} 
            onChange={e => handleFilterChange('urn', e.target.value)} 
            style={{ marginRight: 10 }} 
          />
          <input 
            placeholder="Name" 
            value={filters.name} 
            onChange={e => handleFilterChange('name', e.target.value)} 
            style={{ marginRight: 10 }} 
          />
          <input 
            placeholder="Branch" 
            value={filters.branch} 
            onChange={e => handleFilterChange('branch', e.target.value)} 
            style={{ marginRight: 10 }} 
          />
          <input 
            placeholder="Event" 
            value={filters.event} 
            onChange={e => handleFilterChange('event', e.target.value)} 
            style={{ marginRight: 10 }} 
          />
          <select 
            value={filters.position} 
            onChange={e => handleFilterChange('position', e.target.value)} 
            style={{ marginRight: 10 }}
          >
            <option value="">All Positions</option>
            <option value="1st">1st</option>
            <option value="2nd">2nd</option>
            <option value="3rd">3rd</option>
            <option value="Participated">Participated</option>
          </select>
          <button onClick={() => exportToExcel(getStudentsToExport())} style={{ marginLeft: 10 }}>📤 Excel</button>
          <button onClick={() => exportToWord(getStudentsToExport())} style={{ marginLeft: 10 }}>Export to word</button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {students.length > 0 ? (
          <MuiTable sx={{ minWidth: 1400, border: '1px solid black', borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedRows.length === students.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < students.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell rowSpan={2}>Sr. No</TableCell>
                <TableCell rowSpan={2}>Name</TableCell>
                <TableCell rowSpan={2}>Father's Name</TableCell>
                <TableCell rowSpan={2}>Date of Birth</TableCell>
                <TableCell rowSpan={2}>University Reg. No</TableCell>
                <TableCell rowSpan={2}>Present Branch/Year</TableCell>
                <TableCell colSpan={2}>Year of Passing</TableCell>
                <TableCell rowSpan={2}>Date of First Admission to College after Matric/+2 Exam</TableCell>
                <TableCell colSpan={2}>Name & year of the last Examination Passed</TableCell>
                <TableCell colSpan={2}>No of years of participation Inter College while pursuing</TableCell>
                <TableCell rowSpan={2}>No of participation in Inter Varsity Tournament</TableCell>
                <TableCell rowSpan={2}>Signature of Student</TableCell>
                <TableCell rowSpan={2}>Home Address with Phone No</TableCell>
                <TableCell rowSpan={2}>Passport Size Photograph</TableCell>
                <TableCell rowSpan={2}>Activity</TableCell>
                <TableCell rowSpan={2}>Position</TableCell>
              </TableRow>
            </TableHead>
            <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                <TableCell>1</TableCell>
                <TableCell>2</TableCell>
                <TableCell>3</TableCell>
                <TableCell>4</TableCell>
                <TableCell>5</TableCell>
                <TableCell>6</TableCell>
                <TableCell>Matric<br />7(a)</TableCell>
                <TableCell>+2<br />7(b)</TableCell>
                <TableCell>8</TableCell>
                <TableCell>Name<br />9(a)</TableCell>
                <TableCell>Year<br />9(b)</TableCell>
                <TableCell>Graduate<br />10(a)</TableCell>
                <TableCell>PG<br />10(b)</TableCell>
                <TableCell>11</TableCell>
                <TableCell>12</TableCell>
                <TableCell>13</TableCell>
                <TableCell>14</TableCell>
                <TableCell>15</TableCell>
                <TableCell>16</TableCell>
              </TableRow>

             <TableBody>
                         {students.map((student, index) => (
                           <TableRow key={index}>
                             <TableCell padding="checkbox">
                               <Checkbox
                                 checked={selectedRows.includes(student._id)}
                                 onChange={() => handleSelectRow(student._id)}
                               />
                             </TableCell>
                             <TableCell>{student.srNo}</TableCell>
                             <TableCell>{student.name}</TableCell>
                             <TableCell>{student.fatherName}</TableCell>
                             <TableCell>{student.dob}</TableCell>
                             <TableCell>{student.universityRegNo}</TableCell>
                             <TableCell>{student.branchYear}</TableCell>
                             <TableCell>{student.matricYear}</TableCell>
                             <TableCell>{student.plusTwoYear}</TableCell>
                             <TableCell>{student.firstAdmissionYear}</TableCell>
                             <TableCell>{student.lastExam}</TableCell>
                             <TableCell>{student.lastExamYear}</TableCell>
                             <TableCell>{student.interCollegeGraduateYears}</TableCell>
                             <TableCell>{student.interCollegePgYears}</TableCell>
                             <TableCell>{student.interVarsityYears}</TableCell>
                             <TableCell>
                               {student.signatureUrl && (
                                 <img src={student.signatureUrl} alt="signature" width="60" />
                               )}
                             </TableCell>
                             <TableCell style={{ whiteSpace: "pre-wrap" }}>
                               {student.addressWithPhone}
                             </TableCell>
                             <TableCell>
                               {student.passportPhotoUrl && (
                                 <img src={student.passportPhotoUrl} alt="photo" width="60" />
                               )}
                             </TableCell>
                             <TableCell>
        {student.events?.map((e, idx) => (
          <div key={idx}>
            {e.activity} {/* Show activity */}
          </div>
        ))}
      </TableCell>
      <TableCell>
        {student.events?.map((e, idx) => (
          <div key={idx}>
            {e.position} {/* Show position */}
          </div>
        ))}
      </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
          </MuiTable>
        ) : (
          <Typography variant="h6" color="textSecondary">
            No records found
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default Overall;
