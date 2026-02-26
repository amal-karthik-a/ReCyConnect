import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from './../../FirebaseConfig/firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import '../styles/SchoolReg.css';

function SchoolRegister() {
  const [formData, setFormData] = useState({ schoolName: '', location: '', adminEmail: '', contactNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFormData(prev => ({ ...prev, adminEmail: user.email }));

    const fetchSchools = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, 'schoolRegistrations'));
        const userSchools = schoolsSnapshot.docs
          .filter(doc => doc.data().adminEmail === user.email)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        setSchools(userSchools);
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError('Failed to load registered schools.');
      }
    };
    fetchSchools();
  }, [user, navigate]);

  // Fetch students for the selected school
  const handleSchoolClick = async (schoolId) => {
    if (selectedSchool === schoolId) {
      setSelectedSchool(null);
      setStudents([]);
      return;
    }
    setSelectedSchool(schoolId);
    try {
      const schoolDoc = await getDocs(collection(db, 'schools'));
      const school = schoolDoc.docs.find(doc => doc.id === schoolId);
      if (school && school.data().studentAccounts) {
        setStudents(school.data().studentAccounts);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student details.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Please log in to register a school.');
      setLoading(false);
      return;
    }

    try {
      const schoolId = Date.now().toString(); // Simple ID generation, replace with UUID if needed
      const schoolRef = doc(db, 'schoolRegistrations', schoolId);
      await setDoc(schoolRef, {
        schoolName: formData.schoolName,
        location: formData.location,
        adminEmail: user.email,
        contactNumber: formData.contactNumber,
        createdAt: new Date().toISOString(),
      });
      setSchools([...schools, { id: schoolId, ...formData, adminEmail: user.email, createdAt: new Date().toISOString() }]);
      navigate('/school-dashboard');
    } catch (err) {
      setError('Failed to register school. Please try again or check your permissions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="school-register-container">
      <header className="school-register-header">
        <h1>🏫 School Registration</h1>
        <p>Join the Go Green Initiative</p>
      </header>
      <div className="school-register-content">
        <form onSubmit={handleSubmit} className="school-register-form">
          <div className="form-group">
            <label htmlFor="schoolName">School Name</label>
            <input
              type="text"
              id="schoolName"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="adminEmail">Admin Email</label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={formData.adminEmail}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register School'}
          </button>
        </form>
        <div className="registered-schools">
          <h2>Registered Schools</h2>
          <div className="school-cards">
            {schools.length > 0 ? (
              schools.map(school => (
                <div
                  key={school.id}
                  className={`school-card ${selectedSchool === school.id ? 'selected' : ''}`}
                  onClick={() => handleSchoolClick(school.id)}
                >
                  <h3>{school.schoolName}</h3>
                  <p>Location: {school.location}</p>
                  <p>Contact: {school.contactNumber}</p>
                </div>
              ))
            ) : (
              <p>No schools registered yet.</p>
            )}
          </div>
          {selectedSchool && (
            <div className="student-details">
              <h3>Students for {schools.find(s => s.id === selectedSchool)?.schoolName}</h3>
              {students.length > 0 ? (
                <ul>
                  {students.map((student, index) => (
                    <li key={index}>
                      <p>Name: {student.name}</p>
                      <p>Email: {student.email}</p>
                      <p>Class: {student.class}</p>
                      <p>Progress: {student.progress || 0}%</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No students registered for this school.</p>
              )}
            </div>
          )}
        </div>
        <div className="school-register-options">
          <Link to="/sustainability" className="back-button">
            Back to Sustainability
          </Link>
        </div>
      </div>
      <footer className="school-register-footer">
        <p>© 2025 RecyConnect | Powered by Innovative Tech</p>
      </footer>
    </div>
  );
}

export default SchoolRegister;