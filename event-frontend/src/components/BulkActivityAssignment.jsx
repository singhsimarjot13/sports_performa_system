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
  Checkbox,
  Autocomplete
} from '@mui/material';

const POSITION_OPTIONS = [
  { value: '1st', label: '1st' },
  { value: '2nd', label: '2nd' },
  { value: '3rd', label: '3rd' },
  { value: 'Participated', label: 'Participated' }
];

function BulkActivityAssignment() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activities, setActivities] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch regular students
      const regularStudentsUrl = searchTerm
        ? `http://localhost:5000/api/students?universityRegNo=${searchTerm}`
        : `http://localhost:5000/api/students`;
      const regularStudentsRes = await fetch(regularStudentsUrl);
      if (!regularStudentsRes.ok) throw new Error('Failed to fetch regular students');
      const regularStudents = await regularStudentsRes.json();
      const regularStudentsArray = Array.isArray(regularStudents) ? regularStudents : [regularStudents];

      // Fetch interyear students
      const interyearStudentsUrl = searchTerm
        ? `http://localhost:5000/api/interyear-students?urn=${searchTerm}`
        : `http://localhost:5000/api/interyear-students`;
      const interyearStudentsRes = await fetch(interyearStudentsUrl);
      if (!interyearStudentsRes.ok) throw new Error('Failed to fetch interyear students');
      const interyearStudents = await interyearStudentsRes.json();
      const interyearStudentsArray = Array.isArray(interyearStudents) ? interyearStudents : [interyearStudents];

      // Format regular students
      const formattedRegularStudents = regularStudentsArray.map(student => ({
        ...student,
        isRegular: true,
        displayUrn: student.universityRegNo,
        displayBranch: student.branchYear
      }));

      // Format interyear students
      const formattedInteryearStudents = interyearStudentsArray.map(student => ({
        ...student,
        isRegular: false,
        displayUrn: student.urn,
        displayBranch: student.branch
      }));

      // Combine both arrays
      const allStudents = [...formattedRegularStudents, ...formattedInteryearStudents];
      setStudents(allStudents);

      // Extract unique activities
      const uniqueActivities = new Set();
      allStudents.forEach(student => {
        if (student.events && Array.isArray(student.events)) {
          student.events.forEach(event => {
            if (event && event.activity) {
              uniqueActivities.add(event.activity);
            }
          });
        }
      });

      const activitiesList = Array.from(uniqueActivities).sort();
      setActivities(activitiesList.map(activity => ({
        _id: activity,
        name: activity
      })));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Only select students that are currently visible in the filtered list
      setSelectedStudents(filteredStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudents(prev => {
      const studentKey = student.isRegular 
        ? `reg-${student.universityRegNo}`
        : `int-${student.urn || student.crn}`;
      
      const exists = prev.some(s => {
        const prevKey = s.isRegular 
          ? `reg-${s.universityRegNo}`
          : `int-${s.urn || s.crn}`;
        return prevKey === studentKey;
      });

      if (exists) {
        return prev.filter(s => {
          const prevKey = s.isRegular 
            ? `reg-${s.universityRegNo}`
            : `int-${s.urn || s.crn}`;
          return prevKey !== studentKey;
        });
      } else {
        return [...prev, student];
      }
    });
  };

  const handleBulkUpdate = async () => {
    if (!selectedPosition || !selectedActivity) {
      setError('Please select both activity and position');
      return;
    }

    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    try {
      const updatePromises = selectedStudents.map(async student => {
        console.log('Processing student:', {
          name: student.name,
          crn: student.crn,
          urn: student.urn,
          isRegular: student.isRegular,
          _id: student._id
        });

        // Create the new event object
        const newEvent = {
          activity: selectedActivity,
          position: selectedPosition
        };

        // Ensure events array exists and is an array
        const currentEvents = Array.isArray(student.events) ? student.events : [];
        
        // Check if the event already exists
        const eventExists = currentEvents.some(event => 
          event.activity === selectedActivity && event.position === selectedPosition
        );

        if (eventExists) {
          console.log('Event already exists for student:', student.name);
          return; // Skip this student
        }

        // For interyear students, use the student's ID in the URL
        const endpoint = student.isRegular 
          ? `http://localhost:5000/api/students/${student._id}`
          : `http://localhost:5000/api/interyear-students/${student._id}`;

        // For interyear students, ensure we have all required fields
        const requestBody = student.isRegular
          ? {
              events: [...currentEvents, newEvent]
            }
          : {
              name: student.name,
              urn: student.urn || '',
              crn: student.crn || '',
              branch: student.branch || '',
              email: student.email || '',
              events: [...currentEvents, newEvent]
            };

        console.log('Sending request to:', endpoint);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        try {
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          const responseData = await response.json();

          if (!response.ok) {
            console.error('Update failed for student:', student.name);
            console.error('Response status:', response.status);
            console.error('Error data:', responseData);
            console.error('Request body:', requestBody);
            throw new Error(`Failed to update student ${student.name}: ${responseData?.message || response.statusText}`);
          }

          console.log('Successfully updated student:', student.name);
          return response;
        } catch (fetchError) {
          console.error('Fetch error for student:', student.name, fetchError);
          throw fetchError;
        }
      });

      await Promise.all(updatePromises);
      setMessage('Activities and positions added successfully');
      setSelectedPosition('');
      setSelectedActivity('');
      setSelectedStudents([]);
      fetchStudents(); // Refresh the list
    } catch (err) {
      console.error('Bulk update error:', err);
      setError(err.message);
    }
  };

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    if (searchType === 'name') {
      return student.name.toLowerCase().includes(searchLower);
    } else {
      return student.displayUrn.toLowerCase().includes(searchLower);
    }
  });

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bulk Activity Assignment
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
          <Autocomplete
            freeSolo
            options={activities.map(activity => activity.name)}
            value={selectedActivity}
            onChange={(event, newValue) => {
              setSelectedActivity(newValue || '');
            }}
            onInputChange={(event, newValue) => {
              setSelectedActivity(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Activity"
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />

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
            disabled={!selectedPosition || !selectedActivity || selectedStudents.length === 0}
            sx={{ minWidth: 200 }}
          >
            Add to Selected ({selectedStudents.length})
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    onChange={handleSelectAll}
                    checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>URN</TableCell>
                <TableCell>CRN</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Current Events</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((student) => {
                const studentKey = student.isRegular 
                  ? `reg-${student.universityRegNo}`
                  : `int-${student.urn || student.crn}`;
                
                return (
                  <TableRow key={studentKey}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedStudents.some(s => {
                          const selectedKey = s.isRegular 
                            ? `reg-${s.universityRegNo}`
                            : `int-${s.urn || s.crn}`;
                          return selectedKey === studentKey;
                        })}
                        onChange={() => handleSelectStudent(student)}
                      />
                    </TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.displayUrn}</TableCell>
                    <TableCell>{student.crn}</TableCell>
                    <TableCell>{student.displayBranch}</TableCell>
                    <TableCell>
                      {student.events && student.events.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {student.events.map((event, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                alignItems: 'center',
                                fontSize: '0.875rem'
                              }}
                            >
                              <span style={{ fontWeight: 'bold' }}>{event.activity}:</span>
                              <span>{event.position}</span>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <span style={{ color: 'gray' }}>No events</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default BulkActivityAssignment; 