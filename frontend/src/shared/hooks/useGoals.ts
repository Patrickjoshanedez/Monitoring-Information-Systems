import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal, listGoals, updateGoalProgress, getProgressDashboard, GoalItem } from '../services/goalsService';

export const goalsKey = ['goals'];
export const progressDashboardKey = ['progressDashboard'];

export function useGoals() {
  return useQuery<GoalItem[]>(goalsKey, listGoals, { staleTime: 60 * 1000 });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation(createGoal, {
    onSuccess: () => {
      qc.invalidateQueries(goalsKey);
      qc.invalidateQueries(progressDashboardKey);
    },
  });
}

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation(({ id, value, milestoneLabel }: { id: string; value?: number; milestoneLabel?: string }) => updateGoalProgress(id, { value, milestoneLabel }), {
    onSuccess: () => {
      qc.invalidateQueries(goalsKey);
      qc.invalidateQueries(progressDashboardKey);
    },
  });
}

export function useProgressDashboard() {
  return useQuery(progressDashboardKey, getProgressDashboard, { refetchInterval: 60 * 1000 });
}
