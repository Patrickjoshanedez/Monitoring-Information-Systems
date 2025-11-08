import React from 'react';
import { useProgressDashboard, useGoals, useCreateGoal, useUpdateGoalProgress } from '../../shared/hooks/useGoals';

const ProgressDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useProgressDashboard();
  const goalsQuery = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoalProgress();

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-p-6">
        <div className="tw-animate-spin tw-h-6 tw-w-6 tw-border-b-2 tw-border-blue-500 tw-rounded-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
        <div className="tw-text-red-700 tw-font-medium">Failed to load progress.</div>
        <button onClick={() => refetch()} className="tw-mt-2 tw-text-sm tw-text-red-600 hover:tw-text-red-800">Retry</button>
      </div>
    );
  }

  const { goalsSummary, sessionsTrend, badges } = data;

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
      <div className="tw-grid sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
        <Stat label="Total Goals" value={goalsSummary.totalGoals} />
        <Stat label="Completed Goals" value={goalsSummary.completedGoals} />
        <Stat label="Avg Progress" value={`${goalsSummary.avgProgress}%`} />
        <Stat label="Milestones" value={`${goalsSummary.achievedMilestones}/${goalsSummary.totalMilestones}`} />
        <Stat label="Nearing Deadlines" value={goalsSummary.nearingDeadlines} />
      </div>

      {/* Badges */}
      <div>
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Badges</h3>
        {badges.length === 0 ? (
          <div className="tw-text-xs tw-text-gray-500">No badges yet. Keep going!</div>
        ) : (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {badges.map((b) => (
              <span key={b.code} className="tw-bg-blue-50 tw-text-blue-700 tw-text-xs tw-font-medium tw-px-2 tw-py-1 tw-rounded">
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sessions Trend */}
      <div>
        <h3 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Weekly Sessions Trend</h3>
        {sessionsTrend.length === 0 && (
          <div className="tw-text-xs tw-text-gray-500">No recent sessions.</div>
        )}
        <div className="tw-overflow-x-auto">
          <table className="tw-w-full tw-text-sm tw-border tw-border-gray-200 tw-rounded">
            <thead className="tw-bg-gray-50">
              <tr>
                <Th>Week</Th>
                <Th>Sessions</Th>
                <Th>Attended</Th>
                <Th>Tasks</Th>
              </tr>
            </thead>
            <tbody>
              {sessionsTrend.map((w) => (
                <tr key={w.week} className="tw-border-t tw-border-gray-200">
                  <Td>{w.week}</Td>
                  <Td>{w.sessions}</Td>
                  <Td>{w.attended}</Td>
                  <Td>{w.tasksCompleted}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

export default React.memo(ProgressDashboard);
