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
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/place/:placeId" element={<PlaceDetail />} />

        {/* User-only Routes */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><Dashboard /></ProtectedRoute>} />
        <Route path="/itinerary/:id" element={<ProtectedRoute requiredRole="user"><ItineraryDetail /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute requiredRole="user"><CommunityFeed /></ProtectedRoute>} />
        <Route path="/itineraries" element={<ProtectedRoute requiredRole="user"><MyItineraries /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requiredRole="user"><ProfileSettings /></ProtectedRoute>} />

        {/* Admin-only Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>

      {/* floating chat — shows on all pages when logged in */}
      <ChatWidget />
    </Router>
  );
}

export default App;