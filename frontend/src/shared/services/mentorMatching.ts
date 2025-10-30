import { apiClient } from '../config/apiClient';

export type MentorFilters = {
  search?: string;
  subject?: string;
  availability?: string;
  language?: string;
  minRating?: number;
};

export type MentorProfile = {
  id: string;
  fullName: string;
  headline: string;
  rating: number;
  reviewCount: number;
  subjects: string[];
  languages: string[];
  availability: string[];
  nextAvailableSlot?: string | null;
  experienceYears?: number;
  bioSnippet?: string;
};

export type MentorDirectoryResponse = {
  mentors: MentorProfile[];
  meta: {
    source: 'api' | 'fallback';
    message?: string;
    total?: number;
    available?: number;
  };
};

export type MentorshipRequestPayload = {
  mentorId: string;
  subject: string;
  preferredSlot?: string;
  goals?: string;
  notes?: string;
};

export type PersonSummary = {
  id: string | null;
  name: string;
  email: string | null;
};

export type MentorshipRequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

export type MentorshipRequest = {
  id: string;
  status: MentorshipRequestStatus;
  subject: string;
  preferredSlot: string | null;
  goals: string | null;
  notes: string | null;
  sessionSuggestion: string | null;
  mentor: PersonSummary;
  mentee: PersonSummary;
  createdAt: string;
  updatedAt: string;
  mentorResponseAt: string | null;
  menteeWithdrawnAt: string | null;
  declineReason: string | null;
};

export type MentorshipRequestsResponse = {
  requests: MentorshipRequest[];
  meta: {
    scope: 'mentor' | 'mentee';
    total: number;
    pending: number;
  };
};

export type MentorDirectoryMeta = MentorDirectoryResponse['meta'];

export type MatchNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

const FEATURE_MENTOR_API = import.meta.env.VITE_FEATURE_MENTOR_API !== 'false';

