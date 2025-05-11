import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import UploadForm from './components/Uploadform';
import Fetch from './components/fetch';
import Overall from './components/overall_fetch';
import ManualEntryForm from './components/ManualEntryForm';
import StudentUpload from './components/StudentUpload';
import InteryearStudents from './components/InteryearStudents';
import InteryearManualEntry from './components/InteryearManualEntry';
import PendingPositions from './components/PendingPositions';
import BulkActivityAssignment from './components/BulkActivityAssignment';

const navLinks = [
  { to: '/', label: 'Upload' },
  { to: '/fetch', label: 'Fetch' },
  { to: '/form', label: 'Form' },
  { to: '/overall', label: 'Overall' },
  { to: '/student-upload', label: 'Student Upload' },
  { to: '/interyear-students', label: 'Interyear Students' },
  { to: '/interyear-manual', label: 'Interyear Manual Entry' },
  { to: '/pending-positions', label: 'Pending Positions' },
  { to: '/bulk-activity', label: 'Bulk Activity' },
];

function App() {
  const location = useLocation();
  return (
    <div>
      <nav className="app-nav">
        <div className="app-nav-inner">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={
                'app-nav-link' + (location.pathname === link.to ? ' active' : '')
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="app-main">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<UploadForm />} />
          <Route path="/fetch" element={<Fetch />} />
          <Route path="/form" element={<ManualEntryForm />} />
          <Route path="/overall" element={<Overall />} />
          <Route path="/student-upload" element={<StudentUpload />} />
          <Route path="/interyear-students" element={<InteryearStudents />} />
          <Route path="/interyear-manual" element={<InteryearManualEntry />} />
          <Route path="/pending-positions" element={<PendingPositions />} />
          <Route path="/bulk-activity" element={<BulkActivityAssignment />} />
        </Routes>
      </main>
    </div>
  );
}

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
