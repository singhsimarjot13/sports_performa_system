import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, Paper, 
  Typography, Tabs, Tab, Box, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Grid, Chip, Stack
} from '@mui/material';

function InteryearStudents() {
  const [nonMatchingStudents, setNonMatchingStudents] = useState([]);
  const [nullUrnStudents, setNullUrnStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterType, setFilterType] = useState('crn');
  const [filterValue, setFilterValue] = useState('');
  const [newUrn, setNewUrn] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch non-matching students
      const nonMatchingResponse = await fetch('http://localhost:5000/api/interyear-students/non-matching');
      if (!nonMatchingResponse.ok) throw new Error('Failed to fetch non-matching students');
      const nonMatchingData = await nonMatchingResponse.json();
      console.log('Non-matching students data:', nonMatchingData);
      setNonMatchingStudents(Array.isArray(nonMatchingData) ? nonMatchingData : [nonMatchingData]);

      // Fetch null URN students
      const nullUrnResponse = await fetch('http://localhost:5000/api/students/null-urn');
      if (!nullUrnResponse.ok) throw new Error('Failed to fetch null URN students');
      const nullUrnData = await nullUrnResponse.json();
      console.log('Null URN students data:', nullUrnData);
      setNullUrnStudents(Array.isArray(nullUrnData) ? nullUrnData : [nullUrnData]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (student) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setFilterValue('');
    setNewUrn('');
  };

  const handleUpdateUrn = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/update-urn`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent._id,
          newUrn,
          filterType,
          filterValue
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update URN');
      }

      // Refresh the data
      await fetchStudents();
      handleCloseDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderTable = (students, isNullUrn = false) => (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>URN</TableCell>
            <TableCell>Branch</TableCell>
            <TableCell>CRN</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Events</TableCell>
            {isNullUrn && <TableCell>Action</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student, index) => {
            console.log('Rendering student:', student);
            return (
              <TableRow key={index}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.urn || student.universityRegNo}</TableCell>
                <TableCell>{student.branch || student.branchYear}</TableCell>
                <TableCell>{student.crn || '-'}</TableCell>
                <TableCell>{student.email || '-'}</TableCell>
                <TableCell>
                  {student.events && student.events.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {student.events.map((event, idx) => (
                        <Chip
                          key={idx}
                          label={`${event.position} in ${event.activity}`}
                          size="small"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    '-'
                  )}
                </TableCell>
                {isNullUrn && (
                  <TableCell>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleOpenDialog(student)}
                    >
                      Update URN
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Special Cases Students
      </Typography>
      
      {loading && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Non-Matching URNs" />
          <Tab label="Empty URNs" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        nonMatchingStudents.length > 0 ? (
          renderTable(nonMatchingStudents)
        ) : (
          !loading && <Typography>No non-matching students found.</Typography>
        )
      ) : (
        nullUrnStudents.length > 0 ? (
          renderTable(nullUrnStudents, true)
        ) : (
          !loading && <Typography>No students with empty URNs found.</Typography>
        )
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Update URN</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Filter By</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filter By"
                >
                  <MenuItem value="crn">CRN</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="branch">Branch</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Filter Value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New URN"
                value={newUrn}
                onChange={(e) => setNewUrn(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateUrn} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default InteryearStudents; 