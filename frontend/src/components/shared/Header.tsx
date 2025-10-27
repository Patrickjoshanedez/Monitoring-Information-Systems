import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type UserSummary = {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
};

type NavItem = {
  label: string;
  to: string;
  matches: string[];
  hash?: string;
};

const NAV_MAP: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', matches: ['/admin/dashboard'], hash: '' },
    { label: 'Applications', to: '/admin/dashboard#applications', matches: ['/admin/dashboard'], hash: '#applications' }
  ],
  mentor: [
    { label: 'Dashboard', to: '/mentor/dashboard', matches: ['/mentor/dashboard'] }
  ],
  mentee: [
    { label: 'Home', to: '/mentee/dashboard', matches: ['/mentee/dashboard'] },
    { label: 'My Mentor', to: '/mentee/my-mentor', matches: ['/mentee/my-mentor'] },
    { label: 'Session', to: '/mentee/session', matches: ['/mentee/session'] },
    { label: 'Apply', to: '/mentee/apply', matches: ['/mentee/apply'] },
    { label: 'Announcements', to: '/mentee/announcements', matches: ['/mentee/announcements'] }
  ]
};

const HIDE_NAV_PATHS = new Set([
  '/mentee/application',
  '/mentee/pending',
  '/mentor/application',
  '/mentor/pending'
]);

const getStoredUser = (): UserSummary | null => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const normalizedRole = typeof parsed.role === 'string' ? parsed.role.toLowerCase() : undefined;
      return { ...parsed, role: normalizedRole };
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error);
  }
  return null;
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const navItems = useMemo(() => {
    if (!user?.role) {
      return [];
    }
    return NAV_MAP[user.role] || [];
  }, [user?.role]);

  const isActive = (item: NavItem) => {
    if (!item.matches.some((path) => location.pathname.startsWith(path))) {
      return false;
    }
    if (item.hash !== undefined) {
      return (location.hash || '') === item.hash;
    }
    return true;
  };

  const homePath = useMemo(() => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      case 'mentee':
        return '/mentee/dashboard';
      default:
        return '/';
    }
  }, [user?.role]);

  const initials = useMemo(() => {
    if (!user) {
      return '?';
    }
    const first = user.firstname?.charAt(0) || '';
    const last = user.lastname?.charAt(0) || '';
    const combined = `${first}${last}`.trim();
    return combined ? combined.toUpperCase() : (user.email?.charAt(0) || '?').toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return 'Guest';
    }
    if (user.firstname || user.lastname) {
      return `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
    }
    return user.email || 'Account';
  }, [user]);

  const handleShowProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDropdownOpen(false);
    navigate('/login');
  };

  const hideNav = HIDE_NAV_PATHS.has(location.pathname);

  return (
    <header className="tw-bg-primary tw-text-white tw-shadow-lg">
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className="tw-flex tw-justify-between tw-items-center tw-py-4">
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Link to={homePath} className="tw-inline-flex tw-items-center tw-gap-2">
              <h1 className="tw-text-2xl tw-font-bold">ComSoc</h1>
              {user?.role && (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-white/20 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </Link>
          </div>

          {!hideNav && navItems.length > 0 && (
            <nav className="tw-hidden md:tw-flex tw-items-center tw-space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`tw-font-medium tw-transition-colors ${
                    isActive(item)
                      ? 'tw-bg-white tw-text-primary tw-px-3 tw-py-1 tw-rounded'
                      : 'tw-text-white hover:tw-text-purple-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="tw-flex tw-items-center tw-space-x-3">
            <div className="tw-hidden sm:tw-flex tw-flex-col tw-items-end">
              <span className="tw-text-sm tw-font-semibold tw-leading-5">{displayName}</span>
              {user?.email && (
                <span className="tw-text-xs tw-text-white/80 tw-leading-4">{user.email}</span>
              )}
            </div>
            <div className="tw-relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-text-primary tw-font-semibold tw-uppercase hover:tw-shadow-md tw-transition-shadow"
                aria-haspopup="menu"
              >
                {initials}
              </button>
              {dropdownOpen && (
                <div className="tw-absolute tw-right-0 tw-mt-2 tw-w-44 tw-bg-white tw-text-gray-700 tw-rounded-lg tw-shadow-lg tw-border tw-border-gray-100 tw-z-50">
                  <button
                    type="button"
                    onClick={handleShowProfile}
                    className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm hover:tw-bg-gray-100"
                  >
                    Show Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-sm tw-text-red-600 hover:tw-bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

