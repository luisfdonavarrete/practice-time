import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AchievementKey } from '../src/achievements/entities/student-achievement.entity';
import { AppModule } from '../src/app.module';
import { ObjectStorageService } from '../src/object-storage/object-storage.service';
import { AssignmentResourceKind } from '../src/student-assignments/entities/assignment-item-resource.entity';
import { AssignmentCompletionMode } from '../src/student-assignments/entities/student-assignment-item.entity';

interface AssignmentItemBody {
  id: string;
  title: string;
}

interface AssignmentSectionBody {
  title: string;
  items: AssignmentItemBody[];
}

interface AssignmentBody {
  id: string;
  status: string;
  sections: AssignmentSectionBody[];
}

interface ResourceBody {
  id: string;
  kind: AssignmentResourceKind;
  displayName: string;
}

interface PracticeSummaryBody {
  weeklyMinutes: number;
  distinctPracticeDays: number;
  currentStreak: number;
  xp: number;
  assignmentCompleted: boolean;
  items: Array<{
    title: string;
    target: number;
    current: number;
    completed: boolean;
  }>;
}

interface WorkflowDates {
  startDate: string;
  endDate: string;
  firstPractice: string;
  secondPractice: string;
  recitalAt: string;
  theoryDueAt: string;
}

describe('Weekly practice workflow', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let httpServer: App;
  let namespaceUrl: string;
  let ownerId: string;
  let unrelatedUserId: string;
  let studentId: string;
  let socket: Socket | undefined;

  const storedObjects = new Map<
    string,
    { body: Buffer; contentType: string }
  >();
  const objectStorage = {
    put: jest.fn(
      (key: string, body: Buffer, contentType: string): Promise<unknown> => {
        storedObjects.set(key, { body, contentType });
        return Promise.resolve({});
      },
    ),
    delete: jest.fn((key: string): Promise<unknown> => {
      storedObjects.delete(key);
      return Promise.resolve({});
    }),
    getSignedReadUrl: jest.fn((key: string): Promise<string> => {
      return Promise.resolve(
        `https://resources.example.test/${encodeURIComponent(key)}`,
      );
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ObjectStorageService)
      .useValue(objectStorage)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    const rawServer: unknown = app.getHttpServer();
    httpServer = rawServer as App;
    const address = (rawServer as { address(): { port: number } }).address();
    namespaceUrl = `http://127.0.0.1:${address.port}/achievements`;
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    objectStorage.put.mockClear();
    objectStorage.delete.mockClear();
    objectStorage.getSignedReadUrl.mockClear();
    storedObjects.clear();
    const usersResult: unknown = await dataSource.query(
      `INSERT INTO users
       (email, password, first_name, last_name, date_of_birth)
       VALUES
       ($1, 'hash', 'Weekly', 'Owner', '1990-01-01'),
       ($2, 'hash', 'Weekly', 'Other', '1990-01-01')
       RETURNING id`,
      [
        `weekly-owner-${crypto.randomUUID()}@example.com`,
        `weekly-other-${crypto.randomUUID()}@example.com`,
      ],
    );
    [{ id: ownerId }, { id: unrelatedUserId }] = usersResult as Array<{
      id: string;
    }>;
    const studentResult: unknown = await dataSource.query(
      `INSERT INTO student
       (owner_user_id, first_name, last_name, date_of_birth, time_zone)
       VALUES ($1, 'Weekly', 'Student', '2010-01-01', 'America/Toronto')
       RETURNING id`,
      [ownerId],
    );
    [{ id: studentId }] = studentResult as Array<{ id: string }>;
  });

  afterEach(async () => {
    socket?.close();
    socket = undefined;
    await dataSource.query(
      `DELETE FROM student_assignments WHERE creator_user_id = $1`,
      [ownerId],
    );
    await dataSource.query(`DELETE FROM student WHERE id = $1`, [studentId]);
    await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [ownerId, unrelatedUserId],
    ]);
    storedObjects.clear();
  });

  it('authors, practices, completes, rewards, and protects a weekly assignment', async () => {
    const ownerToken = await jwtService.signAsync({ sub: ownerId });
    const unrelatedToken = await jwtService.signAsync({
      sub: unrelatedUserId,
    });
    const dates = await getWorkflowDates(dataSource);

    const createdResponse = await request(httpServer)
      .post('/student-assignments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(buildAssignment(studentId, dates))
      .expect(201);
    const assignment = createdResponse.body as AssignmentBody;
    const repertoireItems = assignment.sections.find(
      ({ title }) => title === 'Repertoire',
    )!.items;
    const theoryItems = assignment.sections.find(
      ({ title }) => title === 'Written Theory',
    )!.items;
    const recitalItem = repertoireItems[0];
    const soloItem = repertoireItems[1];

    const score = await uploadResource(
      httpServer,
      ownerToken,
      recitalItem.id,
      Buffer.from('%PDF-1.7\nAmazing Grace'),
      'amazing-grace.pdf',
      'application/pdf',
      'Amazing Grace score',
      0,
    );
    const recording = await uploadResource(
      httpServer,
      ownerToken,
      recitalItem.id,
      Buffer.from('ID3Amazing Grace 90 bpm'),
      'amazing-grace-90-bpm.mp3',
      'audio/mpeg',
      'Amazing Grace 90 bpm',
      1,
    );
    expect(storedObjects.size).toBe(2);

    const publishedResponse = await request(httpServer)
      .post(`/student-assignments/${assignment.id}/publish`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);
    expect((publishedResponse.body as AssignmentBody).status).toBe('published');

    const listedResources = await request(httpServer)
      .get(`/student-assignment-items/${recitalItem.id}/resources`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(listedResources.body as ResourceBody[]).toEqual([
      expect.objectContaining({ id: score.id, kind: 'upload' }),
      expect.objectContaining({ id: recording.id, kind: 'upload' }),
    ]);
    const accessResponse = await request(httpServer)
      .get(`/assignment-resources/${score.id}/access-url`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const access = accessResponse.body as { url: string };
    expect(access.url).toContain('https://resources.example.test/');

    await Promise.all([
      request(httpServer)
        .get(`/students/${studentId}`)
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .expect(404),
      request(httpServer)
        .get(`/student-assignments/${assignment.id}`)
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .expect(404),
      request(httpServer)
        .get(`/assignment-resources/${score.id}/access-url`)
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .expect(404),
    ]);

    socket = await connect(namespaceUrl, ownerToken);
    await subscribe(socket, studentId);
    const firstPracticeUnlocked = waitForAchievement(
      socket,
      AchievementKey.FIRST_PRACTICE,
    );

    await createPracticeSession(
      httpServer,
      ownerToken,
      studentId,
      recitalItem.id,
      dates.firstPractice,
      600,
    );
    await expect(firstPracticeUnlocked).resolves.toMatchObject({
      studentId,
      achievementKey: AchievementKey.FIRST_PRACTICE,
    });
    await createPracticeSession(
      httpServer,
      ownerToken,
      studentId,
      recitalItem.id,
      dates.secondPractice,
      600,
    );
    await createPracticeSession(
      httpServer,
      ownerToken,
      studentId,
      soloItem.id,
      dates.secondPractice,
      300,
    );
    for (const theoryItem of theoryItems) {
      await request(httpServer)
        .put(`/student-assignment-items/${theoryItem.id}/completion`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
    }

    const summaryResponse = await request(httpServer)
      .get(`/student-assignments/${assignment.id}/practice-summary`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const summary = summaryResponse.body as PracticeSummaryBody;
    expect(summary).toMatchObject({
      weeklyMinutes: 25,
      distinctPracticeDays: 2,
      currentStreak: 2,
      xp: 20,
      assignmentCompleted: true,
    });
    expect(summary.items).toEqual([
      expect.objectContaining({
        title: 'Amazing Grace',
        target: 2,
        current: 2,
        completed: true,
      }),
      expect.objectContaining({
        title: 'Year End Recital Solo',
        target: 1,
        current: 1,
        completed: true,
      }),
      expect.objectContaining({
        title: 'Music History Online Test',
        target: 1,
        current: 1,
        completed: true,
      }),
      expect.objectContaining({
        title: 'JR3 Online Written Theory Test',
        target: 1,
        current: 1,
        completed: true,
      }),
    ]);

    const achievementsResponse = await request(httpServer)
      .get(`/students/${studentId}/achievements`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(achievementsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: AchievementKey.FIRST_PRACTICE }),
        expect.objectContaining({
          key: AchievementKey.FIRST_ASSIGNMENT_COMPLETE,
        }),
      ]),
    );
  });
});

