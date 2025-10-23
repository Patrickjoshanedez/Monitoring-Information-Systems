import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="tw-bg-primary tw-text-white tw-py-8 tw-mt-12">
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-8">
          <div>
            <h3 className="tw-text-lg tw-font-bold tw-mb-4">ComSoc</h3>
            <p className="tw-text-sm tw-text-purple-200">
              Connecting mentors and mentees for academic success.
            </p>
          </div>
          <div>
            <h4 className="tw-font-semibold tw-mb-4">Quick Links</h4>
            <ul className="tw-space-y-2 tw-text-sm">
              <li><a href="#" className="hover:tw-text-purple-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:tw-text-purple-200">Terms of Service</a></li>
              <li><a href="#" className="hover:tw-text-purple-200">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="tw-font-semibold tw-mb-4">Connect</h4>
            <p className="tw-text-sm tw-text-purple-200">
              © 2025 ComSoc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

