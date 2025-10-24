import React, { useState, useEffect } from 'react';

export default function ApplicationReviewPanel() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/admin/applications?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(`/api/admin/applications/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchApplications(); // Refresh the list
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to approve application:', error);
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await fetch(`/api/admin/applications/${userId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchApplications(); // Refresh the list
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  const openApplicationDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const openRoleModal = (application) => {
    setSelectedUser(application);
    setShowRoleModal(true);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchApplications(); // Refresh the list
        setShowRoleModal(false);
        alert(`User role updated to ${newRole}`);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
      {/* Header */}
      <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-justify-between tw-items-center">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Application Review</h2>
          <div className="tw-flex tw-space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-purple-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="tw-overflow-x-auto">
        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
          <thead className="tw-bg-gray-50">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Name
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Email
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Major
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Programming Language
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Submitted
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Status
              </th>
              <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
            {applications.map((application) => (
              <tr key={application._id} className="hover:tw-bg-gray-50">
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <div className="tw-text-sm tw-font-medium tw-text-gray-900">
                    {application.firstname} {application.lastname}
                  </div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <div className="tw-text-sm tw-text-gray-900">{application.email}</div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <div className="tw-text-sm tw-text-gray-900">{application.applicationData?.major}</div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <div className="tw-text-sm tw-text-gray-900">{application.applicationData?.programmingLanguage}</div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <div className="tw-text-sm tw-text-gray-900">
                    {new Date(application.applicationSubmittedAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                  <span
                    className={`tw-inline-flex tw-px-2 tw-py-1 tw-text-xs tw-font-semibold tw-rounded-full ${
                      application.applicationStatus === 'approved'
                        ? 'tw-bg-green-100 tw-text-green-800'
                        : application.applicationStatus === 'pending'
                        ? 'tw-bg-yellow-100 tw-text-yellow-800'
                        : 'tw-bg-red-100 tw-text-red-800'
                    }`}
                  >
                    {application.applicationStatus}
                  </span>
                </td>
                <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium">
                  <div className="tw-flex tw-space-x-2">
                    <button
                      onClick={() => openApplicationDetails(application)}
                      className="tw-text-purple-600 hover:tw-text-purple-900"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openRoleModal(application)}
                      className="tw-text-blue-600 hover:tw-text-blue-900"
                    >
                      Change Role
                    </button>
                    {application.applicationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(application._id)}
                          className="tw-text-green-600 hover:tw-text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(application._id)}
                          className="tw-text-red-600 hover:tw-text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {applications.length === 0 && (
        <div className="tw-text-center tw-py-12">
          <div className="tw-text-gray-400 tw-text-6xl tw-mb-4">📋</div>
          <p className="tw-text-gray-500 tw-text-lg">No applications found</p>
          <p className="tw-text-gray-400 tw-text-sm tw-mt-1">
            {filter === 'pending' ? 'No pending applications' : 'No applications match the current filter'}
          </p>
        </div>
      )}

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-max-w-2xl tw-w-full tw-mx-4 tw-max-h-96 tw-overflow-y-auto">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
              <div className="tw-flex tw-justify-between tw-items-center">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  Application Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="tw-text-gray-400 hover:tw-text-gray-600"
                >
                  <svg className="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="tw-px-6 tw-py-4 tw-space-y-4">
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Name</label>
                  <p className="tw-text-sm tw-text-gray-900">
                    {selectedApplication.firstname} {selectedApplication.lastname}
                  </p>
                </div>
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Email</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Year Level</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData?.yearLevel}</p>
                </div>
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Program</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData?.program}</p>
                </div>
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Major</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData?.major}</p>
                </div>
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Programming Language</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData?.programmingLanguage}</p>
                </div>
              </div>
              
              <div>
                <label className="tw-text-sm tw-font-medium tw-text-gray-500">Specific Skills</label>
                <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData?.specificSkills}</p>
              </div>
              
              {selectedApplication.applicationData?.motivation && (
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Motivation</label>
                  <p className="tw-text-sm tw-text-gray-900">{selectedApplication.applicationData.motivation}</p>
                </div>
              )}
              
              {selectedApplication.applicationData?.corUrl && (
                <div>
                  <label className="tw-text-sm tw-font-medium tw-text-gray-500">Certificate of Registration</label>
                  <a
                    href={selectedApplication.applicationData.corUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw-text-sm tw-text-purple-600 hover:tw-text-purple-800"
                  >
                    View COR
                  </a>
                </div>
              )}
            </div>
            
            {selectedApplication.applicationStatus === 'pending' && (
              <div className="tw-px-6 tw-py-4 tw-border-t tw-border-gray-200 tw-flex tw-justify-end tw-space-x-3">
                <button
                  onClick={() => handleReject(selectedApplication._id)}
                  className="tw-px-4 tw-py-2 tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-rounded-lg tw-text-sm tw-font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedApplication._id)}
                  className="tw-px-4 tw-py-2 tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-rounded-lg tw-text-sm tw-font-medium"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && selectedUser && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-max-w-md tw-w-full tw-mx-4">
            <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
              <div className="tw-flex tw-justify-between tw-items-center">
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                  Change User Role
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="tw-text-gray-400 hover:tw-text-gray-600"
                >
                  <svg className="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="tw-px-6 tw-py-4">
              <div className="tw-mb-4">
                <p className="tw-text-sm tw-text-gray-600 tw-mb-2">
                  Current user: <span className="tw-font-medium">{selectedUser.firstname} {selectedUser.lastname}</span>
                </p>
                <p className="tw-text-sm tw-text-gray-600">
                  Current role: <span className="tw-font-medium tw-capitalize">{selectedUser.role}</span>
                </p>
              </div>

              <div className="tw-space-y-3">
                <h4 className="tw-text-sm tw-font-medium tw-text-gray-700">Select new role:</h4>
                
                <div className="tw-space-y-2">
                  {['mentee', 'mentor', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleUpdate(selectedUser._id, role)}
                      className={`tw-w-full tw-px-4 tw-py-3 tw-text-left tw-rounded-lg tw-border tw-transition-colors ${
                        selectedUser.role === role
                          ? 'tw-border-purple-500 tw-bg-purple-50 tw-text-purple-700'
                          : 'tw-border-gray-200 hover:tw-border-purple-300 hover:tw-bg-purple-50'
                      }`}
                    >
                      <div className="tw-flex tw-items-center tw-space-x-3">
                        <div className="tw-w-4 tw-h-4 tw-rounded-full tw-border-2 tw-border-gray-300 tw-flex tw-items-center tw-justify-center">
                          {selectedUser.role === role && (
                            <div className="tw-w-2 tw-h-2 tw-bg-purple-500 tw-rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="tw-font-medium tw-capitalize">{role}</div>
                          <div className="tw-text-sm tw-text-gray-500">
                            {role === 'mentee' && 'Student seeking guidance'}
                            {role === 'mentor' && 'Experienced professional providing guidance'}
                            {role === 'admin' && 'Platform administrator'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
