import React, { useState, useEffect } from 'react';
import { db } from './../../FirebaseConfig/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { parseISO, isValid } from 'date-fns';
import '../styles/TransportationSection.css';

const TransportationSection = ({ currentUser }) => {
  console.log('Component mounted, currentUser:', currentUser);
  const user = currentUser || {
    uid: 'sample-uid',
    email: 'sample@email.com', // Default email for testing
    company: 'Sample Company',
    location: 'Sample Location',
  };

  const [view, setView] = useState('home');
  const [formData, setFormData] = useState({
    capacity: '',
    schedule: '',
    location: '',
  });
  const [availableRides, setAvailableRides] = useState([]);
  const [userRides, setUserRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🚗 Fetch user's posted rides
  useEffect(() => {
    setLoading(true);
    console.log('Fetching user rides for uid:', user.uid);
    const q = query(
      collection(db, 'carpool_users'),
      where('uid', '==', user.uid),
      where('intent', '==', 'driver')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log('User rides fetched:', rides);
        setUserRides(rides);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user rides:', err);
        setError('Failed to load your rides.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  // 📅 Fetch booked rides
  useEffect(() => {
    setLoading(true);
    console.log('Fetching booked rides for riderUid:', user.uid);
    const q = query(
      collection(db, 'carpool_matches'),
      where('riderUid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log('Booked rides fetched:', rides);
        setBookedRides(rides);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching booked rides:', err);
        setError('Failed to load booked rides.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  // 🔍 Fetch all available rides by others
  useEffect(() => {
    if (view === 'find' && user.company && user.location) {
      setLoading(true);
      setError(null);
      console.log('Fetching available rides for company:', user.company, 'location:', user.location);
      const q = query(
        collection(db, 'carpool_users'),
        where('intent', '==', 'driver'),
        where('company', '==', user.company),
        where('location', '==', user.location)
      );
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          try {
            console.log('Snapshot received, docs count:', snapshot.docs.length);
            if (snapshot.docs.length === 0) {
              console.log('No documents found in snapshot');
              setAvailableRides([]);
              setLoading(false);
              return;
            }

            const rides = [];
            for (const doc of snapshot.docs) {
              try {
                const rideData = { id: doc.id, ...doc.data() };
                console.log('Processing ride:', rideData);
                if (!rideData.capacity || rideData.capacity < 0) {
                  console.warn('Invalid capacity for ride', rideData.id, ':', rideData.capacity);
                  continue;
                }
                const bookingQuery = query(
                  collection(db, 'carpool_matches'),
                  where('driverUid', '==', rideData.uid),
                  where('schedule', '==', rideData.schedule),
                  where('location', '==', rideData.location)
                );
                const bookingSnapshot = await getDocs(bookingQuery);
                const bookingCount = bookingSnapshot.size;
                console.log('Booking count for ride', rideData.id, ':', bookingCount);
                rides.push({ ...rideData, bookingCount, capacityLeft: rideData.capacity - bookingCount });
              } catch (innerErr) {
                console.error('Error processing individual ride:', innerErr);
              }
            }

            console.log('Raw rides fetched:', rides);
            const filteredRides = rides.filter(ride => ride.uid !== user.uid && ride.owner !== user.email);
            console.log('Filtered available rides:', filteredRides);
            setAvailableRides(filteredRides);
          } catch (err) {
            console.error('Error processing available rides:', err);
            setError('Failed to process available rides.');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('Snapshot error for available rides:', err);
          setError('Failed to load available rides.');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setAvailableRides([]);
      setLoading(false);
    }
  }, [view, user]);

  // 📜 Fetch history of all past bookings
  useEffect(() => {
    setLoading(true);
    console.log('Fetching history for riderUid:', user.uid);
    const q = query(
      collection(db, 'carpool_matches'),
      where('riderUid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rides = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log('History fetched:', rides);
        setHistory(rides);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching history:', err);
        setError('Failed to load booking history.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user.uid]);

  // 🛠️ Share a new ride
  const handleShareRide = async (e) => {
    e.preventDefault();
    if (!isValid(parseISO(formData.schedule))) {
      alert('Invalid schedule format. Use YYYY-MM-DDTHH:MM:SS.');
      return;
    }
    const newRide = await addDoc(collection(db, 'carpool_users'), {
      uid: user.uid,
      owner: user.email, // Set owner to current logged-in user's email
      intent: 'driver',
      capacity: parseInt(formData.capacity, 10) || 1,
      schedule: formData.schedule,
      location: formData.location,
      company: user.company,
      createdAt: new Date().toISOString(),
    });
    setUserRides([...userRides, {
      id: newRide.id,
      uid: user.uid,
      owner: user.email, // Set owner to current logged-in user's email
      intent: 'driver',
      capacity: parseInt(formData.capacity, 10) || 1,
      schedule: formData.schedule,
      location: formData.location,
      company: user.company,
      createdAt: new Date().toISOString(),
    }]);
    setFormData({ capacity: '', schedule: '', location: '' });
    setView('home');
    alert('Ride shared successfully!');
  };

  // 🚘 Book a ride
  const handleBookRide = async (ride) => {
    const bookingRef = await addDoc(collection(db, 'carpool_matches'), {
      riderUid: user.uid,
      driverUid: ride.uid,
      schedule: ride.schedule,
      location: ride.location,
      company: user.company,
      createdAt: new Date().toISOString(),
    });
    await setDoc(
      doc(db, 'carpool_users', ride.id),
      { capacity: ride.capacityLeft },
      { merge: true }
    );
    setBookedRides([...bookedRides, { id: bookingRef.id, ...ride, driverUid: ride.uid }]);
    alert('Ride booked successfully!');
  };

  // 🗑️ Unbook a ride
  const handleUnbookRide = async (bookingId, rideId) => {
    const rideDoc = userRides.find(ride => ride.id === rideId);
    if (rideDoc) {
      const bookingQuery = query(
        collection(db, 'carpool_matches'),
        where('driverUid', '==', rideDoc.uid),
        where('schedule', '==', rideDoc.schedule),
        where('location', '==', rideDoc.location)
      );
      const bookingSnapshot = await getDocs(bookingQuery);
      const newCapacity = rideDoc.capacity + 1;
      await setDoc(
        doc(db, 'carpool_users', rideId),
        { capacity: newCapacity },
        { merge: true }
      );
      await deleteDoc(doc(db, 'carpool_matches', bookingId));
      setBookedRides(bookedRides.filter(ride => ride.id !== bookingId));
      alert('Ride unbooked successfully!');
    }
  };

  // 🗑️ Delete a posted ride
  const handleDeleteRide = async (rideId) => {
    await deleteDoc(doc(db, 'carpool_users', rideId));
    setUserRides(userRides.filter(ride => ride.id !== rideId));
    alert('Ride deleted successfully!');
  };

  // 🧾 Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <p aria-live="polite">Loading transportation options…</p>;
  if (error) return <p aria-live="assertive">{error}</p>;

  return (
    <div className="transportation-container">
      <h2>Eco-Friendly Transportation</h2>
      <div className="menu">
        <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>Home</button>
        <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}>History</button>
        <button onClick={() => setView('share')} className={view === 'share' ? 'active' : ''}>Share Ride</button>
        <button onClick={() => setView('find')} className={view === 'find' ? 'active' : ''}>Find Ride</button>
        <button onClick={() => setView('myRides')} className={view === 'myRides' ? 'active' : ''}>My Rides</button>
      </div>
      {view === 'home' && (
        <p>Welcome! Choose an option to manage your carpool rides.</p>
      )}
      {view === 'history' && (
        <div className="history-section">
          <h3>Booking History</h3>
          {history.length > 0 ? (
            <ul className="ride-list">
              {history.map((ride) => (
                <li key={ride.id} className="ride-item">
                  <span>
                    Driver: {ride.driverUid} | Location: {ride.location} | Schedule: {ride.schedule} | Booked At: {ride.createdAt}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p aria-live="polite">No booking history found.</p>
          )}
        </div>
      )}
      {view === 'find' && (
        <div className="find-section">
          <h3>Available Rides</h3>
          {availableRides.length > 0 ? (
            <ul className="ride-list">
              {availableRides.map((ride) => (
                <li key={ride.id} className="ride-item">
                  <span>
                    Driver: {ride.uid} | Location: {ride.location} | Schedule: {ride.schedule} | Seats Left: {ride.capacityLeft}
                  </span>
                  <button
                    className="book-btn"
                    onClick={() => handleBookRide(ride)}
                    disabled={ride.capacityLeft <= 0}
                    aria-label={`Book ride with driver ${ride.uid} at ${ride.schedule}`}
                  >
                    {ride.capacityLeft > 0 ? 'Book' : 'Full'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p aria-live="polite">No rides available from other users for your company and location.</p>
          )}
        </div>
      )}
      {view === 'myRides' && (
        <div className="my-rides-section">
          <h3>My Rides</h3>
          {userRides.length > 0 && (
            <div>
              <h4>Posted Rides</h4>
              <ul className="ride-list">
                {userRides.map((ride) => (
                  <li key={ride.id} className="ride-item">
                    <span>
                      Location: {ride.location} | Schedule: {ride.schedule} | Capacity: {ride.capacity}
                    </span>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteRide(ride.id)}
                      aria-label={`Delete posted ride at ${ride.schedule}`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {bookedRides.length > 0 && (
            <div>
              <h4>Booked Rides</h4>
              <ul className="ride-list">
                {bookedRides.map((ride) => (
                  <li key={ride.id} className="ride-item">
                    <span>
                      Driver: {ride.driverUid} | Location: {ride.location} | Schedule: {ride.schedule}
                    </span>
                    <button
                      className="unbook-btn"
                      onClick={() => handleUnbookRide(ride.id, ride.driverUid)}
                      aria-label={`Unbook ride with driver ${ride.driverUid}`}
                    >
                      Unbook
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(userRides.length === 0 && bookedRides.length === 0) && (
            <p aria-live="polite">No rides found.</p>
          )}
        </div>
      )}
      {view === 'share' && (
        <div className="share-section">
          <h3>Share a Ride</h3>
          <form onSubmit={handleShareRide}>
            <div className="form-group">
              <label htmlFor="capacity">Capacity (Seats):</label>
              <input
                id="capacity"
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 4"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="schedule">Schedule (YYYY-MM-DDTHH:MM:SS):</label>
              <input
                id="schedule"
                type="text"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                placeholder="e.g., 2025-07-11T08:00:00"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Location:</label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., New York, NY"
                required
                aria-required="true"
              />
            </div>
            <button type="submit" className="submit-btn" aria-label="Share a new carpool ride">
              Share Ride
            </button>
          </form>
        </div>
      )}
      {(view === 'home' || view === 'find') && userRides.length > 0 && (
        <div className="user-rides">
          <h3>Your Posted Rides</h3>
          <ul className="ride-list">
            {userRides.map((ride) => (
              <li key={ride.id} className="ride-item">
                <span>
                  Location: {ride.location} | Schedule: {ride.schedule} | Capacity: {ride.capacity}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteRide(ride.id)}
                  aria-label={`Delete posted ride at ${ride.schedule}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(view === 'home' || view === 'find') && bookedRides.length > 0 && (
        <div className="booked-section">
          <h3>Your Booked Rides</h3>
          <ul className="ride-list">
            {bookedRides.map((ride) => (
              <li key={ride.id} className="ride-item">
                <span>
                  Driver: {ride.driverUid} | Location: {ride.location} | Schedule: {ride.schedule}
                </span>
                <button
                  className="unbook-btn"
                  onClick={() => handleUnbookRide(ride.id, ride.driverUid)}
                  aria-label={`Unbook ride with driver ${ride.driverUid}`}
                >
                  Unbook
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TransportationSection;