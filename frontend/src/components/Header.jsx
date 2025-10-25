import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './common/ThemeToggle';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path
      ? 'tw-text-primary tw-font-semibold dark:tw-text-white'
      : 'tw-text-gray-500 hover:tw-text-primary dark:tw-text-slate-400 dark:hover:tw-text-white';
  };

  return (
    <header className="tw-px-6 tw-py-5 tw-flex tw-items-center tw-justify-between tw-bg-white tw-shadow-sm tw-sticky tw-top-0 tw-z-40 tw-border-b tw-border-gray-100 dark:tw-bg-slate-900 dark:tw-border-slate-800 dark:tw-shadow-none">
      <div className="tw-flex tw-items-center tw-gap-6">
        <Link to="/" className="tw-inline-flex tw-items-center tw-gap-3">
          <img src="/logo.svg" alt="ComSoc Mentoring logo" className="tw-h-12 tw-w-12 tw-rounded-xl tw-shadow-sm" />
          <span className="tw-text-xl tw-font-bold tw-text-gray-900 dark:tw-text-white">ComSoc Mentoring</span>
        </Link>
        <nav className="tw-hidden lg:tw-flex tw-items-center tw-gap-6">
          <Link to="/about" className={isActive('/about')}>About</Link>
          <Link to="/how-it-works" className={isActive('/how-it-works')}>How it works</Link>
          <Link to="/features" className={isActive('/features')}>Features</Link>
          <Link to="/contact" className={isActive('/contact')}>Contact</Link>
        </nav>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <ThemeToggle />
        <Link
          to="/register"
          className="tw-hidden sm:tw-inline-flex tw-items-center tw-justify-center tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-border-primary hover:tw-text-primary dark:tw-border-slate-700 dark:tw-text-slate-200 dark:hover:tw-text-white"
        >
          Sign up
        </Link>
        <Link
          to="/login"
          className="tw-inline-flex tw-items-center tw-justify-center tw-px-5 tw-py-2.5 tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold hover:tw-brightness-110"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
