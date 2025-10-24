import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuthAndStatus();
  }, []);

  const checkAuthAndStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);

      // Check application status for mentees
      if (userData.role === 'mentee') {
        try {
          const response = await fetch('http://localhost:4000/api/mentee/application/status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setApplicationStatus(data.status);
          }
        } catch (error) {
          console.error('Failed to check application status:', error);
          setApplicationStatus('not_submitted');
        }
      }

    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tw-min-h-screen tw-bg-gray-50 tw-flex tw-items-center tw-justify-center">
        <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500"></div>
      </div>
    );
  }

  // No token - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Mentee application flow
  if (user.role === 'mentee') {
    // Avoid self-redirect loops: if the user is already on the application or pending path,
    // allow rendering the children so the page can display correctly.
    const path = location.pathname;
    switch (applicationStatus) {
      case 'not_submitted':
        if (path === '/mentee/application') return children; // allow the application page itself
        return <Navigate to="/mentee/application" replace />;
      case 'pending':
        if (path === '/mentee/pending') return children; // allow the pending page itself
        return <Navigate to="/mentee/pending" replace />;
      case 'approved':
        // Allow access to mentee dashboard
        break;
      case 'rejected':
        if (path === '/mentee/application') return children;
        return <Navigate to="/mentee/application" replace />;
      default:
        if (path === '/mentee/application') return children;
        return <Navigate to="/mentee/application" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string
};

export default ProtectedRoute;
