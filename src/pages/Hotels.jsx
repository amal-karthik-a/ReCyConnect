import React, { useState } from 'react';
import { db } from "../../FirebaseConfig/firebase";
import { collection, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const Hotels = () => {
  const [hotelName, setHotelName] = useState('');
  const [isFiveStar, setIsFiveStar] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

    try {
      let imageUrl = '';
      if (imageFile) {
        const storage = getStorage();
        const imageRef = ref(storage, `hotel_images/${user.uid}_${Date.now()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'HotelDonation'), {
        hotelName,
        isFiveStar,
        userId: user.uid,
        imageUrl,
        timestamp: new Date()
      });

      setMessage('Hotel registered successfully!');
      setHotelName('');
      setIsFiveStar(false);
      setImageFile(null);
      setImagePreview('');

      setTimeout(() => {
        setMessage('');
        navigate('/donation');
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage('Registration failed.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f9f4', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <h1 style={{ color: '#2e7d32', marginBottom: '20px' }}>Register Your Hotel</h1>
        {message && (
          <p style={{ padding: '10px', color: 'white', backgroundColor: message.includes('successfully') ? '#4caf50' : '#d32f2f', borderRadius: '5px' }}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          
          {/* 👇 Image Upload Section */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ color: '#388e3c' }}>Upload Hotel Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ marginTop: '10px' }}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Hotel Preview"
                style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              />
            )}
          </div>

          {/* 👇 Hotel Name Input */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', color: '#388e3c' }}>Hotel Name</label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              required
              placeholder="Enter hotel name"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #c8e6c9' }}
            />
          </div>

          {/* 👇 5-Star Checkbox */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label>
              <input
                type="checkbox"
                checked={isFiveStar}
                onChange={(e) => setIsFiveStar(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ color: '#388e3c' }}>Is this a 5-Star Hotel?</span>
            </label>
          </div>

          {/* 👇 Register Button */}
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px' }}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Hotels;
