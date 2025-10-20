import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-sm text-gray-500 space-y-2">
          <p>© 2025 Computer Society</p>
          <p>Mentoring Program Information System.</p>
          <p>All Rights Reserved.</p>
          <div className="flex gap-4 mt-4">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
