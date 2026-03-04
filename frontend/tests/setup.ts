/**
 * Vitest global setup: configure MSW and Testing Library matchers.
 */
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatic component cleanup after each test
afterEach(() => cleanup());
