jest.mock('../shared/config/apiClient', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}));

import { buildPreviewUrl } from './useMaterials';

describe('buildPreviewUrl', () => {
    it('returns the API preview path for a given material id', () => {
        expect(buildPreviewUrl('abc123')).toBe('/api/abc123/preview');
    });
});
