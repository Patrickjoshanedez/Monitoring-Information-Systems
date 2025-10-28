import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../features/auth/pages/AuthLayout';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = async (role) => {
    setError('');
    setLoading(true);
    setSelectedRole(role);
    try {
      // Update user role in backend
  const response = await fetch(buildApiUrl('/auth/update-role'), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        const data = await response.json();
        // Update user data in localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          ...(data?.user || {}),
          role,
          applicationStatus: data?.user?.applicationStatus || 'not_submitted',
          applicationRole: data?.user?.applicationRole || role
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Redirect based on role
        if (role === 'mentee') {
          navigate('/mentee/application');
        } else if (role === 'mentor') {
          navigate('/mentor/application');
        } else if (role === 'admin') {
          navigate('/admin/dashboard');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData?.message || 'Failed to update role. Please try again.');
        setSelectedRole('');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Unable to update role. Please try again.');
      setSelectedRole('');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'mentee',
      title: 'Mentee',
      description: 'I want to learn and be guided by experienced mentors',
      icon: '🎓',
      color: 'tw-from-blue-500 tw-to-blue-600',
      hoverColor: 'tw-from-blue-600 tw-to-blue-700'
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'I want to share my knowledge and guide others',
      icon: '👨‍🏫',
      color: 'tw-from-green-500 tw-to-green-600',
      hoverColor: 'tw-from-green-600 tw-to-green-700'
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'I want to manage the mentoring platform',
      icon: '⚙️',
      color: 'tw-from-purple-500 tw-to-purple-600',
      hoverColor: 'tw-from-purple-600 tw-to-purple-700'
    }
  ];

  return (
    <AuthLayout 
      title="CHOOSE YOUR ROLE" 
      subtitle="Select how you want to participate in the mentoring program"
    >
      <div className="tw-space-y-6">
        {error && (
          <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-text-red-700">
            {error}
          </div>
        )}

        <div className="tw-text-center tw-mb-8">
          <p className="tw-text-gray-600 tw-text-lg">
            How would you like to participate in our mentoring program?
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              disabled={loading}
              className={`tw-relative tw-p-8 tw-rounded-xl tw-border-2 tw-transition-all tw-duration-200 tw-transform hover:tw-scale-105 tw-disabled:tw-opacity-50 tw-disabled:tw-cursor-not-allowed ${
                selectedRole === role.id
                  ? `tw-border-purple-500 tw-bg-gradient-to-r ${role.color} tw-text-white`
                  : 'tw-border-gray-200 tw-bg-white hover:tw-border-purple-300 tw-text-gray-700'
              }`}
            >
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl tw-mb-4">{role.icon}</div>
                <h3 className="tw-text-xl tw-font-bold">{role.title}</h3>
                <p className="tw-text-sm tw-opacity-90">{role.description}</p>
              </div>

              {selectedRole === role.id && (
                <div className="tw-absolute tw-top-4 tw-right-4">
                  <svg className="tw-w-6 tw-h-6 tw-text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="tw-text-center tw-py-4">
            <div className="tw-inline-flex tw-items-center tw-space-x-2">
              <div className="tw-animate-spin tw-rounded-full tw-h-5 tw-w-5 tw-border-b-2 tw-border-purple-500"></div>
              <span className="tw-text-gray-600">Updating your role...</span>
            </div>
          </div>
        )}

        <div className="tw-text-center tw-text-sm tw-text-gray-500">
          <p>You can change your role later in your profile settings</p>
        </div>
      </div>
    </AuthLayout>
  );
}
