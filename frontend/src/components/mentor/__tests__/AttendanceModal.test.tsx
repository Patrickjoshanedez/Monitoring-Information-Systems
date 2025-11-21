import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AttendanceModal from '../AttendanceModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../shared/hooks/useSessionLifecycle', () => ({
    useRecordSessionAttendance: jest.fn(),
}));

import { useRecordSessionAttendance } from '../../../shared/hooks/useSessionLifecycle';
const mockUseRecord = useRecordSessionAttendance as jest.Mock;

const participants = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
];

describe('AttendanceModal', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders and submits payload', async () => {
        const mockedMutate = jest.fn().mockResolvedValue({});
        mockUseRecord.mockReturnValue({ mutateAsync: mockedMutate, isLoading: false });

        const onClose = jest.fn();
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

        render(
            <QueryClientProvider client={qc}>
                <AttendanceModal open={true} onClose={onClose} sessionId="s1" participants={participants} />
            </QueryClientProvider>
        );

        // expect participants to be rendered
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();

        // change Bob to absent
        const bobSelect = screen.getByLabelText('attendance-p2') as HTMLSelectElement;
        fireEvent.change(bobSelect, { target: { value: 'absent' } });

        // Add a note for Alice
        const aliceNote = screen.getByLabelText('note-p1') as HTMLTextAreaElement;
        fireEvent.change(aliceNote, { target: { value: 'On time, good work' } });

        // Submit
        const saveBtn = screen.getByRole('button', { name: /save attendance/i });
        fireEvent.click(saveBtn);

        // make sure mutateAsync is called with transformed payload
        expect(mockedMutate).toHaveBeenCalledTimes(1);
        const arg = mockedMutate.mock.calls[0][0];
        expect(arg.sessionId).toBe('s1');
        expect(arg.payload).toBeDefined();
        expect(arg.payload.attendance).toHaveLength(2);

        // onClose should be called after successful save
        // we allow the async mutate to resolve in test environment
        await new Promise((r) => setTimeout(r, 0));
        expect(onClose).toHaveBeenCalled();
    });
});
