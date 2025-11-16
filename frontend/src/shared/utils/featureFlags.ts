type FeatureFlagStore = Record<string, boolean>;

declare global {
    var __FEATURE_FLAGS__: FeatureFlagStore | undefined;
    interface Window {
        __FEATURE_FLAGS__?: FeatureFlagStore;
    }
}

const getGlobalTarget = () => globalThis as typeof globalThis & { __FEATURE_FLAGS__?: FeatureFlagStore };

export const setFeatureFlag = (name: string, value: boolean) => {
    const target = getGlobalTarget();
    target.__FEATURE_FLAGS__ = { ...(target.__FEATURE_FLAGS__ ?? {}), [name]: value };
};

export const setFeatureFlags = (flags: FeatureFlagStore) => {
    const target = getGlobalTarget();
    target.__FEATURE_FLAGS__ = { ...(target.__FEATURE_FLAGS__ ?? {}), ...flags };
};

export const getFeatureFlag = (name: string, fallback = true): boolean => {
    const target = getGlobalTarget();
    const value = target.__FEATURE_FLAGS__?.[name];
    if (typeof value === 'boolean') {
        return value;
    }
    return fallback;
};

export const getAllFeatureFlags = (): FeatureFlagStore => {
    const target = getGlobalTarget();
    return { ...(target.__FEATURE_FLAGS__ ?? {}) };
};
