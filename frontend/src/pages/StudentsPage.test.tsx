import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { createAppStore } from '../app/store';
import { authStorage } from '../features/auth/auth-storage';

describe('student management', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/students/new');
    authStorage.write('valid-token');
    vi.unstubAllGlobals();
  });

  it('creates a student and selects the new profile', async () => {
    let created = false;
    let createBody: unknown;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (input) => {
        const request = input as Request;
        const path = new URL(request.url).pathname;
        if (path === '/auth/me') {
          return jsonResponse({
            success: true,
            data: {
              id: 'owner-id',
              email: 'owner@example.com',
              firstName: 'Luis',
              lastName: 'Owner',
            },
          });
        }
        if (path === '/students' && request.method === 'POST') {
          createBody = await request.clone().json();
          created = true;
          return jsonResponse({ success: true, data: student });
        }
        if (path === '/students') {
          return jsonResponse({
            success: true,
            data: created ? [student] : [],
            meta: {
              itemsPerPage: 100,
              totalItems: created ? 1 : 0,
              currentPage: 1,
              totalPages: created ? 1 : 0,
            },
          });
        }
        throw new Error(`Unexpected request: ${request.method} ${path}`);
      }),
    );

    render(<App appStore={createAppStore()} />);

    expect(
      await screen.findByRole('heading', { name: 'Add a student' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Who is practicing?' }),
    ).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/students/new');

    await userEvent.type(screen.getByLabelText('First name'), 'Mia');
    await userEvent.type(screen.getByLabelText('Last name'), 'Student');
    await userEvent.type(screen.getByLabelText('Date of birth'), '2014-01-02');
    await userEvent.selectOptions(
      screen.getByLabelText('Time zone'),
      'America/Toronto',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add student' }));

    await waitFor(() =>
      expect(window.location.pathname).toBe(`/students/${student.id}`),
    );
    expect(createBody).toEqual({
      firstName: 'Mia',
      lastName: 'Student',
      dateOfBirth: '2014-01-02',
      timeZone: 'America/Toronto',
    });
    expect(window.localStorage.getItem('practice-time.selected-student')).toBe(
      student.id,
    );
  });
});

const student = {
  id: '3bd10a90-bca1-4e1e-87f2-f98b01322ee0',
  firstName: 'Mia',
  lastName: 'Student',
  dateOfBirth: '2014-01-02',
  timeZone: 'America/Toronto',
};

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}
