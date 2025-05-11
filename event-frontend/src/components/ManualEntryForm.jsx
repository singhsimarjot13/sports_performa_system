import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Box,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function ManualEntryForm() {
  const [formData, setFormData] = useState({
    universityRegNo: '',
    name: '',
    fatherName: '',
    dob: '',
    branchYear: '',
    matricYear: '',
    plusTwoYear: '',
    firstAdmissionYear: '',
    lastExam: '',
    lastExamYear: '',
    interCollegeGraduateYears: '',
    interCollegePgYears: '',
    interVarsityYears: '',
    addressWithPhone: '',
    signatureUrl: '',
    passportPhotoUrl: '',
    activities: [{ activity: '', position: '', isPTUTournament: false }]
  });

  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const positionOptions = ['1st', '2nd', '3rd', 'Participated', 'Pending'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActivityChange = (index, field, value) => {
    setFormData(prev => {
      const newActivities = [...prev.activities];
      newActivities[index] = {
        ...newActivities[index],
        [field]: value
      };
      return {
        ...prev,
        activities: newActivities
      };
    });
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { activity: '', position: '', isPTUTournament: false }]
    }));
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'students'); // Make sure this matches your Cloudinary preset

      const response = await fetch('https://api.cloudinary.com/v1_1/' + process.env.REACT_APP_CLOUDINARY_CLOUD_NAME + '/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      const imageUrl = data.secure_url;

      setFormData(prev => ({
        ...prev,
        [type === 'signature' ? 'signatureUrl' : 'passportPhotoUrl']: imageUrl
      }));

      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'signature') {
          setSignaturePreview(reader.result);
        } else {
          setPassportPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = (type) => {
    if (type === 'signature') {
      setSignaturePreview(null);
      setFormData(prev => ({ ...prev, signatureUrl: '' }));
    } else {
      setPassportPreview(null);
      setFormData(prev => ({ ...prev, passportPhotoUrl: '' }));
    }
  };

  const handleUrnBlur = async () => {
    if (!formData.universityRegNo) return;

    try {
      const res = await fetch(`http://localhost:5000/api/by-urn?urn=${formData.universityRegNo}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          // Convert events to activities format
          const activities = data.events ? data.events.map(event => ({
            activity: event.activity,
            position: event.position
          })) : [{ activity: '', position: '' }];

          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            fatherName: data.fatherName || '',
            dob: data.dob || '',
            branchYear: data.branchYear || '',
            matricYear: data.matricYear || '',
            plusTwoYear: data.plusTwoYear || '',
            firstAdmissionYear: data.firstAdmissionYear || '',
            lastExam: data.lastExam || '',
            lastExamYear: data.lastExamYear || '',
            interCollegeGraduateYears: data.interCollegeGraduateYears || '',
            interCollegePgYears: data.interCollegePgYears || '',
            interVarsityYears: data.interVarsityYears || '',
            addressWithPhone: data.addressWithPhone || '',
            signatureUrl: data.signatureUrl || '',
            passportPhotoUrl: data.passportPhotoUrl || '',
            activities
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching student:', err);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/manual-entry/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Preview failed');
      const data = await res.json();
      setPreviewData(data.student);
      setError('');
    } catch (err) {
      setError('Failed to generate preview');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First check if student exists
      const checkRes = await fetch(`http://localhost:5000/api/by-urn?urn=${formData.universityRegNo}`);
      const checkData = await checkRes.json();
      
      // Convert activities to events format with PTU tournament formatting
      const events = formData.activities.map(activity => ({
        activity: activity.isPTUTournament ? `PTU intercollege ${activity.activity} tournament` : activity.activity,
        position: activity.position
      }));

      // Prepare the data to send
      const studentData = {
        ...formData,
        events // Replace activities with events
      };

      let res;
      if (checkData && checkData._id) {
        // Student exists, update it
        res = await fetch(`http://localhost:5000/api/${checkData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        });
      } else {
        // Student doesn't exist, create new
        res = await fetch('http://localhost:5000/api/manual-entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit');
        return;
      }

      setMessage(data.message || 'Student data saved successfully');
      setFormData({
        universityRegNo: '',
        name: '',
        fatherName: '',
        dob: '',
        branchYear: '',
        matricYear: '',
        plusTwoYear: '',
        firstAdmissionYear: '',
        lastExam: '',
        lastExamYear: '',
        interCollegeGraduateYears: '',
        interCollegePgYears: '',
        interVarsityYears: '',
        addressWithPhone: '',
        signatureUrl: '',
        passportPhotoUrl: '',
        activities: [{ activity: '', position: '', isPTUTournament: false }]
      });
      setPreviewData(null);
      setSignaturePreview(null);
      setPassportPreview(null);
      setError('');
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>Manual Student Entry</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="University Registration Number"
              name="universityRegNo"
              value={formData.universityRegNo}
              onChange={handleChange}
              onBlur={handleUrnBlur}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
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
              label="Father's Name"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Branch/Year"
              name="branchYear"
              value={formData.branchYear}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Matric Year"
              name="matricYear"
              value={formData.matricYear}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="+2 Year"
              name="plusTwoYear"
              value={formData.plusTwoYear}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Admission Year"
              name="firstAdmissionYear"
              value={formData.firstAdmissionYear}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Exam"
              name="lastExam"
              value={formData.lastExam}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Exam Year"
              name="lastExamYear"
              value={formData.lastExamYear}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Inter College Graduate Years"
              name="interCollegeGraduateYears"
              value={formData.interCollegeGraduateYears}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Inter College PG Years"
              name="interCollegePgYears"
              value={formData.interCollegePgYears}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Inter Varsity Years"
              name="interVarsityYears"
              value={formData.interVarsityYears}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address with Phone"
              name="addressWithPhone"
              value={formData.addressWithPhone}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Activities</Typography>
            {formData.activities.map((activity, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <TextField
                  label="Activity"
                  value={activity.activity}
                  onChange={(e) => handleActivityChange(index, 'activity', e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={activity.isPTUTournament}
                      onChange={(e) => handleActivityChange(index, 'isPTUTournament', e.target.checked)}
                    />
                  }
                  label="PTU Intercollege Tournament"
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={activity.position}
                    onChange={(e) => handleActivityChange(index, 'position', e.target.value)}
                    label="Position"
                  >
                    {positionOptions.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton onClick={() => removeActivity(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1">Signature</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="signature-upload"
                  type="file"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'signature')}
                />
                <label htmlFor="signature-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                  >
                    Upload Signature
                  </Button>
                </label>
                {signaturePreview && (
                  <IconButton onClick={() => handleImageDelete('signature')}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              {signaturePreview && (
                <img
                  src={signaturePreview}
                  alt="Signature Preview"
                  style={{ maxWidth: '200px', maxHeight: '100px' }}
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1">Passport Photo</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="passport-upload"
                  type="file"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'passport')}
                />
                <label htmlFor="passport-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                  >
                    Upload Photo
                  </Button>
                </label>
                {passportPreview && (
                  <IconButton onClick={() => handleImageDelete('passport')}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              {passportPreview && (
                <img
                  src={passportPreview}
                  alt="Passport Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handlePreview} disabled={uploading}>
            Preview
          </Button>
          <Button variant="contained" color="primary" onClick={handleSubmit} disabled={uploading}>
            Submit
          </Button>
        </Box>

        {previewData && (
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>Preview</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(previewData).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {key === 'signatureUrl' || key === 'passportPhotoUrl' ? (
                        value && <img src={value} alt={key} style={{ maxWidth: 100 }} />
                      ) : key === 'activities' ? (
                        <ul>
                          {value.map((activity, index) => (
                            <li key={index}>
                              {activity.activity} - {activity.position}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        value
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}

export default ManualEntryForm;
