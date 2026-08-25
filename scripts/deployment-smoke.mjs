import { io } from 'socket.io-client';

const apiUrl = requiredUrl('DEPLOYMENT_API_URL');
const frontendUrl = requiredUrl('DEPLOYMENT_FRONTEND_URL');
const email = required('DEPLOYMENT_SMOKE_EMAIL');
const password = required('DEPLOYMENT_SMOKE_PASSWORD');
const keepData = process.env.DEPLOYMENT_SMOKE_KEEP_DATA === 'true';
const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

let token;
let studentId;
let sessionId;
let resourceId;
let socket;

try {
  await checkFrontendRoute();
  await checkReadiness();
  await expectStatus('/students', { method: 'GET' }, 401);

  token = await login();
  studentId = await createStudent();
  const { assignmentId, itemId } = await createAssignment(studentId);

  resourceId = await uploadResource(itemId);
  await verifyAuthorizedResourceRead(resourceId);
  await apiRequest(`/assignment-resources/${resourceId}`, {
    method: 'DELETE',
  });
  resourceId = undefined;

  socket = await connectAchievements(token, studentId);
  const firstPracticeUnlock = waitForAchievement(socket, 'first_practice');

  await apiRequest(`/student-assignments/${assignmentId}/publish`, {
    method: 'POST',
  });
  sessionId = await submitPractice(studentId, itemId);

  const achievement = await firstPracticeUnlock;
  assert(
    achievement.studentId === studentId,
    'Live achievement belongs to an unexpected student',
  );

  await verifyProgress(assignmentId);
  await verifyRewards(studentId);

  console.log('Deployment smoke test passed.');
  console.log(`Verified API: ${apiUrl}`);
  console.log(`Verified frontend: ${frontendUrl}`);
  console.log(
    'Verified readiness, auth, private resource access, practice, XP, and live achievements.',
  );
} finally {
  socket?.close();
  if (!keepData && token) {
    await cleanup().catch((error) => {
      console.error(`Smoke cleanup failed: ${errorMessage(error)}`);
      process.exitCode = 1;
    });
  }
}

async function checkFrontendRoute() {
  const response = await fetch(new URL('/students/new', frontendUrl));
  assert(response.ok, `Frontend route returned HTTP ${response.status}`);
  const html = await response.text();
  assert(
    response.headers.get('content-type')?.includes('text/html') &&
      html.includes('id="root"'),
    'Frontend did not serve the React entry point for a client-side route',
  );
}

async function checkReadiness() {
  const response = await apiRequest('/health', { authenticated: false });
  const health = unwrap(response);
  assert(health.status === 'ready', 'API did not report ready');
  assert(health.checks?.database === 'up', 'Database did not report ready');
}

async function login() {
  const response = await apiRequest('/auth/login', {
    authenticated: false,
    method: 'POST',
    body: { email, password },
  });
  const accessToken = unwrap(response).access_token;
  assert(
    typeof accessToken === 'string',
    'Login did not return an access token',
  );
  return accessToken;
}

async function createStudent() {
  const response = await apiRequest('/students', {
    method: 'POST',
    body: {
      firstName: 'Deployment',
      lastName: `Smoke ${runId}`,
      dateOfBirth: '2012-01-01',
      timeZone: 'America/Toronto',
    },
  });
  const student = unwrap(response);
  assert(
    typeof student.id === 'string',
    'Student creation did not return an ID',
  );
  return student.id;
}

async function createAssignment(createdStudentId) {
  const startDate = localDate('America/Toronto');
  const endDate = addDays(startDate, 6);
  const response = await apiRequest('/student-assignments', {
    method: 'POST',
    body: {
      studentId: createdStudentId,
      title: `Deployment smoke ${runId}`,
      description: 'Temporary assignment created by the deployment smoke test.',
      startDate,
      endDate,
      notices: [],
      sections: [
        {
          title: 'Technique',
          position: 0,
          items: [
            {
              title: 'Smoke-test exercise',
              instructions: 'Record one short practice session.',
              completionMode: 'practice_days',
              suggestedPracticeDays: 1,
              position: 0,
              resources: [],
            },
          ],
        },
      ],
    },
  });
  const assignment = unwrap(response);
  const itemId = assignment.sections?.[0]?.items?.[0]?.id;
  assert(
    typeof assignment.id === 'string',
    'Assignment creation did not return an ID',
  );
  assert(
    typeof itemId === 'string',
    'Assignment creation did not return an item ID',
  );
  return { assignmentId: assignment.id, itemId };
}

async function uploadResource(itemId) {
  const form = new FormData();
  form.append('displayName', 'Deployment smoke PDF');
  form.append('position', '0');
  form.append(
    'file',
    new Blob(['%PDF-1.4\n% deployment smoke test\n%%EOF\n'], {
      type: 'application/pdf',
    }),
    'deployment-smoke.pdf',
  );
  const response = await apiRequest(
    `/student-assignment-items/${itemId}/resources/upload`,
    { method: 'POST', body: form },
  );
  const resource = unwrap(response);
  assert(
    resource.kind === 'upload',
    'Uploaded resource has an unexpected kind',
  );
  assert(
    resource.url === null,
    'Uploaded resource exposed a permanent public URL',
  );
  return resource.id;
}

