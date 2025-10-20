import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Mentoring Program Information System
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Innovating Mentorship Through a Centralized Information System that Improves Accessibility, 
              Strengthens Collaboration, and Enhances the Overall Mentoring Experience.
            </p>
            <Link 
              to="/register" 
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              Get Started
            </Link>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">👥</div>
                <p className="text-gray-600">Mentoring Illustration</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
