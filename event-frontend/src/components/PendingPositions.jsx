import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  TextField,
  Grid,
  Checkbox
} from '@mui/material';

const POSITION_OPTIONS = [
  { value: '1st', label: '1st' },
  { value: '2nd', label: '2nd' },
  { value: '3rd', label: '3rd' },
  { value: 'Participated', label: 'Participated' }
];

function PendingPositions() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'urn'
  const [selectedStudents, setSelectedStudents] = useState([]);

  const fetchPendingStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/students/pending-positions');
      if (!response.ok) throw new Error('Failed to fetch students with pending positions');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handlePositionUpdate = async (studentId, activity, isInteryear = false) => {
    if (!selectedPosition) {
      setError('Please select a position first');
      return;
    }

    try {
      const endpoint = isInteryear 
        ? `http://localhost:5000/api/interyear-students/${studentId}/update-position`
        : `http://localhost:5000/api/students/${studentId}/update-position`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity,
          position: selectedPosition
        }),
      });

      if (!response.ok) throw new Error('Failed to update position');

      setMessage('Position updated successfully');
      setSelectedPosition('');
      fetchPendingStudents(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    if (searchType === 'name') {
      return student.name.toLowerCase().includes(searchLower);
    } else {
      const urn = student.urn || student.universityRegNo || '';
      return urn.toLowerCase().includes(searchLower);
    }
  });

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allStudents = filteredStudents.flatMap(student => 
        student.events
          .filter(event => event.position === 'Pending')
          .map(event => ({
            studentId: student._id,
            activity: event.activity,
            isInteryear: !student.universityRegNo
          }))
      );
      setSelectedStudents(allStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId, activity, isInteryear) => {
    const studentKey = `${studentId}-${activity}`;
    setSelectedStudents(prev => {
      const exists = prev.some(s => s.studentId === studentId && s.activity === activity);
      if (exists) {
        return prev.filter(s => !(s.studentId === studentId && s.activity === activity));
      } else {
        return [...prev, { studentId, activity, isInteryear }];
      }
    });
  };

  const handleBulkUpdate = async () => {
    if (!selectedPosition) {
      setError('Please select a position first');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      const updatePromises = selectedStudents.map(student => {
        const endpoint = student.isInteryear 
          ? `http://localhost:5000/api/interyear-students/${student.studentId}/update-position`
          : `http://localhost:5000/api/students/${student.studentId}/update-position`;

        return fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity: student.activity,
            position: selectedPosition
          }),
        });
      });

      await Promise.all(updatePromises);
      setMessage('Positions updated successfully');
      setSelectedPosition('');
      setSelectedStudents([]);
      fetchPendingStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Students with Pending Positions
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                label="Search By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="urn">URN</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={`Search by ${searchType === 'name' ? 'Name' : 'URN'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              margin="normal"
            />
          </Grid>
        </Grid>

        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Position</InputLabel>
            <Select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              label="Position"
            >
              {POSITION_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleBulkUpdate}
            disabled={!selectedPosition || selectedStudents.length === 0}
          >
            Update Selected ({selectedStudents.length})
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={handleSelectAll}
                    checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.flatMap(s => s.events.filter(e => e.position === 'Pending')).length}
                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.flatMap(s => s.events.filter(e => e.position === 'Pending')).length}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>URN</TableCell>
                <TableCell>CRN</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Current Position</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student, index) => (
                student.events
                  .filter(event => event.position === 'Pending')
                  .map((event, eventIndex) => (
                    <TableRow key={`${index}-${eventIndex}`}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedStudents.some(s => s.studentId === student._id && s.activity === event.activity)}
                          onChange={() => handleSelectStudent(student._id, event.activity, !student.universityRegNo)}
                        />
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.urn || student.universityRegNo}</TableCell>
                      <TableCell>{student.crn}</TableCell>
                      <TableCell>{student.branch || student.branchYear}</TableCell>
                      <TableCell>{event.activity}</TableCell>
                      <TableCell>{event.position}</TableCell>
                    </TableRow>
                  ))
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default PendingPositions; 