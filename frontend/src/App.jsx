import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ItineraryDetail from './pages/ItineraryDetail.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/itinerary/:id" element={<ItineraryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;