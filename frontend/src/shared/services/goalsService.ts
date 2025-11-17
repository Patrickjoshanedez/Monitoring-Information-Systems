import { apiClient } from '../../shared/config/apiClient';

export interface GoalMilestone {
  label: string;
  achieved: boolean;
  achievedAt: string | null;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: 'active' | 'completed' | 'archived';
  milestones: GoalMilestone[];
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export async function createGoal(payload: {
  title: string;
  description?: string;
  targetDate?: string;
  milestones?: { label: string }[];
}): Promise<{ id: string; title: string }> {
  const { data } = await apiClient.post('/goals', payload);
  return data.goal;
}

export async function listGoals(): Promise<GoalItem[]> {
  const { data } = await apiClient.get('/goals');
  return data.goals || [];
}

export async function updateGoalProgress(id: string, payload: { value?: number; milestoneLabel?: string }): Promise<{ updated: boolean; progressPercent: number }> {
  const { data } = await apiClient.patch(`/goals/${id}/progress`, payload);
  return { updated: data.updated, progressPercent: data.progressPercent };
}

