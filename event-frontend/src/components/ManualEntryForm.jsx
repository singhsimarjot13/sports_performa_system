import React, { useState } from 'react';

function ManualEntryForm() {
  const [urn, setUrn] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [activity, setActivity] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');

  const handleUrnBlur = async () => {
    if (!urn) return;

    try {
      const res = await fetch(`http://localhost:5000/api/students?urn=${urn}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setBranch(data.branch);
      } else {
        setName('');
        setBranch('');
      }
    } catch (err) {
      setName('');
      setBranch('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:5000/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn, name, branch, activity, position }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit');
        return;
      }

      alert(data.message);
      setUrn('');
      setName('');
      setBranch('');
      setActivity('');
      setPosition('');
      setError('');
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>URN: </label>
        <input
          value={urn}
          onChange={(e) => setUrn(e.target.value)}
          onBlur={handleUrnBlur}
          required
        />
      </div>
      <div>
        <label>Name: </label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Branch: </label>
        <input value={branch} onChange={(e) => setBranch(e.target.value)} required />
      </div>
      <div>
        <label>Activity: </label>
        <input value={activity} onChange={(e) => setActivity(e.target.value)} required />
      </div>
      <div>
        <label>Position: </label>
        <select value={position} onChange={(e) => setPosition(e.target.value)} required>
  <option value="">Select Position</option>
  <option value="1st">1st</option>
  <option value="2nd">2nd</option>
  <option value="3rd">3rd</option>
  <option value="Participated">Participated</option>
</select>

      </div>
      <button type="submit">Submit</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default ManualEntryForm;