function buildAssignment(studentId: string, dates: WorkflowDates) {
  return {
    studentId,
    title: `Weekly Assignment ${dates.startDate}`,
    description: 'Recital preparation and written theory.',
    startDate: dates.startDate,
    endDate: dates.endDate,
    notices: [
      {
        title: 'Year End Recital',
        occursAt: dates.recitalAt,
        location: 'Room 213',
        details: 'Last day of class is next week.',
        position: 0,
      },
    ],
    sections: [
      {
        title: 'Repertoire',
        position: 0,
        items: [
          {
            title: 'Amazing Grace',
            instructions: 'Practice the whole song from memory.',
            completionMode: AssignmentCompletionMode.PRACTICE_DAYS,
            suggestedPracticeDays: 2,
            position: 0,
            resources: [],
          },
          {
            title: 'Year End Recital Solo',
            instructions: 'Memorization is optional.',
            completionMode: AssignmentCompletionMode.PRACTICE_DAYS,
            suggestedPracticeDays: 1,
            position: 1,
            resources: [
              {
                kind: AssignmentResourceKind.YOUTUBE,
                displayName: 'Recital song reference',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                position: 0,
              },
            ],
          },
        ],
      },
      {
        title: 'Written Theory',
        position: 1,
        items: [
          {
            title: 'Music History Online Test',
            instructions: 'Choose one article, then complete its test.',
            completionMode: AssignmentCompletionMode.ONE_TIME,
            dueAt: dates.theoryDueAt,
            position: 0,
            resources: [
              {
                kind: AssignmentResourceKind.EXTERNAL_LINK,
                displayName: 'Junior 3 Music History Assignment',
                url: 'https://example.test/music-history',
                position: 0,
              },
            ],
          },
          {
            title: 'JR3 Online Written Theory Test',
            instructions: 'Complete the test in one sitting.',
            completionMode: AssignmentCompletionMode.ONE_TIME,
            dueAt: dates.theoryDueAt,
            position: 1,
            resources: [
              {
                kind: AssignmentResourceKind.EXTERNAL_LINK,
                displayName: 'JR3 Unit 4 Test',
                url: 'https://example.test/jr3-unit-4',
                position: 0,
              },
            ],
          },
        ],
      },
    ],
  };
}

