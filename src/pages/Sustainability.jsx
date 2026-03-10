import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from './../../FirebaseConfig/firebase';
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
          }, index * 200);
        }
      });
    };

    window.addEventListener('scroll', animateElements);
    animateElements();
    return () => window.removeEventListener('scroll', animateElements);
  }, []);

  const sdgGoals = [
    { id: 1, title: 'No Poverty', emoji: '🌍', meaning: 'End poverty in all its forms.', explanation: 'Supports local economies by reducing waste.', future: 'By 2030, ensure no one is left behind.' },
    { id: 2, title: 'Zero Hunger', emoji: '🍲', meaning: 'End hunger and improve nutrition.', explanation: 'Promotes sustainable food systems.', future: 'Achieve food security by 2030.' },
    { id: 3, title: 'Good Health', emoji: '🏥', meaning: 'Ensure healthy lives.', explanation: 'Reduces pollution-related illnesses.', future: 'Universal health coverage by 2030.' },
    { id: 4, title: 'Quality Education', emoji: '📚', meaning: 'Ensure inclusive education.', explanation: 'Empowers sustainable learning.', future: 'Equal access by 2030.' },
    { id: 5, title: 'Gender Equality', emoji: '👭', meaning: 'Achieve gender equality.', explanation: 'Promotes fair resource use.', future: 'Empower all by 2030.' },
    { id: 6, title: 'Clean Water', emoji: '💧', meaning: 'Ensure water availability.', explanation: 'Reduces waste in water systems.', future: 'Safe water for all by 2030.' },
    { id: 7, title: 'Affordable Energy', emoji: '💡', meaning: 'Ensure access to energy.', explanation: 'Promotes renewable sources.', future: 'Clean energy by 2030.' },
    { id: 8, title: 'Decent Work', emoji: '💼', meaning: 'Promote economic growth.', explanation: 'Supports green jobs.', future: 'Full employment by 2030.' },
    { id: 9, title: 'Industry Innovation', emoji: '🏭', meaning: 'Build resilient infrastructure.', explanation: 'Encourages sustainable tech.', future: 'Innovation for all by 2030.' },
    { id: 10, title: 'Reduced Inequalities', emoji: '🤝', meaning: 'Reduce inequality.', explanation: 'Ensures fair resource distribution.', future: 'Equity by 2030.' },
    { id: 11, title: 'Sustainable Cities', emoji: '🏙️', meaning: 'Make cities inclusive.', explanation: 'Reduces urban waste.', future: 'Safe cities by 2030.' },
    { id: 12, title: 'Responsible Consumption', emoji: '♻️', meaning: 'Ensure sustainable consumption.', explanation: 'Promotes recycling.', future: 'Sustainable patterns by 2030.' },
    { id: 13, title: 'Climate Action', emoji: '🌱', meaning: 'Take climate action.', explanation: 'Reduces carbon footprint.', future: 'Climate resilience by 2030.' },
    { id: 14, title: 'Life Below Water', emoji: '🌊', meaning: 'Protect marine life.', explanation: 'Prevents ocean pollution.', future: 'Healthy oceans by 2030.' },
    { id: 15, title: 'Life on Land', emoji: '🌳', meaning: 'Protect terrestrial ecosystems.', explanation: 'Supports biodiversity.', future: 'Restored land by 2030.' },
    { id: 16, title: 'Peace and Justice', emoji: '⚖️', meaning: 'Promote peaceful societies.', explanation: 'Ensures fair resource use.', future: 'Justice for all by 2030.' },
    { id: 17, title: 'Partnerships', emoji: '🌐', meaning: 'Strengthen global partnerships.', explanation: 'Encourages collaboration.', future: 'Global goals by 2030.' },
  ];

  const toggleSdgCompletion = (id) => {
    setSdgProgress(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    // Note: In a real app, this would update a database (e.g., Firebase) to persist progress
    console.log(`Toggled completion for SDG ${id}: ${!sdgProgress[id]}`);
  };

  return (
    <div className="sustainability-container">
      <header className="sustainability-header animate-on-scroll">
        <h1>🌍 Sustainability & Schools</h1>
        <p>Empowering Students with the 17 SDGs</p>
      </header>
      <div className="sustainability-content">
        <div className="sdg-section animate-on-scroll">
          <h2>17 Sustainable Development Goals</h2>
          <div className="sdg-cards">
            {sdgGoals.map(goal => (
              <div key={goal.id} className="sdg-card">
                <span>{goal.emoji}</span>
                <p>{goal.title}</p>
                <button onClick={() => toggleSdgCompletion(goal.id)}>
                  {sdgProgress[goal.id] ? 'Completed' : 'Mark Complete'}
                </button>
                <button onClick={() => setShowPopup(goal.id)}>Learn More</button>
              </div>
            ))}
          </div>
        </div>
        <div className="sustainability-options animate-on-scroll">
          <Link to="/school-register" className="option-card">
            <span>🏫 School Registration</span>
            <p>Register your school for Go Green</p>
          </Link>
          <button className="go-green-button" onClick={() => navigate('/go-green')}>
            The First Step Towards Go Green
          </button>
        </div>
      </div>
      <footer className="sustainability-footer animate-on-scroll">
        <p>© 2025 RecyConnect | Powered by Innovative Tech</p>
      </footer>
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{sdgGoals.find(g => g.id === showPopup).title}</h3>
            <p><strong>Meaning:</strong> {sdgGoals.find(g => g.id === showPopup).meaning}</p>
            <p><strong>Explanation:</strong> {sdgGoals.find(g => g.id === showPopup).explanation}</p>
            <p><strong>Future Expectations:</strong> {sdgGoals.find(g => g.id === showPopup).future}</p>
            <button onClick={() => setShowPopup(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sustainability;