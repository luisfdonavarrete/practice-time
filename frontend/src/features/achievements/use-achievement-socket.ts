import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../../app/api';
import { useAppDispatch } from '../../app/hooks';
import { environment } from '../../config/env';
import { authStorage } from '../auth/auth-storage';

export interface AchievementUnlock {
  achievementId: string;
  studentId: string;
  achievementKey: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export function useAchievementSocket(
  studentId: string | null,
  assignmentId: string | null,
): { achievement: AchievementUnlock | null; dismiss: () => void } {
  const dispatch = useAppDispatch();
  const [achievement, setAchievement] = useState<AchievementUnlock | null>(
    null,
  );

  useEffect(() => {
    const token = authStorage.read();
    if (!token || !studentId) return;
    const socket = io(`${environment.apiBaseUrl}/achievements`, {
      transports: ['websocket'],
      auth: { token },
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
    });

    const reconcile = () => {
      socket.emit('student.subscribe', { studentId });
      dispatch(
        api.util.invalidateTags([{ type: 'Achievements', id: studentId }]),
      );
      if (assignmentId) {
        dispatch(
          api.util.invalidateTags([{ type: 'Progress', id: assignmentId }]),
        );
      }
    };
    const unlock = (event: AchievementUnlock) => {
      if (event.studentId !== studentId) return;
      setAchievement(event);
      dispatch(
        api.util.invalidateTags([{ type: 'Achievements', id: studentId }]),
      );
    };
    socket.on('connect', reconcile);
    socket.on('achievement.unlocked', unlock);
    return () => {
      socket.off('connect', reconcile);
      socket.off('achievement.unlocked', unlock);
      socket.close();
    };
  }, [assignmentId, dispatch, studentId]);

  useEffect(() => {
    if (!achievement) return;
    const timeout = window.setTimeout(() => setAchievement(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [achievement]);

  return { achievement, dismiss: () => setAchievement(null) };
}
