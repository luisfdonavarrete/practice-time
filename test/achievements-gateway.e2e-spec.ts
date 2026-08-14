import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AchievementEvents } from '../src/achievements/achievement.events';
import { AchievementKey } from '../src/achievements/entities/student-achievement.entity';
import { AppModule } from '../src/app.module';

describe('Achievement gateway authorization and recovery', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let achievementEvents: AchievementEvents;
  let httpServer: App;
  let namespaceUrl: string;
  let userId: string;
  let unrelatedUserId: string;
  let studentId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const rawServer: unknown = app.getHttpServer();
    httpServer = rawServer as App;
    const address = (rawServer as { address(): { port: number } }).address();
    namespaceUrl = `http://127.0.0.1:${address.port}/achievements`;
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
    achievementEvents = app.get(AchievementEvents);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const usersResult: unknown = await dataSource.query(
      `INSERT INTO users
       (email, password, first_name, last_name, date_of_birth)
       VALUES
       ($1, 'hash', 'Socket', 'Owner', '1990-01-01'),
       ($2, 'hash', 'Socket', 'Other', '1990-01-01')
       RETURNING id`,
      [
        `socket-owner-${crypto.randomUUID()}@example.com`,
        `socket-other-${crypto.randomUUID()}@example.com`,
      ],
    );
    [{ id: userId }, { id: unrelatedUserId }] = usersResult as Array<{
      id: string;
    }>;
    const studentResult: unknown = await dataSource.query(
      `INSERT INTO student
       (owner_user_id, first_name, last_name, date_of_birth, time_zone)
       VALUES ($1, 'Socket', 'Student', '2010-01-01', 'America/Toronto')
       RETURNING id`,
      [userId],
    );
    [{ id: studentId }] = studentResult as Array<{ id: string }>;
  });

  afterEach(async () => {
    await dataSource.query(`DELETE FROM student WHERE id = $1`, [studentId]);
    await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [userId, unrelatedUserId],
    ]);
  });

  it.each([
    ['invalid', 'not-a-jwt'],
    ['expired', undefined],
  ])('rejects an %s JWT before connection', async (_case, suppliedToken) => {
    const token =
      suppliedToken ??
      (await jwtService.signAsync({ sub: userId }, { expiresIn: -1 }));
    const socket = io(namespaceUrl, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
      forceNew: true,
    });
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () =>
        reject(new Error('Unauthorized socket connected')),
      );
      socket.once('connect_error', () => resolve());
    });
    socket.close();
  });

  it('allows only the owner room, delivers its event, and restores state through REST', async () => {
    const ownerToken = await jwtService.signAsync({ sub: userId });
    const unrelatedToken = await jwtService.signAsync({ sub: unrelatedUserId });
    const owner = await connect(namespaceUrl, ownerToken);
    const unrelated = await connect(namespaceUrl, unrelatedToken);

    await expectSubscription(owner, studentId);
    const denied = new Promise<void>((resolve) =>
      unrelated.once('exception', () => resolve()),
    );
    unrelated.emit('student.subscribe', { studentId });
    await denied;

    let leaked = false;
    unrelated.on('achievement.unlocked', () => (leaked = true));
    const received = new Promise<{
      studentId: string;
      achievementKey: AchievementKey;
    }>((resolve) => owner.once('achievement.unlocked', resolve));
    achievementEvents.publish({
      type: 'achievement.unlocked',
      achievementId: crypto.randomUUID(),
      studentId,
      achievementKey: AchievementKey.FIRST_PRACTICE,
      title: 'First Note',
      description: 'Record the first practice session.',
      unlockedAt: new Date().toISOString(),
    });
    await expect(received).resolves.toMatchObject({
      studentId,
      achievementKey: AchievementKey.FIRST_PRACTICE,
    });
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(leaked).toBe(false);
    owner.close();
    unrelated.close();

    await dataSource.query(
      `INSERT INTO student_achievements (student_id, achievement_key)
       VALUES ($1, 'first_practice')`,
      [studentId],
    );
    const response = await request(httpServer)
      .get(`/students/${studentId}/achievements`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(response.body).toEqual([
      expect.objectContaining({ key: AchievementKey.FIRST_PRACTICE }),
    ]);
  });
});

function connect(url: string, token: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(url, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false,
      forceNew: true,
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function expectSubscription(socket: Socket, studentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(1000)
      .emit(
        'student.subscribe',
        { studentId },
        (error: Error | null, response: { subscribed?: boolean }) => {
          if (error) return reject(error);
          if (!response?.subscribed)
            return reject(new Error('Room subscription failed'));
          resolve();
        },
      );
  });
}
