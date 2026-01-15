/**
 * Vitest Test Setup
 */

import { vi, beforeEach } from 'vitest';

// Mock fetch for tests
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
