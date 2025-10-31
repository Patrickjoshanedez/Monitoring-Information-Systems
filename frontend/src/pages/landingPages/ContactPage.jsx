import React from 'react';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import PageTransition from '../../shared/ui/PageTransition';

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
    <div className="tw-min-h-screen tw-bg-white tw-text-gray-900  ">
      <Header />

      {/* Main Content + Footer animated; Header remains static */}
      <PageTransition>
      <main className="tw-px-6 tw-py-12">
        <div className="tw-max-w-6xl tw-mx-auto tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-start">
          {/* Left Content */}
          <div className="tw-space-y-8">
            <h1 className="tw-text-5xl tw-font-bold tw-text-gray-900 tw-leading-tight ">
              Contact us
            </h1>
            
            <div className="tw-space-y-6">
              {contactInfo.map((item, index) => (
                <div key={index} className="tw-flex tw-items-start tw-gap-4">
                  <div className="tw-text-2xl">{item.icon}</div>
                  <div>
                    <p className="tw-text-gray-600 ">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="tw-relative">
            <div className="tw-bg-gradient-to-br tw-from-purple-100 tw-to-purple-200 tw-rounded-2xl tw-p-8 tw-h-96 tw-flex tw-items-center tw-justify-center  ">
              <div className="tw-text-center tw-space-y-4">
                <div className="tw-text-6xl">📞</div>
                <p className="tw-text-gray-600 ">Get in Touch</p>
              </div>
            </div>
          </div>
        </div>
  </main>
  <Footer />
  </PageTransition>
    </div>
  );
}
