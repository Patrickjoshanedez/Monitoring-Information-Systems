import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function FeaturesPage() {
  const features = [
    {
      icon: '👥',
      title: 'User Management',
      description: 'Comprehensive user management system for mentors, mentees, and administrators'
    },
    {
      icon: '📋',
      title: 'Mentor-Mentee Matching',
      description: 'Intelligent matching algorithm to pair mentors with suitable mentees'
    },
    {
      icon: '📅',
      title: 'Scheduling & Session Tracking',
      description: 'Easy scheduling and tracking of mentoring sessions and progress'
    },
    {
      icon: '👍',
      title: 'Feedback & Evaluation',
      description: 'Built-in feedback system for continuous improvement and evaluation'
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'Comprehensive reporting and analytics for program insights'
    },
    {
      icon: '🏆',
      title: 'Certificates & Recognition',
      description: 'Automated certificate generation and recognition system'
    }
  ];

  return (
    <div className="tw-min-h-screen tw-bg-white">
      <Header />

      {/* Main Content */}
      <main className="tw-px-6 tw-py-12">
        <div className="tw-max-w-6xl tw-mx-auto tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-start">
          {/* Left Content */}
          <div className="tw-space-y-8">
            <h1 className="tw-text-5xl tw-font-bold tw-text-gray-900 tw-leading-tight">
              Features
            </h1>
            
            <div className="tw-space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="tw-flex tw-items-start tw-gap-4">
                  <div className="tw-text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-2">{feature.title}</h3>
                    <p className="tw-text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="tw-relative">
            <div className="tw-bg-gradient-to-br tw-from-purple-100 tw-to-purple-200 tw-rounded-2xl tw-p-8 tw-h-96 tw-flex tw-items-center tw-justify-center">
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl">⚡</div>
                <p className="tw-text-gray-600">Platform Features</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
