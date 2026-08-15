import { afterEach, describe, expect, it, vi } from 'vitest';

describe('frontend environment', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('accepts an absolute HTTP API URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');
    const { environment } = await import('./env');
    expect(environment.apiBaseUrl).toBe('https://api.example.com');
  });

  it('rejects an invalid API URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'api.example.com');
    await expect(import('./env')).rejects.toThrow(
      'VITE_API_BASE_URL must be a valid absolute URL',
    );
  });
});
