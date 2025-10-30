import React, { useCallback } from 'react';
import { useMentorshipRequests } from '../../features/mentorship/hooks/useMentorshipRequests';

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const base = 'tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium';
  const map: Record<string, string> = {
    pending: 'tw-bg-yellow-100 tw-text-yellow-800',
    accepted: 'tw-bg-green-100 tw-text-green-800',
    declined: 'tw-bg-red-100 tw-text-red-800',
    withdrawn: 'tw-bg-gray-100 tw-text-gray-700',
  };
  const cls = map[status] || 'tw-bg-gray-100 tw-text-gray-800';
  return <span className={`${base} ${cls}`}>{status}</span>;
};

const MentorRequestsTable: React.FC = () => {
  const { requests, isLoading, isRefetching, meta, acceptRequest, declineRequest, isMutating } = useMentorshipRequests('mentor');

  const handleAccept = useCallback(async (id: string) => {
    const sessionSuggestion = window.prompt('Suggest a first session slot (optional):');
    await acceptRequest(id, sessionSuggestion || undefined);
  }, [acceptRequest]);

  const handleDecline = useCallback(async (id: string) => {
    const declineReason = window.prompt('Provide a reason for declining (optional):');
    await declineRequest(id, declineReason || undefined);
  }, [declineRequest]);

  if (isLoading && !isRefetching) {
    return (
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
        <div className="tw-animate-pulse tw-space-y-3">
          <div className="tw-h-5 tw-bg-gray-200 tw-rounded tw-w-1/3" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-full" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-5/6" />
          <div className="tw-h-4 tw-bg-gray-200 tw-rounded tw-w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Mentorship Requests</h2>
        <div className="tw-text-sm tw-text-gray-500">Total: {meta.total} • Pending: {meta.pending}</div>
      </div>

      {requests.length === 0 ? (
        <div className="tw-text-gray-500">No requests yet.</div>
      ) : (
        <div className="tw-overflow-x-auto">
          <table className="tw-min-w-full tw-text-left tw-text-sm">
            <thead>
              <tr className="tw-border-b tw-border-gray-200 tw-text-gray-600">
                <th className="tw-py-2">Subject</th>
                <th className="tw-py-2">Mentee</th>
                <th className="tw-py-2">Requested</th>
                <th className="tw-py-2">Preferred Slot</th>
                <th className="tw-py-2">Status</th>
                <th className="tw-py-2 tw-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="tw-border-b tw-border-gray-100 hover:tw-bg-gray-50/50">
                  <td className="tw-py-2 tw-pr-4 tw-font-medium tw-text-gray-900">{r.subject}</td>
                  <td className="tw-py-2 tw-pr-4">{r.mentee?.name || '—'}</td>
                  <td className="tw-py-2 tw-pr-4">{fmt(r.createdAt)}</td>
                  <td className="tw-py-2 tw-pr-4">{r.preferredSlot || '—'}</td>
                  <td className="tw-py-2 tw-pr-4"><StatusPill status={r.status} /></td>
                  <td className="tw-py-2 tw-pl-4">
                    <div className="tw-flex tw-gap-2 tw-justify-end">
                      {r.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => handleAccept(r.id)}
                            className="tw-px-3 tw-py-1 tw-rounded tw-bg-green-600 hover:tw-bg-green-700 tw-text-white tw-text-xs tw-font-medium disabled:tw-opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => handleDecline(r.id)}
                            className="tw-px-3 tw-py-1 tw-rounded tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-xs tw-font-medium disabled:tw-opacity-50"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MentorRequestsTable;
