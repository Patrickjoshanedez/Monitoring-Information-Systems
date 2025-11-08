import React, { useState, useMemo } from 'react';
import { useMaterials } from '../../shared/hooks/useMaterials';
import { downloadMaterial } from '../../shared/services/materialsService';

const MaterialsLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useMaterials({ search: search || undefined, limit: 30 });

  const filtered = useMemo(() => data?.materials || [], [data]);

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-p-6">
        <div className="tw-animate-spin tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500 tw-rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
        <div className="tw-text-red-700 tw-font-medium">Failed to load materials.</div>
        <button onClick={() => refetch()} className="tw-mt-2 tw-text-sm tw-text-red-600 hover:tw-text-red-800">Retry</button>
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 tw-shadow-sm">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Materials Library</h2>
        <div className="tw-flex tw-gap-2">
          <input
            aria-label="Search materials"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title..."
            className="tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 tw-text-sm"
          />
        </div>
      </div>
      {filtered.length === 0 && (
        <div className="tw-text-sm tw-text-gray-500 tw-py-6 tw-text-center" role="status">No materials found.</div>
      )}
      <ul className="tw-divide-y tw-divide-gray-200" role="list">
        {filtered.map((m) => (
          <li key={m.id} className="tw-py-3 tw-flex tw-items-start tw-justify-between">
            <div>
              <div className="tw-font-medium tw-text-gray-900 tw-mb-1">{m.title}</div>
              {m.description && <div className="tw-text-sm tw-text-gray-600 tw-mb-1">{m.description}</div>}
              <div className="tw-flex tw-flex-wrap tw-gap-1">
                {m.tags.map((t) => (
                  <span key={t} className="tw-bg-gray-100 tw-text-gray-600 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded">{t}</span>
                ))}
              </div>
              <div className="tw-text-xs tw-text-gray-400 tw-mt-1">{Math.round(m.sizeBytes / 1024)} KB</div>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <button
                onClick={() => downloadMaterial(m.id)}
                className="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-text-sm tw-font-medium tw-px-3 tw-py-1 tw-rounded tw-transition-colors"
              >
                Download
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(MaterialsLibrary);
