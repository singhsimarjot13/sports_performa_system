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
      const url = urn
        ? `http://localhost:5000/api/students?urn=${urn}`
        : `http://localhost:5000/api/students`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Student not found or server error');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : [data]);
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
        student.urn,
        student.branch,
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
            student.urn,
            student.branch,
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
                <td>{s.name}</td>
                <td>{s.universityRegNo}</td>
                <td>{s.branchYear}</td>
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