async function uploadResource(
  server: App,
  token: string,
  itemId: string,
  contents: Buffer,
  filename: string,
  contentType: string,
  displayName: string,
  position: number,
): Promise<ResourceBody> {
  const response = await request(server)
    .post(`/student-assignment-items/${itemId}/resources/upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('displayName', displayName)
    .field('position', String(position))
    .attach('file', contents, { filename, contentType })
    .expect(201);
  return response.body as ResourceBody;
}

async function createPracticeSession(
  server: App,
  token: string,
  studentId: string,
  assignmentItemId: string,
  practicedAt: string,
  durationSeconds: number,
): Promise<void> {
  await request(server)
    .post('/practice-sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({ studentId, assignmentItemId, practicedAt, durationSeconds })
    .expect(201);
}

async function getWorkflowDates(
  dataSource: DataSource,
): Promise<WorkflowDates> {
  const result: unknown = await dataSource.query(
    `SELECT
       ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date - 6)::text
         AS "startDate",
       (CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date::text
         AS "endDate",
       ((((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date - 2)
         + TIME '12:00') AT TIME ZONE 'America/Toronto')::text
         AS "firstPractice",
       ((((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date - 1)
         + TIME '12:00') AT TIME ZONE 'America/Toronto')::text
         AS "secondPractice",
       ((((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date + 1)
         + TIME '18:45') AT TIME ZONE 'America/Toronto')::text
         AS "recitalAt",
       ((((CURRENT_TIMESTAMP AT TIME ZONE 'America/Toronto')::date)
         + TIME '18:00') AT TIME ZONE 'America/Toronto')::text
         AS "theoryDueAt"`,
  );
  return (result as WorkflowDates[])[0];
}

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

function subscribe(socket: Socket, studentId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(1000)
      .emit(
        'student.subscribe',
        { studentId },
        (error: Error | null, response: { subscribed?: boolean }) => {
          if (error) return reject(error);
          if (!response?.subscribed) {
            return reject(new Error('Room subscription failed'));
          }
          resolve();
        },
      );
  });
}

function waitForAchievement(
  socket: Socket,
  key: AchievementKey,
): Promise<{ studentId: string; achievementKey: AchievementKey }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Achievement ${key} was not received`)),
      2000,
    );
    socket.on(
      'achievement.unlocked',
      (event: { studentId: string; achievementKey: AchievementKey }) => {
        if (event.achievementKey !== key) return;
        clearTimeout(timeout);
        resolve(event);
      },
    );
  });
}
