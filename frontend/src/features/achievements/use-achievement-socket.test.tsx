import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../auth/auth-storage';
import { useAchievementSocket } from './use-achievement-socket';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  socket: { on: vi.fn(), off: vi.fn(), close: vi.fn(), emit: vi.fn() },
  io: vi.fn(),
}));

vi.mock('../../app/hooks', () => ({ useAppDispatch: () => mocks.dispatch }));
vi.mock('socket.io-client', () => ({ io: mocks.io }));

describe('achievement socket lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.io.mockReturnValue(mocks.socket);
  });

  it('keeps one socket across renders and closes it when leaving the page', () => {
    authStorage.write('token');
    const { rerender, unmount } = renderHook(() =>
      useAchievementSocket('student', 'assignment'),
    );
    for (let tick = 0; tick < 60; tick++) rerender();
    expect(mocks.io).toHaveBeenCalledTimes(1);
    expect(mocks.socket.close).not.toHaveBeenCalled();
    unmount();
    expect(mocks.socket.close).toHaveBeenCalledTimes(1);
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'connect',
      expect.any(Function),
    );
  });

  it('replaces the socket when the selected student changes', () => {
    authStorage.write('token');
    const { rerender } = renderHook(
      ({ studentId }) => useAchievementSocket(studentId, 'assignment'),
      { initialProps: { studentId: 'first' } },
    );
    rerender({ studentId: 'second' });
    expect(mocks.socket.close).toHaveBeenCalledTimes(1);
    expect(mocks.io).toHaveBeenCalledTimes(2);
  });

  it('does not open a connection without authentication or a student', () => {
    const { rerender } = renderHook(
      ({ studentId }: { studentId: string | null }) =>
        useAchievementSocket(studentId, null),
      { initialProps: { studentId: 'student' as string | null } },
    );
    authStorage.write('token');
    rerender({ studentId: null });
    expect(mocks.io).not.toHaveBeenCalled();
  });
});
