import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadForm from './components/Uploadform';
import Fetch from './components/fetch'
import Overall from './components/overall_fetch';
import ManualEntryForm from './components/ManualEntryForm';
function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <nav>
          <Link to="/" style={{ marginRight: '20px' }}>Upload</Link>
          <Link to="/fetch" style={{ marginRight: '20px' }}>Fetch</Link>
          <Link to="/form" style={{ marginRight: '20px' }}>Form</Link>
          <Link to="/overall" style={{ marginRight: '20px' }}>Overall Fetch</Link>
          
        </nav>

        <Routes>
          <Route path="/" element={<UploadForm />} />
          <Route path="/fetch" element={<Fetch />} />
          <Route path="/form" element={<ManualEntryForm />} />
          <Route path="/overall" element={<Overall />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
