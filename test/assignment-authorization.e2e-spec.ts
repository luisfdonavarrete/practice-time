import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { StudentAssignmentStatus } from '../src/student-assignments/entities/student-assignment.entity';

interface AssignmentFixture {
  assignmentId: string;
  itemId: string;
  resourceId: string;
}

describe('Assignment ownership authorization', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let ownerId: string;
  let unrelatedUserId: string;
  let activeStudentId: string;
  let inactiveStudentId: string;
  let unrelatedStudentId: string;
  let ownerToken: string;
  let unrelatedToken: string;
  let draft: AssignmentFixture;
  let published: AssignmentFixture;
  let archived: AssignmentFixture;
  let cancelled: AssignmentFixture;
  let inactiveDraft: AssignmentFixture;
  let unrelatedDraft: AssignmentFixture;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const users: unknown = await dataSource.query(
      `INSERT INTO users
       (email, password, first_name, last_name, date_of_birth)
       VALUES
       ($1, 'hash', 'Assignment', 'Owner', '1990-01-01'),
       ($2, 'hash', 'Unrelated', 'User', '1990-01-01')
       RETURNING id`,
      [
        `assignment-owner-${crypto.randomUUID()}@example.com`,
        `assignment-other-${crypto.randomUUID()}@example.com`,
      ],
    );
    [{ id: ownerId }, { id: unrelatedUserId }] = users as Array<{
      id: string;
    }>;
    const students: unknown = await dataSource.query(
      `INSERT INTO student
       (owner_user_id, first_name, last_name, date_of_birth, time_zone, is_active)
       VALUES
       ($1, 'Active', 'Student', '2010-01-01', 'America/Toronto', true),
       ($1, 'Inactive', 'Student', '2010-01-01', 'America/Toronto', false),
       ($2, 'Other', 'Student', '2010-01-01', 'America/Toronto', true)
       RETURNING id`,
      [ownerId, unrelatedUserId],
    );
    [
      { id: activeStudentId },
      { id: inactiveStudentId },
      { id: unrelatedStudentId },
    ] = students as Array<{ id: string }>;

    draft = await seedAssignment(
      dataSource,
      activeStudentId,
      ownerId,
      StudentAssignmentStatus.DRAFT,
      0,
    );
    published = await seedAssignment(
      dataSource,
      activeStudentId,
      ownerId,
      StudentAssignmentStatus.PUBLISHED,
      1,
    );
    archived = await seedAssignment(
      dataSource,
      activeStudentId,
      ownerId,
      StudentAssignmentStatus.ARCHIVED,
      2,
    );
    cancelled = await seedAssignment(
      dataSource,
      activeStudentId,
      ownerId,
      StudentAssignmentStatus.CANCELLED,
      3,
    );
    inactiveDraft = await seedAssignment(
      dataSource,
      inactiveStudentId,
      ownerId,
      StudentAssignmentStatus.DRAFT,
      4,
    );
    unrelatedDraft = await seedAssignment(
      dataSource,
      unrelatedStudentId,
      unrelatedUserId,
      StudentAssignmentStatus.DRAFT,
      5,
    );
    ownerToken = await jwtService.signAsync({ sub: ownerId });
    unrelatedToken = await jwtService.signAsync({ sub: unrelatedUserId });
  });

  afterEach(async () => {
    await dataSource.query(
      `DELETE FROM student_assignments
       WHERE creator_user_id = ANY($1::uuid[])`,
      [[ownerId, unrelatedUserId]],
    );
    await dataSource.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [ownerId, unrelatedUserId],
    ]);
  });

  it('lists and reads every owned historical state without leaking another owner', async () => {
    const list = await request(app.getHttpServer())
      .get('/student-assignments?limit=100')
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);
    const listBody = (
      list as unknown as { body: { data: Array<{ id: string }> } }
    ).body;
    expect(listBody.data.map((assignment) => assignment.id)).toEqual(
      expect.arrayContaining([
        draft.assignmentId,
        published.assignmentId,
        archived.assignmentId,
        cancelled.assignmentId,
        inactiveDraft.assignmentId,
      ]),
    );
    expect(
      listBody.data.some(
        (assignment) => assignment.id === unrelatedDraft.assignmentId,
      ),
    ).toBe(false);

    for (const fixture of [draft, published, archived, cancelled]) {
      await request(app.getHttpServer())
        .get(`/student-assignments/${fixture.assignmentId}`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/student-assignments/${fixture.assignmentId}`)
        .auth(unrelatedToken, { type: 'bearer' })
        .expect(404);
      await request(app.getHttpServer())
        .get(`/student-assignment-items/${fixture.itemId}/resources`)
        .auth(ownerToken, { type: 'bearer' })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/student-assignment-items/${fixture.itemId}/resources`)
        .auth(unrelatedToken, { type: 'bearer' })
        .expect(404);
    }
  });

  it('preserves inactive student history while rejecting every new assignment write', async () => {
    await request(app.getHttpServer())
      .get(`/student-assignments/${inactiveDraft.assignmentId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .get(`/student-assignment-items/${inactiveDraft.itemId}/resources`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/student-assignments/${inactiveDraft.assignmentId}`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ title: 'Forbidden update' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/student-assignments/${inactiveDraft.assignmentId}/publish`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/student-assignments/${inactiveDraft.assignmentId}/duplicate`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ startDate: '2026-09-21' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/student-assignment-items/${inactiveDraft.itemId}/resources/links`)
      .auth(ownerToken, { type: 'bearer' })
      .send(linkResource(1))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/assignment-resources/${inactiveDraft.resourceId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(404);
  });

  it('allows only the owner to author a draft and protects non-draft nested content', async () => {
    await request(app.getHttpServer())
      .patch(`/student-assignments/${draft.assignmentId}`)
      .auth(unrelatedToken, { type: 'bearer' })
      .send({ title: 'Stolen draft' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/student-assignments/${draft.assignmentId}`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ title: 'Owner update' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/student-assignment-items/${draft.itemId}/resources/links`)
      .auth(unrelatedToken, { type: 'bearer' })
      .send(linkResource(1))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/student-assignment-items/${draft.itemId}/resources/links`)
      .auth(ownerToken, { type: 'bearer' })
      .send(linkResource(1))
      .expect(201);
    await request(app.getHttpServer())
      .post(`/student-assignment-items/${published.itemId}/resources/links`)
      .auth(ownerToken, { type: 'bearer' })
      .send(linkResource(1))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/assignment-resources/${published.resourceId}`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(404);
  });

  it('enforces draft, published, archived, and cancelled lifecycle rules', async () => {
    await request(app.getHttpServer())
      .patch(`/student-assignments/${published.assignmentId}`)
      .auth(ownerToken, { type: 'bearer' })
      .send({ title: 'Published rewrite' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/student-assignments/${draft.assignmentId}/archive`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(400);
    const archive = await request(app.getHttpServer())
      .post(`/student-assignments/${published.assignmentId}/archive`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(201);
    const archiveBody = (
      archive as unknown as { body: { status: StudentAssignmentStatus } }
    ).body;
    expect(archiveBody.status).toBe(StudentAssignmentStatus.ARCHIVED);
    await request(app.getHttpServer())
      .post(`/student-assignments/${archived.assignmentId}/cancel`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(400);
    const cancel = await request(app.getHttpServer())
      .post(`/student-assignments/${draft.assignmentId}/cancel`)
      .auth(ownerToken, { type: 'bearer' })
      .expect(201);
    const cancelBody = (
      cancel as unknown as { body: { status: StudentAssignmentStatus } }
    ).body;
    expect(cancelBody.status).toBe(StudentAssignmentStatus.CANCELLED);
  });
});

