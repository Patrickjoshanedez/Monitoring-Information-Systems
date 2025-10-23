import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'tw-text-primary tw-font-medium' : 'tw-text-gray-600 hover:tw-text-primary';
  };

  return (
    <header className="tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-4">
        <div className="tw-w-12 tw-h-12 tw-bg-gray-200 tw-rounded-full tw-flex tw-items-center tw-justify-center">
          <div className="tw-w-8 tw-h-8 tw-bg-gradient-to-br tw-from-blue-500 tw-to-orange-500 tw-rounded-full"></div>
        </div>
        <nav className="tw-hidden md:tw-flex tw-gap-6">
          <Link to="/about" className={isActive('/about')}>About</Link>
          <Link to="/how-it-works" className={isActive('/how-it-works')}>How it works</Link>
          <Link to="/features" className={isActive('/features')}>Features</Link>
          <Link to="/contact" className={isActive('/contact')}>Contact</Link>
        </nav>
      </div>
      <div className="tw-flex tw-gap-3">
        <Link to="/register" className="tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-gray-700 hover:tw-border-primary">
          Sign up
        </Link>
        <Link to="/login" className="tw-px-4 tw-py-2 tw-bg-primary tw-text-white tw-rounded-lg hover:tw-bg-primary-dark">
          Login
        </Link>
      </div>
    </header>
  );
}
