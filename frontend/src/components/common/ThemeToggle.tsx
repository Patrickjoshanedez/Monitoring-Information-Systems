import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="tw-group tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-gray-600 tw-transition hover:tw-border-primary hover:tw-text-primary focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/40 dark:tw-border-slate-600 dark:tw-bg-slate-800 dark:tw-text-slate-200"
      aria-label={`Activate ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="tw-relative tw-flex tw-h-5 tw-w-10 tw-items-center tw-rounded-full tw-bg-gray-200 tw-transition-colors dark:tw-bg-slate-700">
        <span
          className={`tw-absolute tw-h-4 tw-w-4 tw-rounded-full tw-bg-gradient-to-br tw-from-yellow-400 tw-to-orange-500 tw-transition-transform tw-duration-300 tw-ease-out dark:tw-from-blue-400 dark:tw-to-purple-500 ${
            isDark ? 'tw-translate-x-4' : 'tw-translate-x-0'
          }`}
        />
      </span>
      <span className="tw-hidden sm:tw-inline tw-transition-colors dark:tw-text-slate-200">
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
