import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function MenteeApplicationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    yearLevel: '',
    program: '',
    specificSkills: '',
    major: '',
    programmingLanguage: '',
    motivation: ''
  });
  const [corFile, setCorFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill user data from localStorage
    useEffect(() => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.firstname || !userData.lastname || !userData.email) {
        setError('User data missing. Please log in again.');
      } else {
        setForm(prev => ({
          ...prev,
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email
        }));
      }
    }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setCorFile(e.target.files[0]);
  };

  const handleMajorSelect = (major) => {
    setForm(prev => ({ ...prev, major }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key]) formData.append(key, form[key]);
      });
      if (corFile) formData.append('corFile', corFile);

      const response = await fetch(`${API_BASE}/api/mentee/application/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to submit application. Please try again.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        applicationStatus: data?.applicationStatus || 'pending',
        applicationRole: 'mentee'
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/mentee/pending');
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const majors = [
    'Computer Programming',
    'Web Development', 
    'Database Management',
    'Networking'
  ];

  const programmingLanguages = [
    'C', 'Java', 'Python', 'JavaScript', 'C++', 'Ruby', 'Go', 'PHP', 'Swift', 'Kotlin'
  ];

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <DashboardLayout>
      <div className="tw-min-h-screen tw-bg-gray-50 tw-py-8">
        <div className="tw-max-w-4xl tw-mx-auto tw-px-4">
          {/* Header */}
          <div className="tw-text-center tw-mb-8">
            <h1 className="tw-text-4xl tw-font-bold tw-text-gray-900 tw-mb-4">
              Mentee Application Form
            </h1>
            <p className="tw-text-lg tw-text-gray-600">
              Complete your application to join the mentoring program
            </p>
          </div>

          {/* Application Form */}
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-8">
            <form onSubmit={handleSubmit} className="tw-space-y-8">
              {error && (
                <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-text-red-700">
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Personal Information
                </h2>
                
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
                  {/* Firstname */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Firstname
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={form.firstname}
                      onChange={handleInputChange}
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>

                  {/* Lastname */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Lastname
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={form.lastname}
                      onChange={handleInputChange}
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-6">
                  {/* Year Level */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Year Level
                    </label>
                    <select
                      name="yearLevel"
                      value={form.yearLevel}
                      onChange={handleInputChange}
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    >
                      <option value="">Select Year Level</option>
                      {yearLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  {/* Program */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Program
                    </label>
                    <input
                      type="text"
                      name="program"
                      value={form.program}
                      onChange={handleInputChange}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>

                  {/* Specific Skills */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Specific Skills
                    </label>
                    <input
                      type="text"
                      name="specificSkills"
                      value={form.specificSkills}
                      onChange={handleInputChange}
                      placeholder="e.g., React, Node.js, Python"
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>

                  {/* COR Upload */}
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Certificate of Registration
                    </label>
                    <label className="tw-flex tw-items-center tw-justify-center tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-cursor-pointer tw-transition-colors hover:tw-bg-gray-50">
                      <svg className="tw-w-5 tw-h-5 tw-mr-2 tw-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="tw-text-sm tw-text-gray-600">
                        {corFile ? corFile.name : 'Please insert COR'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="tw-hidden"
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Area of Interest */}
              <div className="tw-space-y-6">
                <div>
                  <p className="tw-text-gray-600 tw-mb-4">
                    Choose a major based on your area of interest. This helps us match you with the right mentor or mentee.
                  </p>
                  <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
                    {majors.map(major => (
                      <button
                        key={major}
                        type="button"
                        onClick={() => handleMajorSelect(major)}
                        className={`tw-px-4 tw-py-3 tw-rounded-lg tw-font-medium tw-transition-colors ${
                          form.major === major
                            ? 'tw-bg-purple-600 tw-text-white tw-shadow-md'
                            : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                        }`}
                      >
                        {major}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Programming Language */}
              <div className="tw-space-y-6">
                <div>
                  <p className="tw-text-gray-600 tw-mb-4">Choose a Programming language.</p>
                  <select
                    name="programmingLanguage"
                    value={form.programmingLanguage}
                    onChange={handleInputChange}
                    className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                    required
                  >
                    <option value="">Select Programming Language</option>
                    {programmingLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Motivation */}
              <div className="tw-space-y-6">
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                    Why do you want to join this program? (Optional)
                  </label>
                  <textarea
                    name="motivation"
                    value={form.motivation}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Tell us about your goals and what you hope to achieve through this mentoring program..."
                    className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="tw-flex tw-justify-end tw-pt-6 tw-border-t tw-border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="tw-px-8 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-font-semibold tw-rounded-xl tw-transition-colors tw-uppercase tw-disabled:tw-opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

