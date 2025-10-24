import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Hide the main navigation on application-related pages where a simplified UI is desired
  const hideNavOnPaths = ['/mentee/application', '/mentee/pending'];
  const hideNav = hideNavOnPaths.includes(location.pathname);

  return (
    <header className="tw-bg-primary tw-text-white tw-shadow-lg">
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
          {/* Logo */}
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Link to="/mentee/dashboard">
              <h1 className="tw-text-2xl tw-font-bold">ComSoc</h1>
            </Link>
          </div>

          {/* Navigation - hidden on application pages to reduce clutter */}
          {!hideNav && (
            <nav className="tw-hidden md:tw-flex tw-items-center tw-space-x-8">
            <Link
              to="/mentee/dashboard"
              className={`tw-font-medium tw-transition-colors ${
                isActive('/mentee/dashboard')
                  ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                  : 'tw-text-white hover:tw-text-purple-200'
              }`}
            >
              Home
            </Link>
            <Link
              to="/mentee/my-mentor"
              className={`tw-font-medium tw-transition-colors ${
                isActive('/mentee/my-mentor')
                  ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                  : 'tw-text-white hover:tw-text-purple-200'
              }`}
            >
              My Mentor
            </Link>
            <Link
              to="/mentee/session"
              className={`tw-font-medium tw-transition-colors ${
                isActive('/mentee/session')
                  ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                  : 'tw-text-white hover:tw-text-purple-200'
              }`}
            >
              Session
            </Link>
            <Link
              to="/mentee/apply"
              className={`tw-font-medium tw-transition-colors ${
                isActive('/mentee/apply')
                  ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                  : 'tw-text-white hover:tw-text-purple-200'
              }`}
            >
              Apply
            </Link>
            <Link
              to="/mentee/announcements"
              className={`tw-font-medium tw-transition-colors ${
                isActive('/mentee/announcements')
                  ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                  : 'tw-text-white hover:tw-text-purple-200'
              }`}
            >
              Announcements
            </Link>
            </nav>
          )}

          {/* User Avatar */}
          <div className="tw-flex tw-items-center tw-space-x-3">
            <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center">
              <span className="tw-text-primary tw-font-bold">K</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

