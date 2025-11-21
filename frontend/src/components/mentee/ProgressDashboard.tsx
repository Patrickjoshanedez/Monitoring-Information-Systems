import React from 'react';
import type { SnapshotTrendPoint, SnapshotComment } from '../../shared/services/mentorFeedbackService';
import { useProgressDashboard, useGoals, useCreateGoal, useUpdateGoalProgress } from '../../shared/hooks/useGoals';
import { useMenteeProgressSnapshot } from '../../shared/hooks/useMentorFeedback';

const ProgressDashboard: React.FC<{ menteeId?: string | null }> = ({ menteeId }) => {
  // If a menteeId prop is passed (mentor/admin context), fetch that mentee's snapshot.
  // Otherwise fall back to the logged-in mentee snapshot.
  const query = menteeId ? useMenteeProgressSnapshot(menteeId) : useProgressDashboard();
  const { data: snapshot, isLoading, isError, refetch } = query as any;
  const goalsQuery = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoalProgress();

  const goalStats = React.useMemo(() => {
    const goals = goalsQuery.data || [];
    if (!goals.length) {
      return { total: 0, completed: 0, avgProgress: 0, totalMilestones: 0, achievedMilestones: 0 };
    }

    const total = goals.length;
    const completed = goals.filter((goal) => goal.status === 'completed').length;
    const avgProgress = Math.round(
      goals.reduce((sum, goal) => sum + goal.progressPercent, 0) / total
    );

    let totalMilestones = 0;
    let achievedMilestones = 0;
    goals.forEach((goal) => {
      totalMilestones += goal.milestones.length;
      achievedMilestones += goal.milestones.filter((milestone) => milestone.achieved).length;
    });

    return { total, completed, avgProgress, totalMilestones, achievedMilestones };
  }, [goalsQuery.data]);

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-p-6">
        <div className="tw-animate-spin tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500 tw-rounded-full" />
      </div>
    );
  }

  if (isError || !snapshot) {
    return (
      <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
        <div className="tw-text-red-700 tw-font-medium">Failed to load progress.</div>
        <button onClick={() => refetch()} className="tw-mt-2 tw-text-sm tw-text-red-600 hover:tw-text-red-800">Retry</button>
      </div>
    );
  }

  const ratingAvg = snapshot.ratingAvg ?? 0;
  const ratingDisplay = ratingAvg.toFixed(2);
  const ratingCount = snapshot.ratingCount ?? 0;
  const milestonesReached = snapshot.milestones?.reached ?? 0;
  const milestoneUpdatedLabel = formatDateTime(snapshot.milestones?.lastUpdatedAt);
  const lastUpdatedLabel = formatDateTime(snapshot.lastUpdated);
  const monthlyTrend = snapshot.monthlyTrend || [];
  const recentComments = snapshot.recentComments || [];

  return (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 tw-shadow-sm tw-space-y-6">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Progress Dashboard</h2>
        <button
          onClick={() => refetch()}
          className="tw-text-sm tw-bg-gray-100 hover:tw-bg-gray-200 tw-text-gray-700 tw-rounded tw-px-3 tw-py-1"
        >
          Refresh
        </button>
      </div>
      <section aria-label="Mentor feedback snapshot">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Mentor Feedback Snapshot</h3>
        <div className="tw-grid sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <Stat label="Average Rating" value={`${ratingDisplay}/5`} />
          <Stat label="Feedback Count" value={ratingCount} />
          <Stat label="Milestones Reached" value={milestonesReached} />
          <Stat label="Snapshot Updated" value={lastUpdatedLabel} />
        </div>
        <div className="tw-mt-2 tw-text-xs tw-text-gray-500">Last milestone update: {milestoneUpdatedLabel}</div>
      </section>

      <section aria-label="Goal summary">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Goal Snapshot</h3>
        <div className="tw-grid sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <Stat label="Total Goals" value={goalStats.total} />
          <Stat label="Completed Goals" value={goalStats.completed} />
          <Stat label="Avg Progress" value={`${goalStats.avgProgress}%`} />
          <Stat
            label="Milestones"
            value={`${goalStats.achievedMilestones}/${goalStats.totalMilestones}`}
          />
        </div>
      </section>

      <section aria-label="Monthly rating trend">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Monthly Rating Trend</h3>
        {monthlyTrend.length === 0 && (
          <div className="tw-text-xs tw-text-gray-500">No mentor feedback yet.</div>
        )}
        {monthlyTrend.length > 0 && (
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-text-sm tw-border tw-border-gray-200 tw-rounded">
              <thead className="tw-bg-gray-50">
                <tr>
                  <Th>Month</Th>
                  <Th>Avg Rating</Th>
                  <Th>Feedback Count</Th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((trend: SnapshotTrendPoint) => (
                  <tr key={trend.month} className="tw-border-t tw-border-gray-200">
                    <Td>{formatMonthLabel(trend.month)}</Td>
                    <Td>{trend.avg.toFixed(2)}</Td>
                    <Td>{trend.count}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Recent mentor comments">
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Recent Mentor Comments</h3>
        {recentComments.length === 0 ? (
          <div className="tw-text-xs tw-text-gray-500">Mentors have not shared public comments yet.</div>
        ) : (
          <ul className="tw-space-y-3">
            {recentComments.map((comment: SnapshotComment) => (
              <li
                key={comment.feedbackId || comment.createdAt || comment.mentorId}
                className="tw-border tw-border-gray-200 tw-rounded tw-p-3"
              >
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div>
                    <div className="tw-text-sm tw-font-semibold tw-text-gray-900">{comment.mentorName}</div>
                    <div className="tw-text-xs tw-text-gray-500">{formatDateTime(comment.createdAt)}</div>
                  </div>
                  <span className="tw-text-sm tw-font-medium tw-text-gray-700" aria-label="Rating">
                    {comment.rating.toFixed(1)}/5
                  </span>
                </div>
                <p className="tw-text-sm tw-text-gray-700 tw-mt-2">
                  {comment.comment || 'Mentor shared a rating without a public comment.'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Goals List */}
      <div>
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Goals</h3>
        {goalsQuery.isLoading && <div className="tw-text-xs tw-text-gray-500">Loading goals...</div>}
        {goalsQuery.data && goalsQuery.data.length === 0 && (
          <div className="tw-text-xs tw-text-gray-500">No goals yet.</div>
        )}
        <ul className="tw-divide-y tw-divide-gray-200">
          {goalsQuery.data?.map((g) => (
            <li key={g.id} className="tw-py-3">
              <div className="tw-flex tw-items-start tw-justify-between">
                <div>
                  <div className="tw-font-medium tw-text-gray-900">{g.title}</div>
                  {g.description && <div className="tw-text-xs tw-text-gray-600 tw-mt-0.5">{g.description}</div>}
                  <div className="tw-text-xs tw-text-gray-500 tw-mt-1">Progress: {g.progressPercent}%</div>
                  <div className="tw-flex tw-flex-wrap tw-gap-1 tw-mt-1">
                    {g.milestones.map((m) => (
                      <span key={m.label} className={`tw-text-xs tw-rounded tw-px-2 tw-py-0.5 ${m.achieved ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-gray-100 tw-text-gray-600'}`}>{m.label}</span>
                    ))}
                  </div>
                </div>
                <div className="tw-flex tw-flex-col tw-gap-2">
                  <button
                    onClick={() => updateGoal.mutate({ id: g.id, value: Math.min(100, g.progressPercent + 10) })}
                    className="tw-text-xs tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-rounded tw-px-2 tw-py-1"
                    disabled={updateGoal.isLoading}
                  >+10%</button>
                  <button
                    onClick={() => {
                      const next = g.milestones.find((m) => !m.achieved);
                      if (next) updateGoal.mutate({ id: g.id, milestoneLabel: next.label });
                    }}
                    className="tw-text-xs tw-bg-green-500 hover:tw-bg-green-600 tw-text-white tw-rounded tw-px-2 tw-py-1"
                    disabled={updateGoal.isLoading || g.milestones.every((m) => m.achieved)}
                  >Mark Milestone</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Quick add goal (minimal form) */}
        <AddGoalForm onCreate={(payload) => createGoal.mutate(payload)} loading={createGoal.isLoading} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="tw-bg-gray-50 tw-rounded tw-p-4 tw-flex tw-flex-col tw-gap-1">
    <div className="tw-text-xs tw-font-medium tw-text-gray-500">{label}</div>
    <div className="tw-text-lg tw-font-semibold tw-text-gray-900">{value}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th scope="col" className="tw-text-left tw-text-xs tw-font-semibold tw-text-gray-700 tw-px-3 tw-py-2">{children}</th>
);
const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="tw-px-3 tw-py-2 tw-text-xs tw-text-gray-700">{children}</td>
);

const AddGoalForm: React.FC<{ onCreate: (payload: { title: string; milestones?: { label: string }[] }) => void; loading: boolean }> = ({ onCreate, loading }) => {
  const [title, setTitle] = React.useState('');
  const [milestones, setMilestones] = React.useState<string>('Read docs,Build demo');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const ms = milestones.split(',').map((m) => m.trim()).filter(Boolean).map((label) => ({ label }));
        onCreate({ title: title.trim(), milestones: ms });
        setTitle('');
        setMilestones('Read docs,Build demo');
      }}
      className="tw-mt-6 tw-flex tw-flex-col sm:tw-flex-row tw-gap-2"
      aria-label="Add new goal"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Goal title"
        className="tw-flex-1 tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 tw-text-sm"
        aria-label="Goal title"
      />
      <input
        value={milestones}
        onChange={(e) => setMilestones(e.target.value)}
        placeholder="Milestones comma separated"
        className="tw-flex-1 tw-border tw-border-gray-300 tw-rounded tw-px-2 tw-py-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500 tw-text-sm"
        aria-label="Goal milestones"
      />
      <button
        type="submit"
        disabled={loading}
        className="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-text-sm tw-font-medium tw-rounded tw-px-4 tw-py-2 disabled:tw-bg-blue-300"
      >
        {loading ? 'Adding...' : 'Add Goal'}
      </button>
    </form>
  );
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const formatMonthLabel = (monthKey: string) => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) {
    return monthKey || '—';
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
  } catch {
    return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
  }
};

export default React.memo(ProgressDashboard);
