import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary';
  };

  return (
    <header className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <nav className="hidden md:flex gap-6">
          <Link to="/about" className={isActive('/about')}>About</Link>
          <Link to="/how-it-works" className={isActive('/how-it-works')}>How it works</Link>
          <Link to="/features" className={isActive('/features')}>Features</Link>
          <Link to="/contact" className={isActive('/contact')}>Contact</Link>
        </nav>
      </div>
      <div className="flex gap-3">
        <Link to="/register" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-primary">
          Sign up
        </Link>
        <Link to="/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
          Login
        </Link>
      </div>
    </header>
  );
}
