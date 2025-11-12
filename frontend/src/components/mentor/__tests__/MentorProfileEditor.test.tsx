import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MentorProfileEditor from '../MentorProfileEditor';

// Mock layout to avoid importing components using import.meta in Jest
jest.mock('../../layouts/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

// Minimal mock for useMyProfile hook's data shape
const stableProfile = {
  profile: {
    displayName: 'Jane Mentor',
    bio: 'Hello',
    expertiseAreas: ['Algorithms'],
    skills: ['React'],
    availabilitySlots: [{ day: 'mon', start: '09:00', end: '10:00' }],
  },
};
jest.mock('../../../shared/hooks/useMentorProfile', () => ({
  __esModule: true,
  useMyProfile: () => ({ data: stableProfile, isLoading: false }),
  useUpdateMentorProfile: () => ({ mutate: jest.fn(), isLoading: false }),
  useUploadProfilePhoto: () => ({ mutate: jest.fn(), isLoading: false, progress: 0 }),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe('MentorProfileEditor', () => {
  it('renders initial profile data', () => {
    renderWithClient(<MentorProfileEditor />);
    expect(screen.getByDisplayValue('Jane Mentor')).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('adds a new expertise chip', () => {
    renderWithClient(<MentorProfileEditor />);
    const input = screen.getByPlaceholderText('e.g., Algorithms');
    fireEvent.change(input, { target: { value: 'Databases' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Databases')).toBeInTheDocument();
  });

  it('shows validation error for empty display name', () => {
    renderWithClient(<MentorProfileEditor />);
    const nameInput = screen.getByLabelText('Display name');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Display name is required/);
  });

  it('rejects invalid availability slot (start >= end)', () => {
    renderWithClient(<MentorProfileEditor />);
    const start = screen.getAllByLabelText(/Start time for slot/i)[0];
    const end = screen.getAllByLabelText(/End time for slot/i)[0];
    fireEvent.change(start, { target: { value: '10:00' } });
    fireEvent.change(end, { target: { value: '09:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(screen.getByText(/Each availability slot/)).toBeInTheDocument();
  });
});
