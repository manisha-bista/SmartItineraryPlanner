import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ItineraryDetail from './pages/ItineraryDetail.jsx';
import CommunityFeed from './pages/CommunityFeed';
import MyItineraries from './pages/MyItineraries';
import ProfileSettings from './pages/ProfileSettings';
import PlaceDetail from './pages/PlaceDetail';
import AdminDashboard from './pages/AdminDashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/place/:placeId" element={<PlaceDetail />} />

        {/* Private Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/itinerary/:id" element={<ItineraryDetail />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/itineraries" element={<MyItineraries />} />
        <Route path="/profile" element={<ProfileSettings />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;