import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialUpload from './MaterialUpload';

const mockUploadHook = {
    mutateAsync: jest.fn(),
    isPending: false,
};

jest.mock('../../hooks/useMaterials', () => ({
    useUploadSessionMaterials: () => mockUploadHook,
}));

describe('MaterialUpload', () => {
    beforeEach(() => {
        mockUploadHook.mutateAsync.mockReset();
    });

    it('renders the upload field and button', () => {
        render(<MaterialUpload sessionId="general" />);
        expect(screen.getByLabelText(/upload materials/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });

    it('shows validation error when submitting without files', () => {
        render(<MaterialUpload sessionId="general" />);
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));
        expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one file');
    });

    it('updates file count when files selected', () => {
        render(<MaterialUpload sessionId="general" />);
        const input = screen.getByLabelText(/upload materials/i);
        const file = new File(['example'], 'notes.pdf', { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });
        // UI shows the filename for a single selected file
        expect(screen.getByText(/notes.pdf/i)).toBeInTheDocument();
    });

    it('surfaces server error message when upload fails', async () => {
        mockUploadHook.mutateAsync.mockRejectedValueOnce({
            isAxiosError: true,
            response: { data: { message: 'Only mentors can upload materials.' } },
        });

        render(<MaterialUpload sessionId="general" />);
        const input = screen.getByLabelText(/upload materials/i);
        const file = new File(['example'], 'notes.pdf', { type: 'application/pdf' });
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Only mentors can upload materials.'));
    });
});
