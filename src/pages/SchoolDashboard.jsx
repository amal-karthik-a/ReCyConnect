import React, { useState, useEffect } from 'react';
import { db, auth } from './../../FirebaseConfig/firebase';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './../styles/schoolDash.css';

function SchoolDashboard() {
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', class: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!auth.currentUser) navigate('/login');
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolDoc = schoolsSnapshot.docs.find(doc => doc.data().adminEmail === auth.currentUser.email);
      if (schoolDoc) {
        setSchool({ id: schoolDoc.id, ...schoolDoc.data() });
        const studentsData = schoolDoc.data().studentAccounts || [];
        setStudents(studentsData);
      }
    };
    fetchSchoolData();
  }, [navigate]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!school) return;
    const student = { ...newStudent, progress: 0, missions: [] };
    const updatedStudents = [...students, student];
    await updateDoc(doc(db, 'schools', school.id), { studentAccounts: updatedStudents });
    setStudents(updatedStudents);
    setNewStudent({ name: '', class: '', email: '' });
  };

  const handleDeleteStudent = async (index) => {
    if (!school) return;
    const updatedStudents = students.filter((_, i) => i !== index);
    await updateDoc(doc(db, 'schools', school.id), { studentAccounts: updatedStudents });
    setStudents(updatedStudents);
  };

  const handleTrackProgress = (student) => {
    // Navigate to a detailed progress view or display here
    alert(`Tracking progress for ${student.name}: ${student.progress}%`);
  };

  return (
    <div className="school-dashboard-container">
      <h2>School Dashboard</h2>
      {school && (
        <div className="school-details">
          <p>School: {school.schoolName}</p>
          <p>Location: {school.place}, {school.city}, {school.country}</p>
        </div>
      )}
      <form onSubmit={handleAddStudent} className="add-student-form">
        <input
          type="text"
          value={newStudent.name}
          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
          placeholder="Student Name"
          required
        />
        <input
          type="text"
          value={newStudent.class}
          onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
          placeholder="Class (e.g., 6A)"
          required
        />
        <input
          type="email"
          value={newStudent.email}
          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
          placeholder="Email"
          required
        />
        <button type="submit">Add Student</button>
      </form>
      <div className="students-list">
        <h3>Students</h3>
        {students.map((student, index) => (
          <div key={index} className="student-card">
            <p>{student.name} - {student.class}</p>
            <p>Progress: {student.progress}%</p>
            <button onClick={() => handleTrackProgress(student)}>Track</button>
            <button onClick={() => handleDeleteStudent(index)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SchoolDashboard;