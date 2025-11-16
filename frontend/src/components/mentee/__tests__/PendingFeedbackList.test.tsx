import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PendingFeedbackList from '../PendingFeedbackList';
import {
    usePendingFeedbackSessions,
    useSubmitSessionFeedback,
} from '../../../shared/hooks/useSessionFeedback';
import { useMenteeSessions } from '../../../shared/hooks/useMenteeSessions';

jest.mock('../../../shared/hooks/useSessionFeedback', () => ({
    usePendingFeedbackSessions: jest.fn(),
    useSubmitSessionFeedback: jest.fn(),
}));

jest.mock('../../../shared/hooks/useMenteeSessions', () => ({
    useMenteeSessions: jest.fn(() => ({ data: [] })),
}));

jest.mock('../../common/RecaptchaField.jsx', () => {
    const ReactActual = jest.requireActual('react') as typeof React;
    return {
        __esModule: true,
        default: ReactActual.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
            ReactActual.createElement('div', { ...props, ref, 'data-testid': 'mock-recaptcha' })
        ),
    };
});

jest.mock('../../../shared/utils/logger', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}));

const mockUsePendingFeedbackSessions = usePendingFeedbackSessions as jest.Mock;
const mockUseSubmitSessionFeedback = useSubmitSessionFeedback as jest.Mock;
const mockUseMenteeSessions = useMenteeSessions as jest.Mock;

const buildSession = (overrides: Partial<ReturnType<typeof createBaseSession>> = {}) => ({
    ...createBaseSession(),
    ...overrides,
});

function createBaseSession() {
    return {
        id: 'session-1',
        subject: 'Portfolio Review',
        mentor: {
            id: 'mentor-1',
            name: 'Alex Mentor',
        },
        date: '2030-01-12T10:00:00.000Z',
    };
}

const baseHookState = {
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
};

beforeEach(() => {
    jest.clearAllMocks();
    mockUseMenteeSessions.mockReturnValue({ data: [] });
});

describe('PendingFeedbackList', () => {
    it('shows skeletons while loading', () => {
        mockUsePendingFeedbackSessions.mockReturnValue({
            ...baseHookState,
            isLoading: true,
        });
        mockUseSubmitSessionFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });

        render(<PendingFeedbackList />);

        expect(screen.getByLabelText(/loading pending feedback/i)).toBeInTheDocument();
    });

    it('filters sessions using the search input', () => {
        const data = [
            buildSession({ id: 'session-1', subject: 'UI Retro', mentor: { id: 'mentor-1', name: 'Jamie Rivera' } }),
            buildSession({ id: 'session-2', subject: 'Design Handoff', mentor: { id: 'mentor-2', name: 'Sam Collins' } }),
        ];
        mockUsePendingFeedbackSessions.mockReturnValue({
            ...baseHookState,
            data,
        });
        mockUseSubmitSessionFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });

        render(<PendingFeedbackList />);

    const list = screen.getByRole('list');
    expect(within(list).getByText('UI Retro')).toBeInTheDocument();
    expect(within(list).getByText('Design Handoff')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/search sessions/i), { target: { value: 'design' } });

    expect(within(list).queryByText('UI Retro')).not.toBeInTheDocument();
    expect(within(list).getByText('Design Handoff')).toBeInTheDocument();
    });

    it('shows an empty state when filters remove all results', () => {
        const data = [buildSession({ id: 'session-3', subject: 'Career Planning' })];
        mockUsePendingFeedbackSessions.mockReturnValue({
            ...baseHookState,
            data,
        });
        mockUseSubmitSessionFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });

        render(<PendingFeedbackList />);

        fireEvent.change(screen.getByLabelText(/search sessions/i), { target: { value: 'zzz' } });

        expect(screen.getByText(/no sessions match/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
    });
});
