import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              How it works
            </h1>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <p className="text-gray-700">Click "Register", enter student email and password</p>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <p className="text-gray-700">Verify email with Code</p>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <p className="text-gray-700">Choose your role</p>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                <p className="text-gray-700">Fill up application form</p>
              </div>
              
              <div className="flex items-start gap-4 p-4 border border-primary/20 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                <p className="text-gray-700">Wait for the approval</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">💻</div>
                <p className="text-gray-600">Mentoring Process</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
