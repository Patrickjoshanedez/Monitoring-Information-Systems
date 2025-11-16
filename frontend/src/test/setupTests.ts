import '@testing-library/jest-dom';
import { setFeatureFlags } from '../shared/utils/featureFlags';

setFeatureFlags({ SESSION_FEEDBACK: true });
// Additional global test setup (e.g., MSW) can be added here later.
