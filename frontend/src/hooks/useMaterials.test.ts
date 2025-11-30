jest.mock('../shared/config/apiClient', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
        delete: jest.fn(),
    },
}));

(globalThis as any).importMetaEnv = {
    VITE_MATERIAL_UPLOAD_TIMEOUT_MS: '60000',
};

import './useMaterials';

