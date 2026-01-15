/**
 * Vitest Test Setup
 */

import { vi, beforeEach } from 'vitest';

// Mock fetch for tests
if (!('___originalFetch' in globalThis)) {
  (globalThis as { ___originalFetch?: typeof fetch }).___originalFetch = globalThis.fetch;
}
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
