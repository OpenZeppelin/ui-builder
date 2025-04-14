import { afterAll, beforeAll } from 'vitest';

import { logger } from '../core/utils/logger';

// Disable logging before all tests
beforeAll(() => {
  logger.configure({ enabled: false });
});

// Reset logger configuration after all tests
afterAll(() => {
  logger.configure({ enabled: true, level: 'info' });
});
