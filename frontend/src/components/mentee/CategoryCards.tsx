import React, { useState } from 'react';

const CategoryCards: React.FC = () => {
  const categories = [
    'Computer Programming',
    'Networking',
    'Web Development',
    'Database Management',
    'Application Development'
  ];

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4 tw-mb-8">
      {categories.map((category, index) => (
        <div
          key={index}
          className="tw-relative tw-h-32 tw-rounded-lg tw-overflow-hidden tw-cursor-pointer hover:tw-transform hover:tw-scale-105 tw-transition-transform"
          style={{
            background: 'linear-gradient(to bottom, #3b82f6 0%, #8b5cf6 100%)'
          }}
        >
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-end tw-p-4 tw-bg-gradient-to-t tw-from-purple-600 tw-to-transparent">
            <span className="tw-text-white tw-font-semibold tw-text-sm">{category}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryCards;

