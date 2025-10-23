import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="tw-min-h-screen tw-bg-white">
      <Header />

      {/* Hero Section */}
      <main className="tw-px-6 tw-py-12">
        <div className="tw-max-w-6xl tw-mx-auto tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-center">
          {/* Left Content */}
          <div className="tw-space-y-8">
            <h1 className="tw-text-5xl tw-font-bold tw-text-gray-900 tw-leading-tight">
              Mentoring Program Information System
            </h1>
            <p className="tw-text-xl tw-text-gray-600 tw-leading-relaxed">
              Innovating Mentorship Through a Centralized Information System that Improves Accessibility, 
              Strengthens Collaboration, and Enhances the Overall Mentoring Experience.
            </p>
            <Link 
              to="/register" 
              className="tw-inline-block tw-px-8 tw-py-4 tw-bg-gradient-to-r tw-from-primary tw-to-accent tw-text-white tw-rounded-xl tw-font-semibold tw-text-lg tw-shadow-lg hover:tw-shadow-xl tw-transition-shadow"
            >
              Get Started
            </Link>
          </div>

          {/* Right Illustration */}
          <div className="tw-relative">
            <div className="tw-bg-gradient-to-br tw-from-purple-100 tw-to-purple-200 tw-rounded-2xl tw-p-8 tw-h-96 tw-flex tw-items-center tw-justify-center">
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl">👥</div>
                <p className="tw-text-gray-600">Mentoring Illustration</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
