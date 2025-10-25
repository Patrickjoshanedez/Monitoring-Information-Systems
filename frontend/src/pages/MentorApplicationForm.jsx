import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import RecaptchaField from '../components/common/RecaptchaField.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const expertiseOptions = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'UI/UX Design',
  'Cloud Computing',
  'Cybersecurity',
  'Project Management',
  'Product Strategy'
];

const mentoringTopicsOptions = [
  'Career Guidance',
  'Technical Coaching',
  'Soft Skills',
  'Interview Preparation',
  'Leadership',
  'Capstone Support',
  'Entrepreneurship',
  'Research mentoring'
];

const availabilityDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const meetingFormatsOptions = ['On-site', 'Virtual', 'Hybrid'];

export default function MentorApplicationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    currentRole: '',
    organization: '',
    yearsOfExperience: '',
    mentoringGoals: '',
    professionalSummary: '',
    achievements: '',
    linkedinUrl: '',
    portfolioUrl: '',
    motivation: '',
    availabilityHoursPerWeek: '',
    expertiseAreas: [],
    mentoringTopics: [],
    availabilityDays: [],
    meetingFormats: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.firstname || !userData.lastname || !userData.email) {
      setError('User data missing. Please log in again.');
    } else {
      setForm((prev) => ({
        ...prev,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (key, value) => {
    setForm((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((item) => item !== value) : [...current, value]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecaptchaError('');
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the verification step.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/mentor/application/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
          availabilityHoursPerWeek: form.availabilityHoursPerWeek ? Number(form.availabilityHoursPerWeek) : undefined,
          recaptchaToken
        })
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
        applicationRole: 'mentor'
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/mentor/pending');
    } catch (err) {
      console.error('Mentor application submission failed:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
    }
  };

  return (
    <DashboardLayout>
      <div className="tw-min-h-screen tw-bg-gray-50 tw-py-8">
        <div className="tw-max-w-5xl tw-mx-auto tw-px-4">
          <div className="tw-text-center tw-mb-8">
            <h1 className="tw-text-4xl tw-font-bold tw-text-gray-900 tw-mb-4">
              Mentor Application Form
            </h1>
            <p className="tw-text-lg tw-text-gray-600">
              Share your expertise to help mentees accelerate their growth.
            </p>
          </div>

          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-8">
            {error && (
              <div className="tw-mb-6 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="tw-space-y-8">
              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Personal Information
                </h2>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
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
              </section>

              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Professional Background
                </h2>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Current Role / Position
                    </label>
                    <input
                      type="text"
                      name="currentRole"
                      value={form.currentRole}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer, Product Manager"
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Organization / Affiliation (Optional)
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={form.organization}
                      onChange={handleInputChange}
                      placeholder="Company, Institution, or Organization"
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Years of Professional Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="yearsOfExperience"
                      value={form.yearsOfExperience}
                      onChange={handleInputChange}
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      required
                    />
                  </div>
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                        LinkedIn Profile (Optional)
                      </label>
                      <input
                        type="url"
                        name="linkedinUrl"
                        value={form.linkedinUrl}
                        onChange={handleInputChange}
                        placeholder="https://"
                        className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                        Portfolio or Website (Optional)
                      </label>
                      <input
                        type="url"
                        name="portfolioUrl"
                        value={form.portfolioUrl}
                        onChange={handleInputChange}
                        placeholder="https://"
                        className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Areas of Expertise
                </h2>
                <p className="tw-text-gray-600">
                  Select the domains where you can provide the most value. Choose all that apply.
                </p>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
                  {expertiseOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleSelection('expertiseAreas', option)}
                      className={`tw-px-4 tw-py-3 tw-rounded-lg tw-font-medium tw-text-sm tw-transition-colors ${
                        form.expertiseAreas.includes(option)
                          ? 'tw-bg-purple-600 tw-text-white tw-shadow-md'
                          : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </section>

              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Mentoring Focus
                </h2>
                <p className="tw-text-gray-600">
                  Indicate the topics you are most comfortable guiding mentees through.
                </p>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
                  {mentoringTopicsOptions.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleSelection('mentoringTopics', topic)}
                      className={`tw-px-4 tw-py-3 tw-rounded-lg tw-font-medium tw-text-sm tw-transition-colors ${
                        form.mentoringTopics.includes(topic)
                          ? 'tw-bg-purple-600 tw-text-white tw-shadow-md'
                          : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </section>

              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Availability & Commitment
                </h2>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-3">
                      Preferred Days for Sessions
                    </label>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                      {availabilityDaysOptions.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleSelection('availabilityDays', day)}
                          className={`tw-px-4 tw-py-2 tw-rounded-lg tw-font-medium tw-text-sm tw-transition-colors ${
                            form.availabilityDays.includes(day)
                              ? 'tw-bg-purple-600 tw-text-white tw-shadow-md'
                              : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="tw-space-y-4">
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                        Estimated Hours per Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        name="availabilityHoursPerWeek"
                        value={form.availabilityHoursPerWeek}
                        onChange={handleInputChange}
                        placeholder="e.g., 3"
                        className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors"
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-3">
                        Preferred Session Format
                      </label>
                      <div className="tw-flex tw-flex-wrap tw-gap-3">
                        {meetingFormatsOptions.map((format) => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => toggleSelection('meetingFormats', format)}
                            className={`tw-px-4 tw-py-2 tw-rounded-lg tw-font-medium tw-text-sm tw-transition-colors ${
                              form.meetingFormats.includes(format)
                                ? 'tw-bg-purple-600 tw-text-white tw-shadow-md'
                                : 'tw-bg-gray-100 tw-text-gray-700 hover:tw-bg-gray-200'
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="tw-space-y-6">
                <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-border-b tw-border-gray-200 tw-pb-2">
                  Tell Us More About Your Mentorship Style
                </h2>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Brief Professional Summary
                    </label>
                    <textarea
                      name="professionalSummary"
                      value={form.professionalSummary}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Highlight your expertise, teaching style, and mentoring philosophy."
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Notable Achievements (Optional)
                    </label>
                    <textarea
                      name="achievements"
                      value={form.achievements}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Awards, certifications, successful projects, or mentorship highlights."
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-resize-none"
                    />
                  </div>
                </div>
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Mentoring Goals
                    </label>
                    <textarea
                      name="mentoringGoals"
                      value={form.mentoringGoals}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="What outcomes do you hope your mentees achieve?"
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-purple-600 tw-mb-2">
                      Why do you want to be a mentor? (Optional)
                    </label>
                    <textarea
                      name="motivation"
                      value={form.motivation}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell us about your motivation for joining the mentoring program."
                      className="tw-w-full tw-px-4 tw-py-3 tw-border-2 tw-border-gray-300 focus:tw-border-purple-500 tw-rounded-xl tw-outline-none tw-transition-colors tw-resize-none"
                    />
                  </div>
                </div>
              </section>

              <div>
                <RecaptchaField
                  ref={recaptchaRef}
                  onChange={(token) => {
                    setRecaptchaToken(token || '');
                    if (token) {
                      setRecaptchaError('');
                    }
                  }}
                  onExpired={() => {
                    setRecaptchaToken('');
                    setRecaptchaError('Verification expired, please try again.');
                  }}
                />
                {recaptchaError && (
                  <p className="tw-mt-2 tw-text-xs tw-text-red-600 dark:tw-text-red-300">{recaptchaError}</p>
                )}
              </div>

              <div className="tw-flex tw-justify-end tw-pt-6 tw-border-t tw-border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="tw-px-8 tw-py-3 tw-bg-purple-600 hover:tw-bg-purple-700 tw-text-white tw-font-semibold tw-rounded-xl tw-transition-colors tw-uppercase tw-disabled:tw-opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