const FALLBACK_MENTORS: MentorProfile[] = [
  {
    id: 'mentor-1',
    fullName: 'Jamie Abugan',
    headline: 'Full-stack developer • JavaScript • Node • React',
    rating: 4.9,
    reviewCount: 38,
    subjects: ['Web Development', 'Computer Programming', 'App Development'],
    languages: ['English', 'Filipino'],
    availability: ['Mon 10:00 AM', 'Wed 1:00 PM', 'Sat 9:00 AM'],
    nextAvailableSlot: '2025-10-31T10:00:00Z',
    experienceYears: 4,
    bioSnippet: 'Helps mentees build modern web apps with clean UI and maintainable backend.',
  },
  {
    id: 'mentor-2',
    fullName: 'Olivia Santos',
    headline: 'Data analyst • SQL • Python • Visualization',
    rating: 4.7,
    reviewCount: 25,
    subjects: ['Data Science', 'Database Design', 'Statistics'],
    languages: ['English'],
    availability: ['Tue 3:00 PM', 'Thu 9:00 AM'],
    nextAvailableSlot: '2025-11-02T15:00:00Z',
    experienceYears: 3,
    bioSnippet: 'Supports mentees with analytics projects and research-backed storytelling.',
  },
  {
    id: 'mentor-3',
    fullName: 'Noah Villanueva',
    headline: 'Mobile developer • Kotlin • Flutter • UX',
    rating: 4.8,
    reviewCount: 31,
    subjects: ['Mobile Development', 'UI/UX'],
    languages: ['English', 'Filipino'],
    availability: ['Fri 2:00 PM', 'Sun 10:00 AM'],
    nextAvailableSlot: '2025-11-01T14:00:00Z',
    experienceYears: 5,
    bioSnippet: 'Guides mentees in shipping user-focused mobile experiences fast.',
  },
  {
    id: 'mentor-4',
    fullName: 'Ava Dizon',
    headline: 'Cybersecurity specialist • Network defense',
    rating: 4.6,
    reviewCount: 19,
    subjects: ['Networking', 'Cybersecurity'],
    languages: ['English'],
    availability: ['Wed 4:00 PM', 'Sat 1:00 PM'],
    nextAvailableSlot: '2025-11-06T16:00:00Z',
    experienceYears: 6,
    bioSnippet: 'Focuses on practical labs and risk assessment fundamentals.',
  },
  {
    id: 'mentor-5',
    fullName: 'Ethan Cruz',
    headline: 'Cloud engineer • AWS • Terraform • DevOps',
    rating: 4.5,
    reviewCount: 22,
    subjects: ['Cloud Computing', 'DevOps'],
    languages: ['English'],
    availability: ['Mon 5:00 PM', 'Thu 7:00 PM'],
    nextAvailableSlot: '2025-11-03T17:00:00Z',
    experienceYears: 4,
    bioSnippet: 'Mentors mentees on scalable deployment strategies and automation.',
  },
  {
    id: 'mentor-6',
    fullName: 'Sophia Navarro',
    headline: 'Product designer • Figma • Design systems',
    rating: 4.9,
    reviewCount: 27,
    subjects: ['UI/UX', 'Product Design'],
    languages: ['English', 'Filipino'],
    availability: ['Tue 10:00 AM', 'Thu 5:00 PM'],
    nextAvailableSlot: '2025-11-04T10:00:00Z',
    experienceYears: 5,
    bioSnippet: 'Guides mentees through research, wireframing, and handoff best practices.',
  },
  {
    id: 'mentor-7',
    fullName: 'Liam Mendoza',
    headline: 'Backend engineer • Node.js • MongoDB • APIs',
    rating: 4.7,
    reviewCount: 34,
    subjects: ['Backend Development', 'Database Design'],
    languages: ['English'],
    availability: ['Mon 8:00 PM', 'Wed 6:00 PM'],
    nextAvailableSlot: '2025-11-05T18:00:00Z',
    experienceYears: 6,
    bioSnippet: 'Specializes in designing resilient APIs and data models for scale.',
  },
  {
    id: 'mentor-8',
    fullName: 'Harper Villaverde',
    headline: 'Data engineer • ETL • Spark • Warehousing',
    rating: 4.6,
    reviewCount: 21,
    subjects: ['Data Engineering', 'Cloud Computing'],
    languages: ['English'],
    availability: ['Fri 9:00 AM', 'Sat 4:00 PM'],
    nextAvailableSlot: '2025-11-08T09:00:00Z',
    experienceYears: 7,
    bioSnippet: 'Helps mentees build reliable data pipelines and analytics platforms.',
  },
  {
    id: 'mentor-9',
    fullName: 'Mia Soriano',
    headline: 'QA lead • Automation • Cypress • Playwright',
    rating: 4.8,
    reviewCount: 29,
    subjects: ['Quality Assurance', 'Test Automation'],
    languages: ['English'],
    availability: ['Tue 7:00 PM', 'Thu 7:00 PM'],
    nextAvailableSlot: '2025-11-06T19:00:00Z',
    experienceYears: 6,
    bioSnippet: 'Coaches mentees on test strategy, tooling, and continuous integration.',
  },
  {
    id: 'mentor-10',
    fullName: 'Elijah Pascual',
    headline: 'Project manager • Agile • Scrum • Team leadership',
    rating: 4.5,
    reviewCount: 18,
    subjects: ['Project Management', 'Leadership'],
    languages: ['English', 'Filipino'],
    availability: ['Mon 3:00 PM', 'Fri 11:00 AM'],
    nextAvailableSlot: '2025-11-03T15:00:00Z',
    experienceYears: 8,
    bioSnippet: 'Supports mentees in mastering agile delivery and stakeholder communication.',
  },
];

import logger from '../utils/logger';

const cleanFilters = (filters: MentorFilters) =>
  Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'any')
      .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  );

