import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './../../FirebaseConfig/firebase';
import './../styles/GoGreen.css';

function GoGreen() {
  const [missionProgress, setMissionProgress] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const animateElements = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight) {
          setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 200);
        }
      });
    };

    window.addEventListener('scroll', animateElements);
    animateElements();
    return () => window.removeEventListener('scroll', animateElements);
  }, []);

  const missions = [
    { id: 1, title: 'Reduce Waste', sdgId: 12, description: 'Collect and recycle 1kg of waste this month.', target: '1kg' },
    { id: 2, title: 'Plant a Tree', sdgId: 15, description: 'Plant a tree or support a reforestation project.', target: '1 tree' },
    { id: 3, title: 'Save Water', sdgId: 6, description: 'Reduce water usage by 10 liters daily for a week.', target: '70L' },
    { id: 4, title: 'Educate Others', sdgId: 4, description: 'Teach 5 friends about an SDG.', target: '5 people' },
  ];

  const toggleMissionCompletion = (id) => {
    setMissionProgress(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    // Note: In a real app, this would update a database (e.g., Firebase) to persist progress
    console.log(`Toggled completion for Mission ${id}: ${!missionProgress[id]}`);
  };

  const completedMissions = Object.keys(missionProgress).filter(id => missionProgress[id]).length;
  const totalMissions = missions.length;
  const isCertificateEarned = completedMissions === totalMissions;

  return (
    <div className="go-green-container">
      <header className="go-green-header animate-on-scroll">
        <h1>🌱 Go Green Initiative</h1>
        <p>Monthly Missions for a Sustainable Future</p>
      </header>
      <div className="go-green-content">
        <div className="mission-section animate-on-scroll">
          <h2>Missions ({completedMissions}/{totalMissions} Completed)</h2>
          <div className="mission-cards">
            {missions.map(mission => (
              <div key={mission.id} className="mission-card">
                <h3>{mission.title} (SDG {mission.sdgId})</h3>
                <p>{mission.description}</p>
                <p><strong>Target:</strong> {mission.target}</p>
                <button onClick={() => toggleMissionCompletion(mission.id)}>
                  {missionProgress[mission.id] ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            ))}
          </div>
        </div>
        {isCertificateEarned && (
          <div className="certificate-section animate-on-scroll">
            <h2>Congratulations!</h2>
            <p>You’ve completed all missions. Download your certificate below:</p>
            <button className="download-button" onClick={() => alert('Certificate downloaded! (Simulated)')}>
              Download Certificate
            </button>
          </div>
        )}
        <div className="go-green-options animate-on-scroll">
          <Link to="/sustainability" className="back-button">
            Back to Sustainability
          </Link>
        </div>
      </div>
      <footer className="go-green-footer animate-on-scroll">
        <p>© 2025 RecyConnect | Powered by Innovative Tech</p>
      </footer>
    </div>
  );
}

export default GoGreen;