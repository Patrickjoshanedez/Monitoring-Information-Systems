import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              About Us
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              The Computer Society at Bukidnon State University is dedicated to fostering 
              innovation and collaboration in the field of information technology. Our 
              mentoring program connects experienced professionals with aspiring students 
              to create meaningful learning experiences.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Through our centralized information system, we aim to improve accessibility, 
              strengthen collaboration, and enhance the overall mentoring experience for 
              all participants in our community.
            </p>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎓</div>
                <p className="text-gray-600">About Our Mission</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
