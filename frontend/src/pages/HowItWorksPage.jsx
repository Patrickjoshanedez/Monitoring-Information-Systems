import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function HowItWorksPage() {
  return (
    <div className="tw-min-h-screen tw-bg-white tw-text-gray-900  ">
      <Header />

      {/* Main Content */}
      <main className="tw-px-6 tw-py-12">
        <div className="tw-max-w-6xl tw-mx-auto tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-center">
          {/* Left Content */}
          <div className="tw-space-y-8">
            <h1 className="tw-text-5xl tw-font-bold tw-text-gray-900 tw-leading-tight ">
              How it works
            </h1>
            
            <div className="tw-space-y-4">
              <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-border tw-border-primary/20 tw-rounded-xl">
                <div className="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm">1</div>
                <p className="tw-text-gray-700 ">Click "Register", enter student email and password</p>
              </div>
              
              <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-border tw-border-primary/20 tw-rounded-xl">
                <div className="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm">2</div>
                <p className="tw-text-gray-700 ">Verify email with Code</p>
              </div>
              
              <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-border tw-border-primary/20 tw-rounded-xl">
                <div className="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm">3</div>
                <p className="tw-text-gray-700 ">Choose your role</p>
              </div>
              
              <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-border tw-border-primary/20 tw-rounded-xl">
                <div className="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm">4</div>
                <p className="tw-text-gray-700 ">Fill up application form</p>
              </div>
              
              <div className="tw-flex tw-items-start tw-gap-4 tw-p-4 tw-border tw-border-primary/20 tw-rounded-xl">
                <div className="tw-w-8 tw-h-8 tw-bg-primary tw-text-white tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm">5</div>
                <p className="tw-text-gray-700 ">Wait for the approval</p>
              </div>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="tw-relative">
            <div className="tw-bg-gradient-to-br tw-from-purple-100 tw-to-purple-200 tw-rounded-2xl tw-p-8 tw-h-96 tw-flex tw-items-center tw-justify-center  ">
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl">💻</div>
                <p className="tw-text-gray-600 ">Mentoring Process</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
