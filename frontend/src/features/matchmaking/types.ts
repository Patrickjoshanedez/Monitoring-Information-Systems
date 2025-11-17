export type MatchStatus =
  | 'suggested'
  | 'mentor_accepted'
  | 'mentor_declined'
  | 'mentee_accepted'
  | 'mentee_declined'
  | 'rejected'
  | 'connected'
  | 'expired';

export interface ScoreBreakdown {
  expertise: number;
  availability: number;
  interactions: number;
  priority: number;
}

export interface MenteePreview {
  id: string;
  name: string;
  email?: string;
  photoUrl?: string | null;
  bio?: string | null;
  expertiseAreas?: string[];
  skills?: string[];
  interests?: string[];
  availabilitySlots?: Array<{ day: string; start?: string; end?: string }>;
  education?: {
    program?: string;
    yearLevel?: string;
    major?: string;
  };
}

export interface MentorPreview {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  expertiseAreas?: string[];
  capacity?: number | null;
}

export interface MatchSuggestion {
  id: string;
  score: number;
  status: MatchStatus;
  expiresAt?: string;
  mentee: MenteePreview;
  mentor?: MentorPreview | null;
  scoreBreakdown: ScoreBreakdown;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MatchMeta {
  count: number;
  capacity: number | null;
  activeMentees: number | null;
  remainingSlots: number | null;
  awaitingMentee?: number;
  awaitingMentor?: number;
}

export interface MatchAcceptResponse {
  match: MatchSuggestion;
  mentorship?: {
    _id: string;
    mentorId: string;
    menteeId: string;
  } | null;
}
