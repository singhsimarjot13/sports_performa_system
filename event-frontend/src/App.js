import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadForm from './components/Uploadform';
import Fetch from './components/fetch'
import Overall from './components/overall_fetch';
import ManualEntryForm from './components/ManualEntryForm';
import StudentUpload from './components/StudentUpload';
import InteryearStudents from './components/InteryearStudents';
import InteryearManualEntry from './components/InteryearManualEntry';
import PendingPositions from './components/PendingPositions';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <nav>
          <Link to="/" style={{ marginRight: '20px' }}>Upload</Link>
          <Link to="/fetch" style={{ marginRight: '20px' }}>Fetch</Link>
          <Link to="/form" style={{ marginRight: '20px' }}>Form</Link>
          <Link to="/overall" style={{ marginRight: '20px' }}>Overall Fetch</Link>
          <Link to="/student-upload" style={{ marginRight: '20px' }}>Student Upload</Link>
          <Link to="/interyear-students" style={{ marginRight: '20px' }}>Interyear Students</Link>
          <Link to="/interyear-manual" style={{ marginRight: '20px' }}>Interyear Manual Entry</Link>
          <Link to="/pending-positions" style={{ marginRight: '20px' }}>Pending Positions</Link>
        </nav>

        <Routes>
          <Route path="/" element={<UploadForm />} />
          <Route path="/fetch" element={<Fetch />} />
          <Route path="/form" element={<ManualEntryForm />} />
          <Route path="/overall" element={<Overall />} />
          <Route path="/student-upload" element={<StudentUpload />} />
          <Route path="/interyear-students" element={<InteryearStudents />} />
          <Route path="/interyear-manual" element={<InteryearManualEntry />} />
          <Route path="/pending-positions" element={<PendingPositions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
