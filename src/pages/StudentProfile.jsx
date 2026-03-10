import React, { useState, useEffect } from 'react';
import { db, auth } from './../../FirebaseConfig/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/studentProfile.css';

function StudentProfile() {
  const { studentEmail } = useParams();
  const [student, setStudent] = useState(null);
  const [missions, setMissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!auth.currentUser || auth.currentUser.email !== studentEmail) navigate('/login');
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      for (const schoolDoc of schoolsSnapshot.docs) {
        const studentAccount = schoolDoc.data().studentAccounts.find(s => s.email === studentEmail);
        if (studentAccount) {
          setStudent(studentAccount);
          setMissions([
            { id: 1, title: 'Plant a Tree', completed: false },
            { id: 2, title: 'Reduce Waste', completed: false }
          ]); // Placeholder missions
          break;
        }
      }
    };
    fetchStudentData();
  }, [studentEmail, navigate]);

  const handleMissionComplete = async (missionId) => {
    if (!student) return;
    const updatedMissions = missions.map(m => 
      m.id === missionId ? { ...m, completed: true } : m
    );
    const schoolDoc = (await getDocs(collection(db, 'schools'))).docs.find(doc => 
      doc.data().studentAccounts.some(s => s.email === studentEmail)
    );
    if (schoolDoc) {
      const studentIndex = schoolDoc.data().studentAccounts.findIndex(s => s.email === studentEmail);
      const updatedStudents = [...schoolDoc.data().studentAccounts];
      updatedStudents[studentIndex] = { ...updatedStudents[studentIndex], missions: updatedMissions, progress: 50 }; // Update progress
      await updateDoc(doc(db, 'schools', schoolDoc.id), { studentAccounts: updatedStudents });
      setMissions(updatedMissions);
    }
  };

  return (
    <div className="student-profile-container">
      <h2>My Profile</h2>
      {student && (
        <div className="profile-details">
          <p>Name: {student.name}</p>
          <p>Class: {student.class}</p>
          <p>Progress: {student.progress}%</p>
        </div>
      )}
      <div className="missions-list">
        <h3>Missions</h3>
        {missions.map(mission => (
          <div key={mission.id} className="mission-card">
            <p>{mission.title}</p>
            {!mission.completed && (
              <button onClick={() => handleMissionComplete(mission.id)}>Complete</button>
            )}
            {mission.completed && <p>Completed! ✅</p>}
          </div>
        ))}
      </div>
      <div className="progress-graph">
        <p>Graph Placeholder (Progress: {student?.progress || 0}%)</p>
      </div>
    </div>
  );
}

export default StudentProfile;