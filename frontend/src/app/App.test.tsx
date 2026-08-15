import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../features/auth/auth-storage';
import { App } from './App';
import { createAppStore } from './store';

describe('authentication flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
    vi.unstubAllGlobals();
  });

  it('redirects an anonymous visitor from protected content to login', async () => {
    render(<App appStore={createAppStore()} />);
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('shows useful field errors without sending an invalid login', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/login');
    render(<App appStore={createAppStore()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a safe message when the API rejects the credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Unauthorized',
            error: 'Unauthorized',
            statusCode: 401,
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    window.history.replaceState({}, '', '/login');
    render(<App appStore={createAppStore()} />);

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toHaveAttribute('role', 'alert');
  });

  it('signs in and returns the user to the protected page they requested', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const request = input as Request;
      if (request.url.endsWith('/auth/login')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: { access_token: 'new-token' },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return authenticatedApiResponse(request, 'new-token');
    });
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/practice');
    render(<App appStore={createAppStore()} />);
    await screen.findByRole('heading', { name: 'Sign in' });

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', {
        name: 'There is no active practice assignment.',
      }),
    ).toBeInTheDocument();
    expect(authStorage.read()).toBe('new-token');
    expect(window.location.pathname).toBe('/practice');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('restores a valid user on refresh and sends the bearer token', async () => {
    authStorage.write('valid-token');
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const request = input as Request;
      expect(request.headers.get('authorization')).toBe('Bearer valid-token');
      return authenticatedApiResponse(request, 'valid-token');
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App appStore={createAppStore()} />);

    expect(
      await screen.findByRole('heading', {
        name: 'Add the student you practice with.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shows the selected student current assignment, progress, notices, and rewards', async () => {
    authStorage.write('valid-token');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation((input) => {
        const request = input as Request;
        const path = new URL(request.url).pathname;
        if (path === '/auth/me') {
          return jsonResponse({
            success: true,
            data: {
              id: '0a96c40e-e677-4f1f-87dd-47cd202214e8',
              email: 'owner@example.com',
              firstName: 'Luis',
              lastName: 'Owner',
            },
          });
        }
        if (path === '/students') {
          return jsonResponse({
            success: true,
            data: [
              {
                id: '3bd10a90-bca1-4e1e-87f2-f98b01322ee0',
                firstName: 'Mia',
                lastName: 'Student',
                dateOfBirth: '2014-01-01',
                timeZone: 'America/Toronto',
              },
            ],
            meta: {
              itemsPerPage: 100,
              totalItems: 1,
              currentPage: 1,
              totalPages: 1,
            },
          });
        }
        if (path === '/student-assignments') {
          return jsonResponse({
            success: true,
            data: [
              {
                id: '70b93a9f-6d5a-4e9e-9c3d-31847238fb86',
                studentId: '3bd10a90-bca1-4e1e-87f2-f98b01322ee0',
                title: 'Recital preparation',
                startDate: '2000-01-01',
                endDate: '2099-12-31',
                status: 'published',
                notices: [
                  {
                    id: 'aad37864-ce10-43a8-ae71-01edade39403',
                    title: 'Year End Recital',
                    occursAt: '2026-06-22T22:45:00.000Z',
                    location: 'Room 213',
                    details: 'Arrive ten minutes early.',
                    position: 0,
                  },
                ],
                sections: [
                  {
                    id: 'af0a8530-9b21-4621-8567-7cf2d263b1b0',
                    title: 'Repertoire',
                    position: 0,
                    items: [
                      {
                        id: 'e0fc7744-41fc-4638-bb3b-fac25c4d85ad',
                        title: 'Amazing Grace',
                        instructions: 'The whole song, memorized.',
                        completionMode: 'practice_days',
                        suggestedPracticeDays: 5,
                        dueAt: null,
                        position: 0,
                        resources: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        }
        if (path.endsWith('/practice-summary')) {
          return jsonResponse({
            success: true,
            data: {
              assignmentId: '70b93a9f-6d5a-4e9e-9c3d-31847238fb86',
              studentId: '3bd10a90-bca1-4e1e-87f2-f98b01322ee0',
              startDate: '2000-01-01',
              endDate: '2099-12-31',
              weeklyMinutes: 42,
              distinctPracticeDays: 3,
              currentStreak: 3,
              xp: 30,
              assignmentCompleted: false,
              items: [
                {
                  itemId: 'e0fc7744-41fc-4638-bb3b-fac25c4d85ad',
                  sectionId: 'af0a8530-9b21-4621-8567-7cf2d263b1b0',
                  sectionTitle: 'Repertoire',
                  title: 'Amazing Grace',
                  mode: 'practice_days',
                  target: 5,
                  current: 3,
                  completed: false,
                },
              ],
            },
          });
        }
        return jsonResponse({
          success: true,
          data: [
            {
              id: 'f89ccaa6-dd95-4dbb-b7ab-311809ae39c2',
              key: 'three_day_streak',
              title: 'Practice Spark',
              description: 'Build a three-day practice streak.',
              unlockedAt: '2026-08-15T12:00:00.000Z',
            },
          ],
        });
      }),
    );

    render(<App appStore={createAppStore()} />);

    expect(
      await screen.findByRole('heading', { name: 'Mia’s practice week' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Year End Recital')).toBeInTheDocument();
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(await screen.findByLabelText('3 of 5 complete')).toBeInTheDocument();
    expect(await screen.findByText('Practice Spark')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continue practice' }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('link', { name: 'Continue practice' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Practice with Mia' }),
    ).toBeInTheDocument();
    expect(screen.getByText('The whole song, memorized.')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Practice timer and metronome' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start timer' }),
    ).toBeInTheDocument();
  });

  it('clears authentication and returns to login on logout', async () => {
    authStorage.write('valid-token');
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockImplementation((input) =>
          authenticatedApiResponse(input as Request, 'valid-token'),
        ),
    );
    render(<App appStore={createAppStore()} />);
    await screen.findByRole('button', { name: 'Sign out' });

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(window.location.pathname).toBe('/login'));
    expect(authStorage.read()).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument();
  });
});

function authenticatedApiResponse(
  request: Request,
  token: string,
): Promise<Response> {
  expect(request.headers.get('authorization')).toBe(`Bearer ${token}`);
  const url = new URL(request.url);
  let payload: unknown;
  if (url.pathname === '/auth/me') {
    payload = {
      success: true,
      data: {
        id: '0a96c40e-e677-4f1f-87dd-47cd202214e8',
        email: 'owner@example.com',
        firstName: 'Luis',
        lastName: 'Owner',
      },
    };
  } else if (url.pathname === '/students') {
    payload = {
      success: true,
      data: [],
      meta: { itemsPerPage: 100, totalItems: 0, currentPage: 1, totalPages: 0 },
    };
  } else {
    payload = { success: true, data: [] };
  }
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function jsonResponse(payload: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
