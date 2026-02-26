import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../FirebaseConfig/firebase';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import moment from 'moment-timezone';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import '../styles/Water.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function WaterSave() {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [waterLimit, setWaterLimit] = useState(0);
  const [waterUsed, setWaterUsed] = useState(0);
  const [credits, setCredits] = useState(0);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [totalWorkers, setTotalWorkers] = useState('');
  const [floors, setFloors] = useState('');
  const [washrooms, setWashrooms] = useState('');
  const [waterCollectorCapacity, setWaterCollectorCapacity] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0);
  const [recipientOrg, setRecipientOrg] = useState('');
  const [requestAmount, setRequestAmount] = useState(0);
  const [requestToOrg, setRequestToOrg] = useState('');
  const [requests, setRequests] = useState([]);
  const [showRequestPopup, setShowRequestPopup] = useState(false);

  // Chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Water Used (L)',
        data: [800, 750, 700, 650, 600, 550, 500],
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Water Saved (L)',
        data: [200, 250, 300, 350, 400, 450, 500],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Liters' },
      },
      x: {
        title: { display: true, text: 'Months' },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Water Usage vs. Savings (2025)' },
    },
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgsCollection = collection(db, 'Organizations');
        const orgsSnapshot = await getDocs(orgsCollection);
        const orgsList = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrganizations(orgsList);
        const currentUserEmail = auth.currentUser?.email;
        setCurrentOrg(orgsList.find(org => org.owner === currentUserEmail && org.isCurrentUser) || orgsList.find(org => org.owner === currentUserEmail));
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };
    fetchOrganizations();

    const fetchRequests = async () => {
      try {
        const requestsCollection = collection(db, 'Requests');
        const requestsSnapshot = await getDocs(requestsCollection);
        const requestsList = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(requestsList);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };
    fetchRequests();

    const checkMidnightUpdate = () => {
      const now = moment().tz('Asia/Kolkata');
      if (now.hour() === 0 && now.minute() === 0) {
        organizations.forEach(async (org) => {
          const orgRef = doc(db, 'Organizations', org.id);
          const excess = org.waterUsed - org.waterLimit;
          const creditChange = excess > 0 ? -20 * excess : 10;
          const newCredits = org.credits + creditChange;

          await updateDoc(orgRef, {
            credits: newCredits,
            waterUsed: 0,
            todaysUse: 0,
            history: [...(org.history || []), {
              date: now.toISOString(),
              action: 'midnightUpdate',
              waterUsed: 0,
              creditsChange: creditChange
            }]
          });
        });
        fetchOrganizations();
      }
    };
    const interval = setInterval(checkMidnightUpdate, 60000);
    return () => clearInterval(interval);
  }, [organizations]);

  const handleOrgSelect = (org) => {
    setSelectedOrg(org);
    setWaterLimit(org.waterLimit || 0);
    setWaterUsed(org.waterUsed || 0);
    setCredits(org.credits || 0);
    setRecipientOrg('');
  };

  const updateWaterUsage = async () => {
    if (!selectedOrg) return;
    try {
      const orgRef = doc(db, 'Organizations', selectedOrg.id);
      const excess = waterUsed - waterLimit;
      const creditChange = excess > 0 ? -20 * excess : 10;
      const newCredits = credits + creditChange;

      await updateDoc(orgRef, {
        waterUsed: Number(waterUsed),
        credits: newCredits,
        taxBenefits: newCredits > 100 ? 'Eligible' : 'Not Eligible',
        penalties: excess > 0 ? 'Applied' : 'None',
        history: [...(selectedOrg.history || []), {
          date: new Date().toISOString(),
          action: 'update',
          waterUsed: Number(waterUsed),
          creditsChange: newCredits - credits
        }]
      });

      setCredits(newCredits);
      setSelectedOrg({ ...selectedOrg, waterUsed: Number(waterUsed), credits: newCredits });
    } catch (error) {
      console.error('Error updating water usage:', error);
    }
  };

  const donateWater = async () => {
    if (!selectedOrg || !recipientOrg || donationAmount <= 0) return;
    try {
      const donorRef = doc(db, 'Organizations', selectedOrg.id);
      const recipient = organizations.find(org => org.id === recipientOrg);
      if (!recipient) return;

      const availableWater = selectedOrg.waterLimit - selectedOrg.waterUsed;
      if (donationAmount > availableWater) {
        alert('Insufficient available water for donation');
        return;
      }

      const newDonorCredits = credits * 1.3;
      const newRecipientCredits = recipient.credits;

      await updateDoc(donorRef, {
        waterLimit: Number(selectedOrg.waterLimit) - Number(donationAmount),
        waterUsed: Number(selectedOrg.waterUsed) + Number(donationAmount),
        credits: newDonorCredits,
        history: [...(selectedOrg.history || []), {
          date: new Date().toISOString(),
          action: 'donate',
          amount: Number(donationAmount),
          to: recipientOrg
        }]
      });

      await updateDoc(doc(db, 'Organizations', recipientOrg), {
        waterLimit: Number(recipient.waterLimit) + Number(donationAmount),
        credits: newRecipientCredits,
        history: [...(recipient.history || []), {
          date: new Date().toISOString(),
          action: 'receive',
          amount: Number(donationAmount),
          from: selectedOrg.id
        }]
      });

      setWaterLimit(Number(selectedOrg.waterLimit) - Number(donationAmount));
      setWaterUsed(Number(selectedOrg.waterUsed) + Number(donationAmount));
      setCredits(newDonorCredits);
      setDonationAmount(0);
      setRecipientOrg('');
      setShowManagePopup(false);
    } catch (error) {
      console.error('Error donating water:', error);
    }
  };

  const sendRequest = async () => {
    if (!selectedOrg || requestAmount <= 0 || !requestToOrg) return;
    try {
      const requestToOrgData = organizations.find(org => org.id === requestToOrg);
      if (!requestToOrgData) return;

      await addDoc(collection(db, 'Requests'), {
        fromOrgId: selectedOrg.id,
        toOrgId: requestToOrg,
        amount: Number(requestAmount),
        status: 'pending',
        timestamp: new Date().toISOString(),
        fromOrgName: organizations.find(org => org.id === selectedOrg.id)?.NameOfOrg,
        toOrgName: requestToOrgData.NameOfOrg,
        fromOwner: selectedOrg.owner,
        toOwner: requestToOrgData.owner
      });
      setRequestAmount(0);
      setRequestToOrg('');
      setShowRequestPopup(false);
      alert('Request sent successfully');
      await fetchRequests();
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const acceptRequest = async (requestId, fromOrgId, amount) => {
    try {
      const requestOrg = organizations.find(org => org.id === fromOrgId);
      const currentOrgData = organizations.find(org => org.id === currentOrg.id);
      if (!requestOrg || !currentOrgData || amount > (currentOrgData.waterLimit - currentOrgData.waterUsed)) {
        await updateDoc(doc(db, 'Requests', requestId), { status: 'rejected' });
        setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
        await updateDoc(doc(db, 'Organizations', currentOrg.id), {
          history: [...(currentOrgData.history || []), {
            date: new Date().toISOString(),
            action: 'rejectRequest',
            amount: Number(amount),
            from: fromOrgId,
            status: 'rejected'
          }]
        });
        alert('Request rejected due to insufficient water');
        return;
      }

      const orgRef = doc(db, 'Organizations', currentOrg.id);
      const requestOrgRef = doc(db, 'Organizations', fromOrgId);
      const newCurrentCredits = currentOrgData.credits * 1.25;
      const newRequestCredits = requestOrg.credits * 0.6;

      await updateDoc(orgRef, {
        waterUsed: Number(currentOrgData.waterUsed) + Number(amount),
        credits: newCurrentCredits,
        history: [...(currentOrgData.history || []), {
          date: new Date().toISOString(),
          action: 'acceptRequest',
          amount: Number(amount),
          from: fromOrgId,
          creditsChange: newCurrentCredits - currentOrgData.credits
        }]
      });

      await updateDoc(requestOrgRef, {
        waterLimit: Number(requestOrg.waterLimit) + Number(amount),
        credits: newRequestCredits,
        history: [...(requestOrg.history || []), {
          date: new Date().toISOString(),
          action: 'receiveRequest',
          amount: Number(amount),
          from: currentOrg.id,
          creditsChange: newRequestCredits - requestOrg.credits
        }]
      });

      await updateDoc(doc(db, 'Requests', requestId), { status: 'accepted' });
      setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'accepted' } : req));
      await fetchOrganizations(); // Refresh organizations to reflect changes
      alert('Request accepted successfully');
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const rejectRequest = async (requestId, fromOrgId, amount) => {
    try {
      const currentOrgData = organizations.find(org => org.id === currentOrg.id);
      await updateDoc(doc(db, 'Requests', requestId), { status: 'rejected' });
      setRequests(requests.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
      await updateDoc(doc(db, 'Organizations', currentOrg.id), {
        history: [...(currentOrgData.history || []), {
          date: new Date().toISOString(),
          action: 'rejectRequest',
          amount: Number(amount),
          from: fromOrgId,
          status: 'rejected'
        }]
      });
      alert('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const removeOrganization = async () => {
    if (!currentOrg) return;
    try {
      await deleteDoc(doc(db, 'Organizations', currentOrg.id));
      setOrganizations(organizations.filter(org => org.id !== currentOrg.id));
      setCurrentOrg(organizations.length > 1 ? organizations.find(org => org.id !== currentOrg.id) : null);
      setSelectedOrg(null);
    } catch (error) {
      console.error('Error removing organization:', error);
    }
  };

  const registerOrganization = async () => {
    if (!newOrgName || !companySize || !totalWorkers || !floors || !washrooms || !waterCollectorCapacity || !auth.currentUser) return;
    try {
      const orgsCollection = collection(db, 'Organizations');
      const newOrgData = {
        NameOfOrg: newOrgName,
        Allowance: 'Not Eligible',
        PreviousOrders: [],
        WasteType: 'Water',
        WaterCredit: 0,
        companySize,
        totalWorkers: Number(totalWorkers),
        floors: Number(floors),
        washrooms: Number(washrooms),
        waterCollectorCapacity: Number(waterCollectorCapacity),
        waterLimit: 1000,
        waterUsed: 0,
        todaysUse: 0,
        credits: 1000,
        taxBenefits: 'Not Eligible',
        penalties: 'None',
        history: [],
        isCurrentUser: true,
        owner: auth.currentUser.email
      };
      const newOrgRef = await addDoc(orgsCollection, newOrgData);
      const newOrg = { id: newOrgRef.id, ...newOrgData };
      setOrganizations([...organizations, newOrg]);
      setNewOrgName('');
      setCompanySize('');
      setTotalWorkers('');
      setFloors('');
      setWashrooms('');
      setWaterCollectorCapacity('');
      setShowAddPopup(false);
      setCurrentOrg(newOrg);
    } catch (error) {
      console.error('Error registering organization:', error);
    }
  };

  return (
    <div className="water-save">
      <div className="container">
        {/* Chart at the top */}
        <div className="chart-section">
          <h2>Water Usage & Savings Overview</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Rest of the content shifted below */}
        <h1>💧 Water Management System</h1>
        <button onClick={() => setShowAddPopup(true)} className="button primary">Add New Organization</button>

        {showAddPopup && (
          <div className="popup">
            <div className="popup-content">
              <h2>Add New Organization</h2>
              <div className="input-group">
                <label>Organization Name</label>
                <input type="text" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="input" />
              </div>
              <div className="input-group">
                <label>Company Size</label>
                <input type="text" value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="input" />
              </div>
              <div className="input-group">
                <label>Total Workers</label>
                <input type="number" value={totalWorkers} onChange={(e) => setTotalWorkers(e.target.value)} className="input" />
              </div>
              <div className="input-group">
                <label>Floors</label>
                <input type="number" value={floors} onChange={(e) => setFloors(e.target.value)} className="input" />
              </div>
              <div className="input-group">
                <label>Number of Washrooms</label>
                <input type="number" value={washrooms} onChange={(e) => setWashrooms(e.target.value)} className="input" />
              </div>
              <div className="input-group">
                <label>Water Collector Capacity (L)</label>
                <input type="number" value={waterCollectorCapacity} onChange={(e) => setWaterCollectorCapacity(e.target.value)} className="input" />
              </div>
              <button onClick={registerOrganization} className="button primary">Submit</button>
              <button onClick={() => setShowAddPopup(false)} className="button secondary">Cancel</button>
            </div>
          </div>
        )}

        {organizations.map(org => (
          org.owner === auth.currentUser?.email && (
            <div className="card" key={org.id}>
              <h2>{org.NameOfOrg}</h2>
              <p><span className="bold">Credits:</span> <span style={{ color: org.credits < 0 ? 'red' : 'green' }}>{org.credits}</span></p>
              <p><span className="bold">Remaining Water:</span> {org.waterLimit - org.waterUsed > 0 ? `${org.waterLimit - org.waterUsed} L` : `0 L`}</p>
              {currentOrg?.id === org.id && (
                <button onClick={removeOrganization} className="button danger">Remove Organization</button>
              )}
              {currentOrg?.id === org.id && (
                <div className="details">
                  <p><span className="bold">Company Size:</span> {org.companySize}</p>
                  <p><span className="bold">Total Workers:</span> {org.totalWorkers}</p>
                  <p><span className="bold">Floors:</span> {org.floors}</p>
                  <p><span className="bold">Washrooms:</span> {org.washrooms}</p>
                  <p><span className="bold">Water Collector Capacity:</span> {org.waterCollectorCapacity} L</p>
                  <p><span className="bold">Owner:</span> {org.owner}</p>
                  <button onClick={() => setShowDashboard(!showDashboard)} className="button secondary">
                    {showDashboard ? 'Hide Dashboard' : 'View Dashboard'}
                  </button>
                </div>
              )}
              {showDashboard && currentOrg?.id === org.id && (
                <div className="dashboard">
                  <p><span className="bold">Water Credit:</span> {org.WaterCredit}</p>
                  <p><span className="bold">Today's Use:</span> {org.todaysUse} L</p>
                  <p><span className="bold">Water Used:</span> {org.waterUsed} L</p>
                  <p><span className="bold">Water Limit:</span> {org.waterLimit} L</p>
                  <h4>History</h4>
                  {org.history && org.history.length > 0 ? (
                    <ul>
                      {org.history.map((entry, index) => (
                        <li key={index}>
                          {entry.action === 'update' && (
                            <p>{new Date(entry.date).toLocaleString()}: Used {entry.waterUsed}L, Credits Changed by {entry.creditsChange}</p>
                          )}
                          {entry.action === 'donate' && (
                            <p>{new Date(entry.date).toLocaleString()}: Donated {entry.amount}L to {entry.to}</p>
                          )}
                          {entry.action === 'receive' && (
                            <p>{new Date(entry.date).toLocaleString()}: Received {entry.amount}L from {entry.from}</p>
                          )}
                          {entry.action === 'midnightUpdate' && (
                            <p>{new Date(entry.date).toLocaleString()}: Midnight Update, Credits Changed by {entry.creditsChange}</p>
                          )}
                          {entry.action === 'acceptRequest' && (
                            <p>{new Date(entry.date).toLocaleString()}: Accepted Request, Sent {entry.amount}L to {entry.to}, Credits Changed by {entry.creditsChange}</p>
                          )}
                          {entry.action === 'receiveRequest' && (
                            <p>{new Date(entry.date).toLocaleString()}: Received {entry.amount}L from {entry.from}, Credits Changed by {entry.creditsChange}</p>
                          )}
                          {entry.action === 'rejectRequest' && (
                            <p>{new Date(entry.date).toLocaleString()}: Rejected Request from {entry.from} for {entry.amount}L</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No history available</p>
                  )}
                  <h4>Pending Requests</h4>
                  {requests.filter(req => req.toOwner === auth.currentUser?.email && req.status === 'pending').map(req => (
                    <div key={req.id} className="request-item">
                      <p>Request from {req.fromOrgName} for {req.amount}L</p>
                      <button onClick={() => acceptRequest(req.id, req.fromOrgId, req.amount)} className="button secondary">Accept</button>
                      <button onClick={() => rejectRequest(req.id, req.fromOrgId, req.amount)} className="button secondary">Reject</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        {currentOrg && (
          <div className="card">
            <h2>Manage Water Usage</h2>
            <select className="select" value={selectedOrg?.id || ''} onChange={(e) => handleOrgSelect(organizations.find(org => org.id === e.target.value))}>
              <option value="">Select an organization</option>
              {organizations.filter(org => org.owner === auth.currentUser?.email).map(org => (
                <option key={org.id} value={org.id}>{org.NameOfOrg}</option>
              ))}
            </select>
            {selectedOrg && (
              <button onClick={() => setShowManagePopup(true)} className="button primary">Manage Water</button>
            )}
          </div>
        )}

        {showManagePopup && (
          <div className="popup manage-popup">
            <div className="popup-content">
              <h2>Manage Water</h2>
              <div className="section">
                <h3>Update Usage</h3>
                <div className="input-group">
                  <label>Water Used Today (L)</label>
                  <input type="number" value={waterUsed} onChange={(e) => setWaterUsed(Number(e.target.value))} className="input" />
                </div>
                <button onClick={updateWaterUsage} className="button primary">Update Usage</button>
              </div>
              <div className="section">
                <h3>Donate Water</h3>
                <div className="input-group">
                  <label>Donation Amount (L)</label>
                  <input type="number" value={donationAmount} onChange={(e) => setDonationAmount(Number(e.target.value))} className="input" />
                </div>
                <div className="input-group">
                  <label>Recipient Organization</label>
                  <select className="select" value={recipientOrg} onChange={(e) => setRecipientOrg(e.target.value)}>
                    <option value="">Select recipient</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.NameOfOrg}</option>
                    ))}
                  </select>
                </div>
                <button onClick={donateWater} className="button secondary">Donate Water</button>
              </div>
              <div className="section">
                <h3>Request Water</h3>
                <div className="input-group">
                  <label>Request Amount (L)</label>
                  <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(Number(e.target.value))} className="input" />
                </div>
                <div className="input-group">
                  <label>Request To Organization</label>
                  <select className="select" value={requestToOrg} onChange={(e) => setRequestToOrg(e.target.value)}>
                    <option value="">Select organization</option>
                    {organizations.filter(org => org.owner !== auth.currentUser?.email).map(org => (
                      <option key={org.id} value={org.id}>{org.NameOfOrg}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setShowRequestPopup(true)} className="button secondary">Send Request</button>
              </div>
              <button onClick={() => setShowManagePopup(false)} className="button secondary">Close</button>
            </div>
          </div>
        )}

        {showRequestPopup && (
          <div className="popup manage-popup">
            <div className="popup-content">
              <h2>Confirm Water Request</h2>
              <p>Request {requestAmount}L from {organizations.find(org => org.id === requestToOrg)?.NameOfOrg}?</p>
              <button onClick={sendRequest} className="button primary">Confirm</button>
              <button onClick={() => setShowRequestPopup(false)} className="button secondary">Cancel</button>
            </div>
          </div>
        )}

        <h4>All Requests</h4>
        {requests.length > 0 ? (
          <ul>
            {requests.map(req => (
              <li key={req.id}>
                {(req.toOwner === auth.currentUser?.email || req.fromOwner === auth.currentUser?.email) && (
                  <>
                    {req.status === 'pending' && (
                      <p>Pending: {req.fromOrgName} requests {req.amount}L from {req.toOrgName}</p>
                    )}
                    {req.status === 'accepted' && (
                      <p>Accepted: {req.fromOrgName} requested {req.amount}L from {req.toOrgName}</p>
                    )}
                    {req.status === 'rejected' && (
                      <p>Rejected: {req.fromOrgName} requested {req.amount}L from {req.toOrgName}</p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No requests found</p>
        )}

        <Link to="/" className="link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default WaterSave;