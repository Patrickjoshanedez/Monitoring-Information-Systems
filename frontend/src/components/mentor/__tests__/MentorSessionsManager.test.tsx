import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MentorSessionsManager from '../MentorSessionsManager';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMentorSessions, useCompleteMentorSession } from '../../../shared/hooks/useMentorSessions';
import { useMentorFeedbackForSession, useCreateMentorFeedback, useUpdateMentorFeedback } from '../../../shared/hooks/useMentorFeedback';

jest.mock('../../../shared/hooks/useMentorSessions', () => ({
    useMentorSessions: jest.fn(),
    useCompleteMentorSession: jest.fn(),
}));

jest.mock('../../../shared/hooks/useSessionLifecycle', () => ({
    useRecordSessionAttendance: jest.fn(),
}));

// The composer is a small child component that uses many other hooks. Stub it out for these tests.
jest.mock('../../mentor/MentorSessionComposer', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../../../shared/hooks/useMentorFeedback', () => ({
    useMentorFeedbackForSession: jest.fn(),
    useCreateMentorFeedback: jest.fn(),
    useUpdateMentorFeedback: jest.fn(),
}));

const mockUseMentorSessions = useMentorSessions as jest.Mock;
const mockUseCompleteMentorSession = useCompleteMentorSession as jest.Mock;
const mockUseMentorFeedbackForSession = useMentorFeedbackForSession as jest.Mock;
const mockUseCreateMentorFeedback = useCreateMentorFeedback as jest.Mock;
const mockUseUpdateMentorFeedback = useUpdateMentorFeedback as jest.Mock;
const mockUseRecordAttendance = require('../../../shared/hooks/useSessionLifecycle').useRecordSessionAttendance as jest.Mock;

function baseSession(overrides: Record<string, any> = {}) {
    return {
        id: 's1',
        subject: 'Portfolio Review',
        mentee: { id: 'm1', name: 'Student One' },
        date: '2030-01-12T10:00:00.000Z',
        attended: true,
        tasksCompleted: 0,
        notes: '',
        status: 'completed',
        feedbackDue: false,
        participants: [{ id: 'm1', name: 'Student One' }],
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUseMentorSessions.mockReturnValue({ data: [baseSession()], isLoading: false, isError: false, refetch: jest.fn(), isFetching: false });
    mockUseCompleteMentorSession.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseRecordAttendance.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseMentorFeedbackForSession.mockReturnValue({ data: null, isLoading: false });
    mockUseCreateMentorFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseUpdateMentorFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
});

describe('MentorSessionsManager', () => {
    it('shows a Give feedback button for completed sessions and opens modal', () => {
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={qc}>
                <MemoryRouter>
                    <MentorSessionsManager />
                </MemoryRouter>
            </QueryClientProvider>
        );

        // The default filter is 'upcoming'. Switch to all so our completed session shows.
        fireEvent.change(screen.getByLabelText(/Filter sessions by status/i), { target: { value: 'all' } });
        const table = screen.getByRole('table');
        const row = within(table).getByText('Portfolio Review').closest('tr');
        expect(row).toBeTruthy();

        // Find the Give feedback button in this row
        const giveFeedbackBtn = within(row as HTMLElement).getByRole('button', { name: /give feedback/i });
        expect(giveFeedbackBtn).toBeInTheDocument();

        // Find the Attendance button that we just added
        const attendanceBtn = within(row as HTMLElement).getByRole('button', { name: /attendance/i });
        expect(attendanceBtn).toBeInTheDocument();

        fireEvent.click(attendanceBtn);

            // The attendance modal should appear
            expect(screen.getByText(/Record attendance/i)).toBeInTheDocument();

        fireEvent.click(giveFeedbackBtn);

        // Modal should appear with title
            // Mentor feedback modal should appear with title
            expect(screen.getByText('Mentor feedback')).toBeInTheDocument();
    });
});
