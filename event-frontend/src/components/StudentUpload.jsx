import React, { useState } from 'react';
import axios from 'axios';

function StudentUpload() {
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/excel/upload', formData);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to upload and parse file.");
    }
  };
  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/excel/submit', students);
      alert(`Successfully submitted ${res.data.savedCount} students.`);
    } catch (error) {
      console.error(error);
      alert("Failed to submit data.");
    }
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Excel File</h2>
      <input type="file" accept=".xlsx" onChange={handleFileChange} />
      <button onClick={handleUpload} style={{ marginLeft: 10 }}>Upload & Preview</button>

      {students.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Preview</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', marginTop: 10 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>URN</th>
                <th>CRN</th>
                <th>Email</th>
                <th>Position</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td>{s.branch}</td>
                  <td>{s.urn}</td>
                  <td>{s.crn}</td>
                  <td>{s.email}</td>
                  <td>{s.position}</td>
                  <td>{s.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSubmit} style={{ marginTop: 20 }}>Submit to DB</button>
        </>
      )}


    </div>
  );
}

export default StudentUpload;
