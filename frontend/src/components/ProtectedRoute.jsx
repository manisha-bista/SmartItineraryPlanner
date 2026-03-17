import React from 'react';
import { Navigate } from 'react-router-dom';

// wraps around routes to check if user is logged in and has the right role
// admins can access all pages (user + admin), regular users can't see admin pages
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'user';

    // not logged in
    if (!userId) {
        return <Navigate to="/login" replace />;
    }

    // admins have full access to everything
    if (userRole === 'admin') {
        return children;
    }

    // normal users can't access admin stuff
    if (requiredRole === 'admin' && userRole !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;