async function seedAssignment(
  dataSource: DataSource,
  studentId: string,
  creatorUserId: string,
  status: StudentAssignmentStatus,
  weekOffset: number,
): Promise<AssignmentFixture> {
  const assignmentRows: unknown = await dataSource.query(
    `INSERT INTO student_assignments
     (student_id, creator_user_id, title, start_date, end_date, status,
      published_at, archived_at)
     VALUES ($1, $2, $3, DATE '2026-08-17' + ($4 * 7),
             DATE '2026-08-23' + ($4 * 7),
             $5::student_assignments_status_enum,
             CASE WHEN $5::text IN ('published', 'archived') THEN CURRENT_TIMESTAMP END,
             CASE WHEN $5::text = 'archived' THEN CURRENT_TIMESTAMP END)
     RETURNING id`,
    [studentId, creatorUserId, `${status} week`, weekOffset, status],
  );
  const [{ id: assignmentId }] = assignmentRows as Array<{ id: string }>;
  const sectionRows: unknown = await dataSource.query(
    `INSERT INTO assignment_sections (assignment_id, title, position)
     VALUES ($1, 'Repertoire', 0) RETURNING id`,
    [assignmentId],
  );
  const [{ id: sectionId }] = sectionRows as Array<{ id: string }>;
  const itemRows: unknown = await dataSource.query(
    `INSERT INTO student_assignment_items
     (section_id, title, completion_mode, suggested_practice_days, position)
     VALUES ($1, 'Scales', 'practice_days', 3, 0) RETURNING id`,
    [sectionId],
  );
  const [{ id: itemId }] = itemRows as Array<{ id: string }>;
  const resourceRows: unknown = await dataSource.query(
    `INSERT INTO assignment_item_resources
     (item_id, kind, display_name, url, position, is_active)
     VALUES ($1, 'external_link', 'Reference', 'https://example.com/resource', 0, true)
     RETURNING id`,
    [itemId],
  );
  const [{ id: resourceId }] = resourceRows as Array<{ id: string }>;
  return { assignmentId, itemId, resourceId };
}

function linkResource(position: number) {
  return {
    kind: 'external_link',
    displayName: 'New reference',
    url: 'https://example.com/new-resource',
    position,
  };
}
