import { Link, useNavigate } from 'react-router-dom';
import { auth } from './../../FirebaseConfig/firebase';
import { useEffect } from 'react';
import '../styles/home.css';

function Home() {
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

  const handleSignOut = () => {
    auth.signOut().then(() => navigate('/login')).catch((error) => console.error('Sign out error:', error));
  };

  return (
    <div className="home-container">
      <header className="home-header animate-on-scroll">
        <h1>♻️ RecyConnect</h1>
        <p>Manage and reduce your plastic & metal waste</p>
      </header>
      <div className="home-content">
        <div className="home-options animate-on-scroll">
          <Link to="/waterplan" className="option-card">
            <span>📦 Water Challenge</span>
            <p>Organize eco-friendly waste collection</p>
          </Link>
          <Link to="/hotel" className="option-card">
            <span>📦 Food Availability</span>
            <p>Organize eco-friendly waste collection</p>
          </Link>
          <Link to="/login" className="option-card">
            <span>📊 My Dashboard</span>
            <p>Track your sustainability impact</p>
          </Link>
          <Link to="/biowaste" className="option-card">
            <span>🌱 BioWaste Management</span>
            <p>Optimize bio-waste with AI insights</p>
          </Link>
          <Link to="/sustainability" className="option-card">
            <span>🌍 Sustainability & Schools</span>
            <p>Explore SDG missions and school programs</p>
          </Link>
          <Link to="/travel" className="option-card">
            <span>🌍 Air and Travel</span>
            <p>Explore SDG missions and school programs</p>
          </Link>
          <Link to="/detect" className="option-card">
            <span>🌍 AI Suggestions and Advice in waste Disposal</span>
            <p>Explore SDG missions and school programs</p>
          </Link>
        </div>
        <div className="home-dashboard animate-on-scroll">
          <h2>Sustainability Snapshot</h2>
          <div className="dashboard-grid">
            <div className="dashboard-item">Waste Reduced: 150kg</div>
            <div className="dashboard-item">BioWaste Managed: 50kg</div>
          </div>
        </div>
      </div>
      <footer className="home-footer animate-on-scroll">
        <p>© 2025 RecyConnect | Powered by Innovative Tech</p>
        <div className="footer-links">
          <Link to="/about">About Us</Link>
          <Link to="/contact">Get Involved</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
        </div>
      </footer>
    </div>
  );
}

export default Home;