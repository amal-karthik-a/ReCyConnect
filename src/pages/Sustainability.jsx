import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/sustainability.css';

function Sustainability() {
  const [showPopup, setShowPopup] = useState(null);
  const [sdgProgress, setSdgProgress] = useState({});
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
            el.style.animation = 'bounceIn 0.5s ease-in';
          }, index * 200);
        }
      });
    };
    window.addEventListener('scroll', animateElements);
    animateElements();
    return () => window.removeEventListener('scroll', animateElements);
  }, []);

  const sdgGoals = [
    { id: 1, title: 'No Poverty', color: '#E5243B', meaning: 'Help everyone have a home and food.', explanation: 'Share and recycle to help!', future: 'No poverty by 2030.' },
    { id: 2, title: 'Zero Hunger', color: '#DDA63A', meaning: 'Make sure everyone has food.', explanation: 'Grow and share healthy food.', future: 'No hunger by 2030.' },
    { id: 3, title: 'Good Health', color: '#4C9F38', meaning: 'Keep everyone healthy.', explanation: 'Clean air helps us stay well.', future: 'Health for all by 2030.' },
    { id: 4, title: 'Quality Education', color: '#C5192D', meaning: 'Help kids learn.', explanation: 'Learning saves the planet!', future: 'School for all by 2030.' },
    { id: 5, title: 'Gender Equality', color: '#FF3A21', meaning: 'Treat everyone fairly.', explanation: 'Boys and girls help together!', future: 'Fairness by 2030.' },
    { id: 6, title: 'Clean Water', color: '#26BDE2', meaning: 'Give everyone clean water.', explanation: 'Save water for rivers!', future: 'Clean water by 2030.' },
    { id: 7, title: 'Affordable Energy', color: '#FCC30B', meaning: 'Use clean energy.', explanation: 'Solar power helps Earth!', future: 'Green energy by 2030.' },
    { id: 8, title: 'Decent Work', color: '#A21942', meaning: 'Good jobs for all.', explanation: 'Green jobs save the planet.', future: 'Jobs for all by 2030.' },
    { id: 9, title: 'Industry Innovation', color: '#FD6925', meaning: 'Make cool green tech.', explanation: 'New ideas help Earth!', future: 'Green tech by 2030.' },
    { id: 10, title: 'Reduced Inequalities', color: '#DD1367', meaning: 'Be fair to everyone.', explanation: 'Share to help all!', future: 'Equality by 2030.' },
    { id: 11, title: 'Sustainable Cities', color: '#FD9D24', meaning: 'Make cities green.', explanation: 'Clean cities are fun!', future: 'Green cities by 2030.' },
    { id: 12, title: 'Responsible Consumption', color: '#BF8B2E', meaning: 'Use things wisely.', explanation: 'Recycle to save Earth!', future: 'Smart choices by 2030.' },
    { id: 13, title: 'Climate Action', color: '#3F7E44', meaning: 'Protect the planet.', explanation: 'Plant trees to cool Earth!', future: 'Save climate by 2030.' },
    { id: 14, title: 'Life Below Water', color: '#0A97D9', meaning: 'Save the oceans.', explanation: 'Keep oceans clean!', future: 'Healthy oceans by 2030.' },
    { id: 15, title: 'Life on Land', color: '#56C02B', meaning: 'Protect animals and trees.', explanation: 'Plant trees for animals!', future: 'Green land by 2030.' },
    { id: 16, title: 'Peace and Justice', color: '#00689D', meaning: 'Make the world fair.', explanation: 'Work together for peace!', future: 'Peace for all by 2030.' },
    { id: 17, title: 'Partnerships', color: '#19486A', meaning: 'Work together.', explanation: 'Team up to save Earth!', future: 'Global teamwork by 2030.' },
  ];

  const toggleSdgCompletion = (id) => {
    setSdgProgress(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    console.log(`Toggled completion for SDG ${id}: ${!sdgProgress[id]}`);
  };

  const progressPercentage = (Object.values(sdgProgress).filter(v => v).length / 17) * 100;

  return (
    <div className="sustainability-container">
      <header className="sustainability-header animate-on-scroll">
        <h1>🌍 Green Today, Thriving Tomorrow!</h1>
        <p>Explore the 17 Goals to Save the Planet!</p>
        <Link to="/school-register" className="school-registration">
          <span>🏫 School Registration</span>
        </Link>
        <button
          className="go-green-button-top"
          onClick={() => navigate('/go-green')}
        >
          Start Your Green Adventure!
        </button>
      </header>
      <div className="progress-section animate-on-scroll">
        <h2>Your Progress 🌟</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          >
            {Math.round(progressPercentage)}%
          </div>
        </div>
        <p>
          {Object.values(sdgProgress).filter(v => v).length} of 17 Goals Learned!
        </p>
      </div>
      <div className="sustainability-content">
        <div className="sdg-grid animate-on-scroll">
          {sdgGoals.map(goal => (
            <div
              key={goal.id}
              className="sdg-card"
              style={{ backgroundColor: goal.color }}
              onMouseEnter={(e) => (e.currentTarget.querySelector('.hover-info').style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.querySelector('.hover-info').style.opacity = '0')}
            >
              <h3>{goal.id} {goal.title}</h3>
              <div className="hover-info">
                <p>{goal.meaning}</p>
              </div>
              <button
                onClick={() => {
                  setShowPopup(goal.id);
                  if (!sdgProgress[goal.id]) toggleSdgCompletion(goal.id);
                }}
                aria-label={`Learn about ${goal.title}`}
              >
                {sdgProgress[goal.id] ? '🌟 Learned!' : 'Learn More'}
              </button>
            </div>
          ))}
        </div>
        <div className="sustainability-options animate-on-scroll">
          <div className='GameBtn'>
            <a href='' className='PlayBtn'>Play</a>
          </div>
        </div>
      </div>
      <footer className="sustainability-footer animate-on-scroll">
        <p>© 2025 RecyConnect | Green Today, Thriving Tomorrow!</p>
      </footer>
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{sdgGoals.find(g => g.id === showPopup).title}</h3>
            <p><strong>What It Means:</strong> {sdgGoals.find(g => g.id === showPopup).meaning}</p>
            <p><strong>Why It Matters:</strong> {sdgGoals.find(g => g.id === showPopup).explanation}</p>
            <p><strong>Our Goal:</strong> {sdgGoals.find(g => g.id === showPopup).future}</p>
            <p><strong>You Earned:</strong> 🌟 A Star!</p>
            <button onClick={() => setShowPopup(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sustainability;