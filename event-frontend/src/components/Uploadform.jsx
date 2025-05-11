import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Container,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";

function UploadForm() {
  const [file, setFile] = useState(null);
  const [event, setEvent] = useState("");
  const [position, setPosition] = useState("");
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPTUTournament, setIsPTUTournament] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePreview = async () => {
    if (!file || !event || !position) {
      alert("Please select a file, event, and position");
      return;
    }

    const formData = new FormData();
    formData.append("docfile", file);
    const activityName = isPTUTournament ? `PTU intercollege ${event} tournament` : event;
    formData.append("activity", activityName);
    formData.append("position", position);

    try {
      const res = await axios.post("http://localhost:5000/upload-preview", formData);
      const { students, message } = res.data;
      setStudents(students);
      setMessage(message);
      setSubmitted(false);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Error generating preview");
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:5000/upload-final", students);
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      alert("Failed to submit to database");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Upload Event Participation File
      </Typography>

      <input type="file" onChange={handleFileChange} />
      <br />
      <br />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          label="Event Name"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          sx={{ mr: 2 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isPTUTournament}
              onChange={(e) => setIsPTUTournament(e.target.checked)}
            />
          }
          label="PTU Intercollege Tournament"
        />
      </Box>

      <TextField
        select
        SelectProps={{ native: true }}
        value={position}
        onChange={(e) => setPosition(e.target.value)}
      >
        <option value="">Select Position</option>
        <option value="Participated">Participated</option>
        <option value="1st">1st</option>
        <option value="2nd">2nd</option>
        <option value="3rd">3rd</option>
      </TextField>

      <br />
      <br />
      <Button variant="contained" onClick={handlePreview}>
        Generate Preview
      </Button>

      {students.length > 0 && (
        <Paper sx={{ mt: 4, overflowX: "auto", p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>

          <Table
            sx={{
              minWidth: 1400,
              border: "1px solid black",
              borderCollapse: "collapse",
              "& th, & td": {
                border: "1px solid black",
                padding: "8px",
                textAlign: "center",
              },
            }}
            size="small"
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                <TableCell rowSpan={2}>Sr. No</TableCell>
                <TableCell rowSpan={2}>Name</TableCell>
                <TableCell rowSpan={2}>Father's Name</TableCell>
                <TableCell rowSpan={2}>Date of Birth</TableCell>
                <TableCell rowSpan={2}>University Reg. No</TableCell>
                <TableCell rowSpan={2}>Present Branch/Year</TableCell>
                <TableCell colSpan={2}>Year of Passing</TableCell>
                <TableCell rowSpan={2}>Date of First Admission to College after Matric/+2 Exam</TableCell>
                <TableCell colSpan={2}>Name & year of the last Examination Passed</TableCell>
                <TableCell colSpan={2}>No of years of participation Inter College while persuing</TableCell>
                <TableCell rowSpan={2}>No of participation in Inter Varsity Tournament</TableCell>
                <TableCell rowSpan={2}>Signature of Student</TableCell>
                <TableCell rowSpan={2}>Home Address with Phone No</TableCell>
                <TableCell rowSpan={2}>Passport Size Photograph</TableCell>
                <TableCell rowSpan={2}>Activity</TableCell>
                <TableCell rowSpan={2}>Position</TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                <TableCell>Matric<br />7(a)</TableCell>
                <TableCell>+2<br />7(b)</TableCell>
                <TableCell>Name<br />9(a)</TableCell>
                <TableCell>Year<br />9(b)</TableCell>
                <TableCell>Graduate<br />10(a)</TableCell>
                <TableCell>PG<br />10(b)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, index) => (
                <TableRow key={index}>
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
                  <TableCell>{student.activity}</TableCell>
                  <TableCell>{student.position}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!submitted && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
              Submit to Database
            </Button>
          )}
        </Paper>
      )}

      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
    </Container>
  );
}

export default UploadForm;
