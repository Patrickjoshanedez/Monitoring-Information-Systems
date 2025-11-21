import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenteeProfileModal from '../MenteeProfileModal';
import type { MatchSuggestion } from '../../types';

const suggestion: MatchSuggestion = {
  id: 'match-2',
  score: 75,
  status: 'suggested',
  mentee: {
    id: 'mentee-2',
    name: 'Avery Scholar',
    bio: 'Passionate about frontend development.',
    interests: ['UI', 'Accessibility'],
    availabilitySlots: [{ day: 'tue', start: '15:00', end: '16:00' }],
    education: { program: 'Information Technology' },
  },
  scoreBreakdown: { expertise: 70, availability: 80, interactions: 60, priority: 50 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MenteeProfileModal', () => {
  it('renders profile information and handles close', () => {
    const onClose = jest.fn();

    render(
      <MenteeProfileModal
        suggestion={suggestion}
        open
        onClose={onClose}
        onAccept={() => {}}
        onDecline={() => {}}
      />
    );

    expect(screen.getByText('Avery Scholar')).toBeInTheDocument();
    expect(screen.getByText(/frontend development/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close profile/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('accepts with an optional note', () => {
    const onAccept = jest.fn();

    render(
      <MenteeProfileModal
        suggestion={suggestion}
        open
        onClose={() => {}}
        onAccept={onAccept}
        onDecline={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText(/add a short note/i);
    fireEvent.change(textarea, { target: { value: 'Let us meet next wednesday 2pm' } });

    fireEvent.click(screen.getByRole('button', { name: /accept match/i }));
    expect(onAccept).toHaveBeenCalledWith('Let us meet next wednesday 2pm');
  });
});