const matchesFilters = (mentor: MentorProfile, filters: MentorFilters) => {
  const search = filters.search?.toLowerCase();
  if (search) {
    const matchesName = mentor.fullName.toLowerCase().includes(search);
    const matchesSubject = mentor.subjects.some((subject) => subject.toLowerCase().includes(search));
    if (!matchesName && !matchesSubject) {
      return false;
    }
  }

  if (filters.subject) {
    if (!mentor.subjects.includes(filters.subject)) {
      return false;
    }
  }

  if (filters.language) {
    if (!mentor.languages.includes(filters.language)) {
      return false;
    }
  }

  if (filters.availability) {
    const availabilityMatch = mentor.availability.some((slot) => slot.toLowerCase().includes(filters.availability!.toLowerCase()));
    if (!availabilityMatch) {
      return false;
    }
  }

  if (filters.minRating) {
    if (mentor.rating < filters.minRating) {
      return false;
    }
  }

  return true;
};

const buildFallbackResponse = (filters: MentorFilters, message?: string): MentorDirectoryResponse => {
  const mentors = FALLBACK_MENTORS.filter((mentor) => matchesFilters(mentor, filters));
  return {
    mentors,
    meta: {
      source: 'fallback',
      message: message || 'Showing sample mentors until the mentor directory API is available.',
      total: mentors.length,
      available: FALLBACK_MENTORS.length,
    },
  };
};

export const fetchMentorDirectory = async (filters: MentorFilters = {}): Promise<MentorDirectoryResponse> => {
  const params = cleanFilters(filters);

  if (!FEATURE_MENTOR_API) {
    return buildFallbackResponse(filters, 'Mentor directory API disabled via feature flag; using sample mentors.');
  }

  try {
    const { data } = await apiClient.get('/mentors', { params });
    if (data?.success) {
      return {
        mentors: Array.isArray(data.mentors) ? data.mentors : [],
        meta: {
          source: 'api',
          message: data?.meta?.message || 'Mentors loaded from the MongoDB database.',
          total: data?.meta?.total ?? (Array.isArray(data.mentors) ? data.mentors.length : 0),
          available: data?.meta?.available,
        },
      };
    }
  } catch (error) {
    logger.warn('mentorDirectory: falling back to static dataset', error);
  }

  return buildFallbackResponse(filters, 'Unable to reach the mentor directory API; showing sample mentors while connectivity is restored.');
};

export const requestMentorship = async (payload: MentorshipRequestPayload) => {
  if (!FEATURE_MENTOR_API) {
    return {
      success: true,
      meta: {
        source: 'fallback',
        message: 'Mentorship request queued locally. Connect the backend endpoint to persist requests.',
      },
    };
  }

  const { data } = await apiClient.post('/mentorship/requests', payload);
  return data;
};

export const fetchMentorshipRequests = async (scope: 'mentee' | 'mentor'): Promise<MentorshipRequestsResponse> => {
  if (!FEATURE_MENTOR_API) {
    return {
      requests: [],
      meta: {
        scope,
        total: 0,
        pending: 0,
      },
    };
  }

  const { data } = await apiClient.get('/mentorship/requests', { params: { scope } });
  return {
    requests: Array.isArray(data?.requests) ? data.requests : [],
    meta: {
      scope,
      total: data?.meta?.total ?? 0,
      pending: data?.meta?.pending ?? 0,
    },
  };
};

export const acceptMentorshipRequest = async (id: string, sessionSuggestion?: string) => {
  const { data } = await apiClient.patch(`/mentorship/requests/${id}/accept`, {
    sessionSuggestion,
  });
  return data;
};

export const declineMentorshipRequest = async (id: string, declineReason?: string) => {
  const { data } = await apiClient.patch(`/mentorship/requests/${id}/decline`, {
    declineReason,
  });
  return data;
};

export const withdrawMentorshipRequest = async (id: string) => {
  const { data } = await apiClient.patch(`/mentorship/requests/${id}/withdraw`);
  return data;
};

export const fetchNotifications = async (): Promise<MatchNotification[]> => {
  if (!FEATURE_MENTOR_API) {
    return [];
  }

  const { data } = await apiClient.get('/notifications');
  return Array.isArray(data?.notifications) ? data.notifications : [];
};

export const markNotificationRead = async (id: string) => {
  if (!FEATURE_MENTOR_API) {
    return { success: true };
  }

  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  if (!FEATURE_MENTOR_API) {
    return { success: true };
  }

  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
};
