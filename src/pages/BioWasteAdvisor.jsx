import React, { useState, useEffect } from 'react';
import { db, auth } from '../../FirebaseConfig/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import moment from 'moment-timezone';
import './../styles/Biowaste.css'

const recipients = [
  { name: "GreenGrow Farms", industry: "Agriculture", acceptedWaste: "veg,leaf", maxKg: 100, intent: "compost" },
  { name: "BioFuelTech Ltd", industry: "Energy", acceptedWaste: "meat", maxKg: 200, intent: "biofuel" },
];

function BioWasteAdvisor() {
  const [wastes, setWastes] = useState([]);
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [newWaste, setNewWaste] = useState({ amount: '', weight: '', count: '', contents: '', location: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser?.email);
  const [currentUserId, setCurrentUserId] = useState(auth.currentUser?.uid);
  const [history, setHistory] = useState([]);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showPurchasedPopup, setShowPurchasedPopup] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser.email);
      setCurrentUserId(auth.currentUser.uid);
      const wastesCollection = collection(db, 'BioWaste');
      const unsubscribeWastes = onSnapshot(wastesCollection, (snapshot) => {
        const wastesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWastes(wastesList);
      }, (error) => console.error('Error listening to wastes:', error));

      const historyCollection = collection(db, 'History');
      const q = query(historyCollection, where('owner', '==', currentUser));
      const unsubscribeHistory = onSnapshot(q, (snapshot) => {
        const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(historyList);
      }, (error) => console.error('Error listening to history:', error));

      return () => {
        unsubscribeWastes();
        unsubscribeHistory();
      };
    }
  }, [auth.currentUser, currentUser]);

  const generateGuidance = ({ wasteType, amount }) => {
    if (!wasteType || isNaN(amount)) return { status: 'invalid', message: 'Waste data incomplete or invalid.' };
    const match = recipients.find(r => r.acceptedWaste.includes(wasteType) && amount <= r.maxKg);
    if (match) return { status: 'match', recipient: match };
    const guidance = { veg: ['Home composting 🌱'], leaf: ['Mulch locally 💚'], meat: ['Biogas unit 🚜'] };
    return guidance[wasteType] ? { status: 'suggest', tips: guidance[wasteType] } : { status: 'none', message: 'No guidance.' };
  };

  const handleSelectWaste = (waste) => setSelectedWaste(waste);

  const handleOrder = async (waste) => {
    if (!currentUserId || !selectedWaste || !deliveryMethod) {
      console.error('Purchase failed: Missing user ID, selected waste, or delivery method');
      return;
    }
    try {
      const wasteRef = doc(db, 'BioWaste', waste.id);
      await updateDoc(wasteRef, { status: false, deliveryMethod, customer: currentUserId, amount: 0 });
      await addDoc(collection(db, 'History'), { ...waste, date: moment().tz('Asia/Kolkata').toISOString(), action: 'purchased', customer: currentUserId, owner: currentUser });
      setSelectedWaste(null);
      setDeliveryMethod('');
      console.log('Purchase successful for waste ID:', waste.id);
    } catch (error) {
      console.error('Error during purchase:', error);
    }
  };

  const addWaste = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const waste = {
      owner: currentUser,
      time: moment().tz('Asia/Kolkata').format('HH:mm:ss'),
      date: moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
      amount: Number(newWaste.amount),
      weight: newWaste.weight,
      count: newWaste.count,
      contents: newWaste.contents.split(',').map(c => c.trim()),
      status: true,
      customer: null,
      location: newWaste.location,
    };
    await addDoc(collection(db, 'BioWaste'), waste);
    setNewWaste({ amount: '', weight: '', count: '', contents: '', location: '' });
    setShowAddForm(false);
  };

  const editWaste = async (e) => {
    e.preventDefault();
    if (!selectedWaste || !selectedWaste.status) return;
    const wasteRef = doc(db, 'BioWaste', selectedWaste.id);
    await updateDoc(wasteRef, {
      amount: Number(newWaste.amount),
      weight: newWaste.weight,
      count: newWaste.count,
      contents: newWaste.contents.split(',').map(c => c.trim()),
      location: newWaste.location,
    });
    await addDoc(collection(db, 'History'), { ...selectedWaste, date: moment().tz('Asia/Kolkata').toISOString(), action: 'edited', owner: currentUser });
    setSelectedWaste(null);
    setShowEditForm(false);
  };

  const deleteWaste = async (id) => {
    const waste = wastes.find(w => w.id === id);
    if (waste && waste.status) {
      const wasteRef = doc(db, 'BioWaste', waste.id);
      await updateDoc(wasteRef, { status: "Break" });
      await addDoc(collection(db, 'History'), { ...waste, date: moment().tz('Asia/Kolkata').toISOString(), action: 'deleted', owner: currentUser });
      await deleteDoc(wasteRef);
    }
  };

  const publicWastes = wastes.filter(w => w.owner !== currentUser && w.status === true);
  const ownedWastes = wastes.filter(w => w.owner === currentUser && w.status === true);

  return (
    <div className="advisor-container">
      <h2>🌿 BioWaste Management System</h2>
      <div className="controls">
        <button onClick={() => setShowAddForm(true)} className="btn">Add New Waste</button>
        <button onClick={() => setShowPurchasedPopup(true)} className="btn">Show Purchased Details</button>
        <button onClick={() => setShowHistoryPopup(true)} className="btn">History</button>
      </div>

      {showAddForm && (
        <form onSubmit={addWaste} className="form">
          <input value={newWaste.amount} onChange={(e) => setNewWaste({ ...newWaste, amount: e.target.value })} placeholder="Amount (kg)" required />
          <input value={newWaste.weight} onChange={(e) => setNewWaste({ ...newWaste, weight: e.target.value })} placeholder="Weight (e.g., 2 sacks)" required />
          <input value={newWaste.count} onChange={(e) => setNewWaste({ ...newWaste, count: e.target.value })} placeholder="Count (e.g., 2 sacks)" required />
          <input value={newWaste.contents} onChange={(e) => setNewWaste({ ...newWaste, contents: e.target.value })} placeholder="Contents (e.g., veg,leaf)" required />
          <input value={newWaste.location} onChange={(e) => setNewWaste({ ...newWaste, location: e.target.value })} placeholder="Location" required />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
        </form>
      )}

      <div className="waste-cards">
        {publicWastes.map(waste => (
          <div key={waste.id} className="card" onClick={() => handleSelectWaste(waste)}>
            <p>Amount: {waste.amount} kg</p>
            <p>Weight: {waste.weight}</p>
            <p>Count: {waste.count}</p>
            <p>Contents: {waste.contents.join(', ')}</p>
            <p>Location: {waste.location}</p>
          </div>
        ))}
      </div>

      <div className="owner-waste-cards">
        {ownedWastes.map(waste => (
          <div key={waste.id} className="card" onClick={() => handleSelectWaste(waste)}>
            <p>Amount: {waste.amount} kg</p>
            <p>Weight: {waste.weight}</p>
            <p>Count: {waste.count}</p>
            <p>Contents: {waste.contents.join(', ')}</p>
            <p>Location: {waste.location}</p>
            <button onClick={() => { setShowEditForm(true); setNewWaste({ ...waste, contents: waste.contents.join(',') }); }}>Edit</button>
            <button onClick={() => deleteWaste(waste.id)}>Delete</button>
          </div>
        ))}
      </div>

      {selectedWaste && (
        <div className="details-modal">
          <div className="details-content">
            <h3>Waste Details</h3>
            <p><strong>Amount:</strong> {selectedWaste.amount} kg</p>
            <p><strong>Weight:</strong> {selectedWaste.weight}</p>
            <p><strong>Count:</strong> {selectedWaste.count}</p>
            <p><strong>Contents:</strong> {selectedWaste.contents.join(', ')}</p>
            <p><strong>Location:</strong> {selectedWaste.location}</p>
            <p><strong>Owner:</strong> {selectedWaste.owner}</p>
            <p><strong>Date:</strong> {selectedWaste.date}</p>
            <p><strong>Time:</strong> {selectedWaste.time}</p>
            {selectedWaste.customer && <p><strong>Customer:</strong> {selectedWaste.customer}</p>}
            {selectedWaste.owner === currentUser && selectedWaste.status && (
              <>
                <button onClick={() => { setShowEditForm(true); setNewWaste({ ...selectedWaste, contents: selectedWaste.contents.join(',') }); }}>Edit</button>
                <button onClick={() => deleteWaste(selectedWaste.id)}>Delete</button>
              </>
            )}
            {selectedWaste.owner !== currentUser && selectedWaste.status && (
              <div>
                <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} required>
                  <option value="">Select Delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="dropoff">Dropoff</option>
                </select>
                <button onClick={() => handleOrder(selectedWaste)}>Order</button>
              </div>
            )}
            <button onClick={() => setSelectedWaste(null)}>Close</button>
          </div>
        </div>
      )}

      {showEditForm && (
        <form onSubmit={editWaste} className="form">
          <input value={newWaste.amount} onChange={(e) => setNewWaste({ ...newWaste, amount: e.target.value })} placeholder="Amount (kg)" required />
          <input value={newWaste.weight} onChange={(e) => setNewWaste({ ...newWaste, weight: e.target.value })} placeholder="Weight" required />
          <input value={newWaste.count} onChange={(e) => setNewWaste({ ...newWaste, count: e.target.value })} placeholder="Count" required />
          <input value={newWaste.contents} onChange={(e) => setNewWaste({ ...newWaste, contents: e.target.value })} placeholder="Contents" required />
          <input value={newWaste.location} onChange={(e) => setNewWaste({ ...newWaste, location: e.target.value })} placeholder="Location" required />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
        </form>
      )}

      {showPurchasedPopup && (
        <div className="details-modal">
          <div className="details-content">
            <h3>Purchased Details</h3>
            {wastes.filter(w => w.status === false).length > 0 ? (
              wastes.filter(w => w.status === false).map((waste, idx) => (
                <div key={idx} className="history-item">
                  <p><strong>ID:</strong> {waste.id}</p>
                  <p><strong>Amount:</strong> {waste.amount} kg</p>
                  <p><strong>Weight:</strong> {waste.weight}</p>
                  <p><strong>Count:</strong> {waste.count}</p>
                  <p><strong>Contents:</strong> {waste.contents.join(', ')}</p>
                  <p><strong>Location:</strong> {waste.location}</p>
                  <p><strong>Owner:</strong> {waste.owner}</p>
                  <p><strong>Date:</strong> {waste.date}</p>
                  <p><strong>Time:</strong> {waste.time}</p>
                  <p><strong>Customer:</strong> {waste.customer}</p>
                  <p><strong>Delivery Method:</strong> {waste.deliveryMethod}</p>
                </div>
              ))
            ) : (
              <p>Empty</p>
            )}
            <button onClick={() => setShowPurchasedPopup(false)}>Close</button>
          </div>
        </div>
      )}

      {showHistoryPopup && (
        <div className="details-modal">
          <div className="details-content">
            <h3>History</h3>
            {history.filter(h => h.status === "Break" && h.owner === currentUser).length > 0 ? (
              history.filter(h => h.status === "Break" && h.owner === currentUser).map((item, idx) => (
                <div key={idx} className="history-item">
                  <p><strong>ID:</strong> {item.id}</p>
                  <p><strong>Amount:</strong> {item.amount} kg</p>
                  <p><strong>Contents:</strong> {item.contents.join(', ')}</p>
                  <p><strong>Location:</strong> {item.location}</p>
                  <p><strong>Action:</strong> {item.action}</p>
                  <p><strong>Date:</strong> {moment(item.date).tz('Asia/Kolkata').toLocaleString()}</p>
                  {item.customer && <p><strong>Customer:</strong> {item.customer}</p>}
                </div>
              ))
            ) : (
              <p>Empty</p>
            )}
            <button onClick={() => setShowHistoryPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BioWasteAdvisor;