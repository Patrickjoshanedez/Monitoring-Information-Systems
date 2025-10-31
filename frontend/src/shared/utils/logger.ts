/* eslint-disable no-console */
const ENABLE_LOGS = import.meta.env.VITE_ENABLE_LOGS === 'true' || import.meta.env.MODE !== 'production';

function safeWrap(fn: (...args: any[]) => void) {
  return (...args: any[]) => {
    if (ENABLE_LOGS) {
      try {
        fn(...args);
      } catch {
        // swallow
      }
    }
  };
}

const logger = {
  log: safeWrap(console.log.bind(console)),
  info: safeWrap(console.info.bind(console)),
  warn: safeWrap(console.warn.bind(console)),
  error: safeWrap(console.error.bind(console)),
  debug: safeWrap(console.debug ? console.debug.bind(console) : console.log.bind(console)),
};

export default logger;
