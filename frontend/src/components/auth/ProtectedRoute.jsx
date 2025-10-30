import React, { useState, useEffect } from 'react';
import logger from '../../shared/utils/logger';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(null);
  const [applicationState, setApplicationState] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuthAndStatus();
  }, []);

  const checkAuthAndStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const storedUserRaw = JSON.parse(localStorage.getItem('user') || '{}');
      if (!storedUserRaw || Object.keys(storedUserRaw).length === 0) {
        setUser(null);
        setLoading(false);
        return;
      }

      const normalizedRole = typeof storedUserRaw.role === 'string'
        ? storedUserRaw.role.toLowerCase()
        : storedUserRaw.role;

      const storedUser = {
        ...storedUserRaw,
        role: normalizedRole || null
      };

      localStorage.setItem('user', JSON.stringify(storedUser));
      setUser(storedUser);

      if (storedUser.role === 'mentee' || storedUser.role === 'mentor') {
        const endpoint = storedUser.role === 'mentee'
          ? buildApiUrl('/mentee/application/status')
          : buildApiUrl('/mentor/application/status');

        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            const updatedUser = {
              ...storedUser,
              applicationStatus: data.status || storedUser.applicationStatus,
              applicationRole: data.role || storedUser.applicationRole
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setApplicationState({ role: storedUser.role, status: data.status });
          } else {
            setApplicationState({ role: storedUser.role, status: storedUser.applicationStatus || 'not_submitted' });
          }
        } catch (error) {
          logger.error('Failed to check application status:', error);
          setApplicationState({ role: storedUser.role, status: storedUser.applicationStatus || 'not_submitted' });
        }
      } else {
        setApplicationState(null);
      }

    } catch (error) {
      logger.error('Auth check failed:', error);
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
    const status = applicationState?.role === 'mentee'
      ? applicationState.status
      : user.applicationStatus || 'not_submitted';
    // Avoid self-redirect loops: if the user is already on the application or pending path,
    // allow rendering the children so the page can display correctly.
    const path = location.pathname;
    switch (status) {
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

  if (user.role === 'mentor') {
    const status = applicationState?.role === 'mentor'
      ? applicationState.status
      : user.applicationStatus || 'not_submitted';
    const path = location.pathname;
    switch (status) {
      case 'not_submitted':
        if (path === '/mentor/application') return children;
        return <Navigate to="/mentor/application" replace />;
      case 'pending':
        if (path === '/mentor/pending') return children;
        return <Navigate to="/mentor/pending" replace />;
      case 'approved':
        break;
      case 'rejected':
        if (path === '/mentor/application') return children;
        return <Navigate to="/mentor/application" replace />;
      default:
        if (path === '/mentor/application') return children;
        return <Navigate to="/mentor/application" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string
};

export default ProtectedRoute;
