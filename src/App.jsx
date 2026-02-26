import React, { useEffect, useState } from 'react';
     import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
     import { auth } from './../FirebaseConfig/firebase';
     import Home from './pages/Home';
     import WaterSave from './pages/WaterSave';
     import Login from './pages/Login';
     import Signup from './pages/signup';
     import BioWaste from './pages/BioWasteAdvisor';
     import Sustain from './pages/Sustainability'
     import SchoolReg from './pages/SchoolReg'
     import SchoolDash from './pages/SchoolDashboard'
     import GoGreen from './pages/GoGreen'
     import Travel from './pages/TransportationSection'
     import ImgDetect from './pages/WasteDetection'
     import Hostels from './pages/Hotels'
     import Donation from './pages/DonationPage'

     function App() {
       const [loading, setLoading] = useState(true);
       const [isAuthenticated, setIsAuthenticated] = useState(false);

       useEffect(() => {
         const unsubscribe = auth.onAuthStateChanged((user) => {
           setIsAuthenticated(!!user);
           setLoading(false);
         });
         return () => unsubscribe();
       }, []);

       if (loading) {
         return <div>Loading...</div>;
       }

       return (
         <Router>
           <Routes>
             <Route 
               path="/login" 
               element={isAuthenticated ? <Navigate to="/home" /> : <Login />} 
             />
             <Route 
               path="/signup" 
               element={isAuthenticated ? <Navigate to="/home" /> : <Signup />} 
             />
             <Route 
               path="/home" 
               element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
             />
             <Route 
               path="/waterplan" 
               element={isAuthenticated ? <WaterSave /> : <Navigate to="/login" />} 
             />
             <Route 
               path="/biowaste" 
               element={isAuthenticated ? <BioWaste /> : <Navigate to="/login" />} 
             />
             <Route 
               path="/sustainability" 
               element={isAuthenticated ? <Sustain /> : <Navigate to="/login" />} 
             />
             <Route 
               path="/school-register" 
               element={isAuthenticated ? <SchoolReg /> : <Navigate to="/login" />} 
             />
             <Route
               path='school-dashboard'
               element={isAuthenticated ? <SchoolDash/> : <Navigate to="/school-dashboard"/>}
             />
             <Route
               path='go-green'
               element={isAuthenticated ? <GoGreen/> : <Navigate to="/school-dashboard"/>}
             />
             <Route
               path='travel'
               element={isAuthenticated ? <Travel/> : <Navigate to="/school-dashboard"/>}
             />
             <Route
               path='detect'
               element={isAuthenticated ? <ImgDetect/> : <Navigate to="/home"/>}
             />
             <Route
               path='hotel'
               element={isAuthenticated ? <Hostels/> : <Navigate to="/home"/>}
             />
             <Route
               path='donation'
               element= {<Donation />}
             />
             <Route 
               path="/" 
               element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} 
             />
           </Routes>
         </Router>
       );
     }

     export default App;