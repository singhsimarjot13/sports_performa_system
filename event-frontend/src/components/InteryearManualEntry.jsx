import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Box,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const POSITION_OPTIONS = [
  { value: '1st', label: '1st' },
  { value: '2nd', label: '2nd' },
  { value: '3rd', label: '3rd' },
  { value: 'Participated', label: 'Participated' },
  { value: 'Pending', label: 'Pending' }
];

function InteryearManualEntry() {
  const [formData, setFormData] = useState({
    name: '',
    urn: '',
    branch: '',
    crn: '',
    email: '',
    activities: [{ activity: '', position: '' }]
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingStudent, setIsExistingStudent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActivityChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.map((activity, i) => 
        i === index ? { ...activity, [field]: value } : activity
      )
    }));
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { activity: '', position: '' }]
    }));
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const fetchStudentData = async (identifier, type) => {
    if (!identifier) {
      setIsExistingStudent(false);
      setFormData(prev => ({
        ...prev,
        activities: [{ activity: '', position: '' }]
      }));
      return;
    }
    
    setIsLoading(true);
    try {
      // Only fetch from interyear-students endpoint
      const response = await fetch(`http://localhost:5000/api/interyear-students/by-${type}?${type}=${identifier}`);
      
      // If student not found in interyear model, reset form
      if (!response.ok || response.status === 404) {
        setIsExistingStudent(false);
        setFormData(prev => ({
          ...prev,
          name: prev.name,
          urn: prev.urn,
          branch: prev.branch,
          crn: prev.crn,
          email: prev.email,
          activities: [{ activity: '', position: '' }]
        }));
        return;
      }

      const data = await response.json();
      console.log('Fetched interyear student data:', data); // Debug log
      
      // Only proceed if we got valid data from interyear model
      if (!data || !data.urn) {
        setIsExistingStudent(false);
        return;
      }
      
      // Format activities from events array
      const activities = data.events && Array.isArray(data.events) 
        ? data.events.map(event => ({
            activity: event.activity,
            position: event.position
          }))
        : [{ activity: '', position: '' }];

      console.log('Formatted activities:', activities); // Debug log

      setFormData(prev => ({
        ...prev,
        name: data.name || '',
        branch: data.branch || '',
        crn: data.crn || '',
        email: data.email || '',
        urn: data.urn || '',
        activities: activities
      }));
      setIsExistingStudent(true);
    } catch (err) {
      console.error('Error fetching interyear student:', err);
      setIsExistingStudent(false);
      setFormData(prev => ({
        ...prev,
        activities: [{ activity: '', position: '' }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.urn) {
        fetchStudentData(formData.urn, 'urn');
      } else if (formData.crn) {
        fetchStudentData(formData.crn, 'crn');
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.urn, formData.crn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      // For existing students, update with new activities
      if (isExistingStudent) {
        const response = await fetch(`http://localhost:5000/api/interyear-students`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urn: formData.urn,
            crn: formData.crn,
            events: formData.activities.map(activity => ({
              activity: activity.activity,
              position: activity.position
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update student');
        }

        setMessage('Student updated successfully');
      } else {
        // For new students, submit with all activities
        const response = await fetch('http://localhost:5000/api/interyear-students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            events: formData.activities.map(activity => ({
              activity: activity.activity,
              position: activity.position
            }))
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add student');
        }

        setMessage('Student added successfully');
      }

      // Reset form
      setFormData({
        name: '',
        urn: '',
        branch: '',
        crn: '',
        email: '',
        activities: [{ activity: '', position: '' }]
      });
      setIsExistingStudent(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manual Interyear Student Entry
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URN"
                name="urn"
                value={formData.urn}
                onChange={handleChange}
                margin="normal"
                helperText="Enter URN to auto-fill student details"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CRN"
                name="crn"
                value={formData.crn}
                onChange={handleChange}
                margin="normal"
                helperText="Enter CRN to auto-fill student details"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Activities
          </Typography>

          {formData.activities.map((activity, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  required
                  label="Activity"
                  value={activity.activity}
                  onChange={(e) => handleActivityChange(index, 'activity', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={5}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={activity.position}
                    onChange={(e) => handleActivityChange(index, 'position', e.target.value)}
                    label="Position"
                  >
                    {POSITION_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2}>
                {index === formData.activities.length - 1 ? (
                  <IconButton onClick={addActivity} color="primary">
                    <AddIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={() => removeActivity(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Grid>
            </Grid>
          ))}

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isExistingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default InteryearManualEntry; 