import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function ContactPage() {
  const contactInfo = [
    {
      icon: '✉️',
      label: 'Email',
      value: 'computersociety@university.edu'
    },
    {
      icon: '🏢',
      label: 'Address',
      value: 'Room 204, Old CSDT Building'
    },
    {
      icon: '📞',
      label: 'Phone',
      value: '123 456 789 10'
    },
    {
      icon: '📘',
      label: 'Social Media',
      value: 'Bukidnon State University - Computer Society'
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
              Contact us
            </h1>
            
            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <p className="text-gray-600">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">📞</div>
                <p className="text-gray-600">Get in Touch</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
