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
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Features
            </h1>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">⚡</div>
                <p className="text-gray-600">Platform Features</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
