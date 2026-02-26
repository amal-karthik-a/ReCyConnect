import React, { useEffect, useState } from 'react';
import { db } from '../../FirebaseConfig/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const DonationPage = () => {
  const [donations, setDonations] = useState([]);
  const [history, setHistory] = useState([]);
  const [donatingHotelId, setDonatingHotelId] = useState(null);

  useEffect(() => {
    const fetchDonations = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.error("User not authenticated.");
        return;
      }

      const q = query(collection(db, 'HotelDonation'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().verifiedAt ? 'Verified' : 'Pending',
      }));

      setDonations(data);

      const historyData = data
        .filter(d => d.verifiedAt)
        .map(d => ({
          name: d.hotelName,
          date: d.verifiedAt.toDate().toLocaleString()
        }));
      setHistory(historyData);
    };

    fetchDonations();
  }, []);

  const handleDonate = async (hotelId) => {
    setDonatingHotelId(hotelId);

    setTimeout(async () => {
      const docRef = doc(db, 'HotelDonation', hotelId);
      await updateDoc(docRef, { verifiedAt: new Date() });

      setDonations(prev =>
        prev.map(h =>
          h.id === hotelId
            ? { ...h, status: 'Verified', verifiedAt: new Date() }
            : h
        )
      );

      const updated = donations.find(h => h.id === hotelId);
      setHistory(prev => [
        ...prev,
        {
          name: updated.hotelName,
          date: new Date().toLocaleString()
        }
      ]);
    }, 10000);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f9f2', minHeight: '100vh' }}>
      <h2 style={{ color: '#2e7d32', marginBottom: '30px' }}>Your Hotel Donations</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <thead style={{ backgroundColor: '#c8e6c9' }}>
          <tr>
            <th style={styles.th}>Hotel Name</th>
            <th style={styles.th}>5-Star?</th>
            <th style={styles.th}>Action</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {donations.map(hotel => (
            <tr key={hotel.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={styles.td}>{hotel.hotelName}</td>
              <td style={styles.td}>{hotel.isFiveStar ? 'Yes' : 'No'}</td>
              <td style={styles.td}>
                <button
                  onClick={() => handleDonate(hotel.id)}
                  disabled={donatingHotelId === hotel.id || hotel.status === 'Verified'}
                  style={{ ...styles.button, backgroundColor: '#4caf50' }}
                >
                  Donate
                </button>
              </td>
              <td style={{ ...styles.td, color: hotel.status === 'Verified' ? '#2e7d32' : '#f9a825', fontWeight: 'bold' }}>
                {hotel.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: '50px', color: '#2e7d32' }}>Donation History</h3>
      <div style={styles.historyBox}>
        {history.length === 0 ? (
          <p style={{ color: '#999' }}>No donations yet.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0 }}>
            {history.map((entry, index) => (
              <li key={index} style={styles.historyItem}>
                <strong>{entry.name}</strong> donated on <em>{entry.date}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  th: {
    padding: '12px 16px',
    fontSize: '1rem',
    textAlign: 'left',
    color: '#2e7d32'
  },
  td: {
    padding: '12px 16px',
    fontSize: '0.95rem'
  },
  button: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer'
  },
  historyBox: {
    marginTop: '15px',
    maxHeight: '220px',
    overflowY: 'auto',
    background: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    animation: 'fadeIn 1s ease-in'
  },
  historyItem: {
    marginBottom: '10px',
    padding: '8px',
    background: '#e8f5e9',
    borderRadius: '5px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
  }
};

export default DonationPage;