async function verifyAuthorizedResourceRead(uploadedResourceId) {
  await expectStatus(
    `/assignment-resources/${uploadedResourceId}/access-url`,
    { method: 'GET' },
    401,
  );
  const response = await apiRequest(
    `/assignment-resources/${uploadedResourceId}/access-url`,
  );
  const access = unwrap(response);
  assert(
    typeof access.url === 'string',
    'Resource access did not return a signed URL',
  );
  assert(
    Number.isInteger(access.expiresInSeconds) && access.expiresInSeconds > 0,
    'Resource access did not report a finite expiry',
  );
  const signedUrl = new URL(access.url);
  assert(
    signedUrl.searchParams.has('X-Amz-Signature'),
    'Resource URL is not an AWS-compatible signed URL',
  );
  const fileResponse = await fetch(signedUrl);
  assert(
    fileResponse.ok,
    `Signed resource read returned HTTP ${fileResponse.status}`,
  );
  const bytes = new Uint8Array(await fileResponse.arrayBuffer());
  assert(
    new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-',
    'Signed resource read returned unexpected content',
  );
}

async function connectAchievements(accessToken, createdStudentId) {
  const connection = io(new URL('/achievements', apiUrl).toString(), {
    transports: ['websocket'],
    auth: { token: accessToken },
    timeout: 10_000,
  });
  await once(connection, 'connect', 15_000);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Achievement subscription timed out')),
      10_000,
    );
    connection.emit(
      'student.subscribe',
      { studentId: createdStudentId },
      (result) => {
        clearTimeout(timeout);
        if (result?.subscribed === true) resolve();
        else reject(new Error('Achievement subscription was rejected'));
      },
    );
  });
  return connection;
}

async function submitPractice(createdStudentId, itemId) {
  const response = await apiRequest('/practice-sessions', {
    method: 'POST',
    body: {
      studentId: createdStudentId,
      assignmentItemId: itemId,
      durationSeconds: 60,
      practicedAt: new Date(Date.now() - 1_000).toISOString(),
      note: 'Deployment smoke test.',
    },
  });
  const session = unwrap(response);
  assert(session.durationSeconds === 60, 'Practice duration was not persisted');
  return session.id;
}

async function verifyProgress(assignmentId) {
  await eventually(async () => {
    const response = await apiRequest(
      `/student-assignments/${assignmentId}/practice-summary`,
    );
    const progress = unwrap(response);
    assert(progress.distinctPracticeDays === 1, 'Practice day did not update');
    assert(progress.xp >= 10, 'Daily practice XP was not awarded');
    assert(
      progress.items?.[0]?.completed === true,
      'Assignment item did not complete',
    );
  });
}

async function verifyRewards(createdStudentId) {
  const response = await apiRequest(
    `/students/${createdStudentId}/achievements`,
  );
  const achievements = unwrap(response);
  assert(
    achievements.some((achievement) => achievement.key === 'first_practice'),
    'First-practice achievement was not persisted',
  );
}

function waitForAchievement(connection, key) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Live achievement ${key} timed out`)),
      15_000,
    );
    const listener = (achievement) => {
      if (achievement?.achievementKey !== key) return;
      clearTimeout(timeout);
      connection.off('achievement.unlocked', listener);
      resolve(achievement);
    };
    connection.on('achievement.unlocked', listener);
  });
}

async function cleanup() {
  if (resourceId) {
    await apiRequest(`/assignment-resources/${resourceId}`, {
      method: 'DELETE',
    });
  }
  if (sessionId) {
    await apiRequest(`/practice-sessions/${sessionId}`, { method: 'DELETE' });
  }
  if (studentId) {
    await apiRequest(`/students/${studentId}`, { method: 'DELETE' });
  }
}

async function apiRequest(path, options = {}) {
  const {
    authenticated = true,
    body,
    headers: extraHeaders,
    ...init
  } = options;
  const headers = new Headers(extraHeaders);
  if (authenticated) {
    assert(token, `Authenticated request ${path} was made before login`);
    headers.set('Authorization', `Bearer ${token}`);
  }
  let requestBody = body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(body);
  }
  const response = await fetch(new URL(path, apiUrl), {
    ...init,
    headers,
    body: requestBody,
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${path} returned HTTP ${response.status}: ${JSON.stringify(parsed)}`,
    );
  }
  return parsed;
}

async function expectStatus(path, options, expectedStatus) {
  const headers = new Headers(options.headers);
  const response = await fetch(new URL(path, apiUrl), {
    ...options,
    headers,
  });
  assert(
    response.status === expectedStatus,
    `${options.method ?? 'GET'} ${path} returned ${response.status}; expected ${expectedStatus}`,
  );
}

function once(connection, event, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Socket.IO ${event} timed out`)),
      timeoutMs,
    );
    connection.once(event, (...args) => {
      clearTimeout(timeout);
      resolve(args);
    });
    connection.once('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function eventually(assertion, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await assertion();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError;
}

function unwrap(response) {
  return response?.success === true && 'data' in response
    ? response.data
    : response;
}

function localDate(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function requiredUrl(name) {
  const value = required(name);
  const url = new URL(value);
  assert(
    ['http:', 'https:'].includes(url.protocol),
    `${name} must use HTTP or HTTPS`,
  );
  return url.toString().replace(/\/$/, '');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
