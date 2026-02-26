import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../../FirebaseConfig/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import './../styles/signup.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const locationState = useLocation().state?.user;

  useEffect(() => {
    if (!auth || !db) {
      console.error('Firebase not initialized');
      setError('Firebase initialization failed');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User already signed in:', user.uid);
        navigate('/waterplan');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Signup attempt with:', { email, name, age, phone, city, country, pin });

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setError('Email already taken');
      return;
    }

    try {
      console.log('Creating user in Authentication');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Authentication:', userCredential.user.uid);
      await updateProfile(userCredential.user, { displayName: name });
      console.log('Profile updated with name:', name);

      console.log('Adding user to Firestore');
      const docRef = await addDoc(usersRef, {
        uid: userCredential.user.uid,
        email,
        name,
        age: Number(age),
        phone,
        city,
        country,
        pin: Number(pin),
        createdAt: new Date().toISOString(),
      });
      console.log('User document added with ID:', docRef.id);
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', { code: error.code, message: error.message, stack: error.stack });
      setError(error.message);
    }
  };

  useEffect(() => {
    if (locationState) {
      setEmail(locationState.email);
      setName(locationState.displayName || '');
      console.log('Pre-filled from Google:', locationState.email);
    }
  }, [locationState]);

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Sign Up</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="input" required />
          </div>
          <div className="input-group">
            <label>Pin Code</label>
            <input type="number" value={pin} onChange={(e) => setPin(e.target.value)} className="input" required />
          </div>
          <button type="submit" className="button primary">Sign Up</button>
        </form>
        <p className="link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;