import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';  // adjust path to wherever ThemeContext.jsx lives
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ItineraryDetail from './pages/ItineraryDetail.jsx';
import CommunityFeed from './pages/CommunityFeed';
import MyItineraries from './pages/MyItineraries';
import ProfileSettings from './pages/ProfileSettings.jsx';
import PlaceDetail from './pages/PlaceDetail';
import AdminDashboard from './pages/AdminDashboard.jsx';
import InteractiveMap from './pages/InteractiveMap';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';

const PublicOnlyRoute = ({ children }) => {
    const userId   = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'user';
    if (userId) return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
    return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/"         element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
          <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          <Route path="/place/:placeId" element={<PlaceDetail />} />

          <Route path="/dashboard"     element={<ProtectedRoute requiredRole="user"><Dashboard /></ProtectedRoute>} />
          <Route path="/itinerary/:id" element={<ProtectedRoute requiredRole="user"><ItineraryDetail /></ProtectedRoute>} />
          <Route path="/community"     element={<ProtectedRoute requiredRole="user"><CommunityFeed /></ProtectedRoute>} />
          <Route path="/itineraries"   element={<ProtectedRoute requiredRole="user"><MyItineraries /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute requiredRole="user"><ProfileSettings /></ProtectedRoute>} />
          <Route path="/map"           element={<ProtectedRoute requiredRole="user"><InteractiveMap /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
        </Routes>

        <ChatWidget />
      </Router>
    </ThemeProvider>
  );
}

export default App;