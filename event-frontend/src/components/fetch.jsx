import React, { useState, useEffect } from 'react';
import * as XLSX from 'sheetjs-style';


import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun } from 'docx';

function Fetch() {
  const [students, setStudents] = useState([]);
  const [urn, setUrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch regular students
      const regularStudentsUrl = urn
        ? `http://localhost:5000/api/students?universityRegNo=${urn}`
        : `http://localhost:5000/api/students`;
      const regularStudentsRes = await fetch(regularStudentsUrl);
      if (!regularStudentsRes.ok) throw new Error('Failed to fetch regular students');
      const regularStudents = await regularStudentsRes.json();
      console.log('Regular students:', regularStudents); // Debug log
      const regularStudentsArray = Array.isArray(regularStudents) ? regularStudents : [regularStudents];

      // Fetch interyear students
      const interyearStudentsUrl = urn
        ? `http://localhost:5000/api/interyear-students?urn=${urn}`
        : `http://localhost:5000/api/interyear-students`;
      const interyearStudentsRes = await fetch(interyearStudentsUrl);
      if (!interyearStudentsRes.ok) throw new Error('Failed to fetch interyear students');
      const interyearStudents = await interyearStudentsRes.json();
      console.log('Interyear students:', interyearStudents); // Debug log
      const interyearStudentsArray = Array.isArray(interyearStudents) ? interyearStudents : [interyearStudents];

      // Create a map to store merged students
      const mergedStudents = new Map();

      // Process regular students first
      regularStudentsArray.forEach(student => {
        if (student.universityRegNo) {
          mergedStudents.set(student.universityRegNo, {
            ...student,
            events: student.events || []
          });
        }
      });

      // Process interyear students
      interyearStudentsArray.forEach(student => {
        if (student.urn) {
          if (mergedStudents.has(student.urn)) {
            // If URN matches, merge events
            const existingStudent = mergedStudents.get(student.urn);
            mergedStudents.set(student.urn, {
              ...existingStudent,
              events: [
                ...(existingStudent.events || []),
                ...(student.events || [])
              ]
            });
          } else {
            // If URN doesn't match, create a new student entry
            mergedStudents.set(student.urn, {
              name: student.name,
              universityRegNo: student.urn,
              branchYear: student.branch,
              crn: student.crn,
              email: student.email,
              events: student.events || [],
              isInteryear: true
            });
          }
        } else {
          // If URN is empty, create a new entry with a temporary ID
          const tempId = `interyear-${Math.random().toString(36).substr(2, 9)}`;
          mergedStudents.set(tempId, {
            name: student.name,
            universityRegNo: 'No URN',
            branchYear: student.branch,
            crn: student.crn,
            email: student.email,
            events: student.events || [],
            isInteryear: true
          });
        }
      });

      // If a specific URN was searched and no matches were found,
      // check if there's a matching interyear student
      if (urn && !mergedStudents.has(urn)) {
        const matchingInteryearStudent = interyearStudentsArray.find(s => s.urn === urn);
        if (matchingInteryearStudent) {
          mergedStudents.set(urn, {
            name: matchingInteryearStudent.name,
            universityRegNo: matchingInteryearStudent.urn,
            branchYear: matchingInteryearStudent.branch,
            crn: matchingInteryearStudent.crn,
            email: matchingInteryearStudent.email,
            events: matchingInteryearStudent.events || [],
            isInteryear: true
          });
        }
      }

      // Convert Map to array
      const finalStudents = Array.from(mergedStudents.values());
      console.log('Final students:', finalStudents); // Debug log
      setStudents(finalStudents);
    } catch (err) {
      setStudents([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const formatEvents = (events, lineBreak = false) => {
    const separator = lineBreak ? '\n' : ', ';
    return events.map(e => `${e.position} in ${e.activity}`).join(separator);
  };
  

  const exportToExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Name', 'URN', 'Branch', 'Events'], // headers
      ...students.map(student => [
        student.name,
        student.universityRegNo,
        student.branchYear,
        formatEvents(student.events, true).replace(/\n/g, '\r\n'), // line breaks for Excel
      ]),
    ]);
  
    const range = XLSX.utils.decode_range(worksheet['!ref']);
  
    for (let R = 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 3 }); // 4th column = Events
      if (!worksheet[cellAddress]) continue;
  
      worksheet[cellAddress].s = {
        alignment: { wrapText: true, vertical: "top" },
      };
    }
  
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 },
    ];
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });
  
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'students.xlsx');
  };
  
  

  const exportToWord = async () => {
    const tableRows = [
      new TableRow({
        children: ['Name', 'URN', 'Branch', 'Events'].map(header =>
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
          })
        ),
      }),
      ...students.map(student => {
        const eventParagraphs = student.events.map(e =>
          new Paragraph(`${e.position} in ${e.activity}`)
        );
  
        return new TableRow({
          children: [
            student.name,
            student.universityRegNo,
            student.branchYear,
          ].map(text =>
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: [new Paragraph(text)],
            })
          ).concat(
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              children: eventParagraphs,
            })
          ),
        });
      }),
    ];
  
    const doc = new Document({
      sections: [
        {
          children: [new Paragraph("Student List"), new Table({ rows: tableRows })],
        },
      ],
    });
  
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, 'students.docx');
  };
  

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Student List</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={urn}
          onChange={(e) => setUrn(e.target.value)}
          placeholder="Enter URN to search"
          style={{ padding: '5px', marginRight: '10px' }}
        />
        <button onClick={fetchStudents} style={{ padding: '5px 10px', marginRight: '10px' }}>
          Search
        </button>
        <button onClick={exportToExcel} style={{ padding: '5px 10px', marginRight: '10px' }}>
          Export to Excel
        </button>
        <button onClick={exportToWord} style={{ padding: '5px 10px' }}>
          Export to Word
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {students.length > 0 ? (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>Name</th>
              <th>URN</th>
              <th>Branch</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={idx}>
                <td>{s.name || '-'}</td>
                <td>{s.universityRegNo || '-'}</td>
                <td>{s.branchYear || '-'}</td>
                <td>
                  {s.events && s.events.length > 0 ? (
                    <pre>
                      {s.events.map((event, i) => (
                        <div key={i}>
                          {event.position} in {event.activity}
                        </div>
                      ))}
                    </pre>
                  ) : (
                    'No events'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No students to display.</p>
      )}
    </div>
  );
}

export default Fetch;
