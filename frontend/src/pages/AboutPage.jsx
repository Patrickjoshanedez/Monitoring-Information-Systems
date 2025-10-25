import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function AboutPage() {
  return (
    <div className="tw-min-h-screen tw-bg-white tw-text-gray-900 dark:tw-bg-slate-950 dark:tw-text-slate-100">
      <Header />

      {/* Main Content */}
      <main className="tw-px-6 tw-py-12">
        <div className="tw-max-w-6xl tw-mx-auto tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-center">
          {/* Left Content */}
          <div className="tw-space-y-8">
            <h1 className="tw-text-5xl tw-font-bold tw-text-gray-900 tw-leading-tight dark:tw-text-white">
              About Us
            </h1>
            <p className="tw-text-xl tw-text-gray-600 tw-leading-relaxed dark:tw-text-slate-300">
              The Computer Society at Bukidnon State University is dedicated to fostering 
              innovation and collaboration in the field of information technology. Our 
              mentoring program connects experienced professionals with aspiring students 
              to create meaningful learning experiences.
            </p>
            <p className="tw-text-lg tw-text-gray-600 tw-leading-relaxed dark:tw-text-slate-300">
              Through our centralized information system, we aim to improve accessibility, 
              strengthen collaboration, and enhance the overall mentoring experience for 
              all participants in our community.
            </p>
          </div>

          {/* Right Illustration */}
          <div className="tw-relative">
            <div className="tw-bg-gradient-to-br tw-from-purple-100 tw-to-purple-200 tw-rounded-2xl tw-p-8 tw-h-96 tw-flex tw-items-center tw-justify-center dark:tw-from-purple-900/40 dark:tw-to-purple-700/30">
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl">🎓</div>
                <p className="tw-text-gray-600 dark:tw-text-slate-200">About Our Mission</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
