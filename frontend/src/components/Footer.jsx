import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="tw-px-6 tw-py-8 tw-border-t tw-border-gray-200 tw-bg-white">
      <div className="tw-max-w-6xl tw-mx-auto">
        <div className="tw-text-sm tw-text-gray-500 tw-space-y-2">
          <p>© 2025 Computer Society</p>
          <p>Mentoring Program Information System.</p>
          <p>All Rights Reserved.</p>
          <div className="tw-flex tw-gap-4 tw-mt-4">
            <Link to="/privacy" className="hover:tw-text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:tw-text-primary">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
