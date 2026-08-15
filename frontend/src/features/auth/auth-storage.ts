const ACCESS_TOKEN_KEY = 'practice-time.access-token';

export const authStorage = {
  read(): string | null {
    return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  },

  write(accessToken: string): void {
    getStorage()?.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  clear(): void {
    getStorage()?.removeItem(ACCESS_TOKEN_KEY);
  },
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}
