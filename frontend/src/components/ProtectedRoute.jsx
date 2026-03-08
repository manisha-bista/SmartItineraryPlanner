import React from 'react';
import { Navigate } from 'react-router-dom';

// wraps around routes to check if user is logged in and has the right role
// requiredRole can be 'user' or 'admin'
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'user';

    // not logged in
    if (!userId) {
        return <Navigate to="/login" replace />;
    }

    // admin shouldn't see normal user pages
    if (requiredRole === 'user' && userRole === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    // normal users can't access admin stuff
    if (requiredRole === 'admin' && userRole !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;