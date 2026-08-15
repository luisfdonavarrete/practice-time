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
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { access_token: 'new-token' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: '0a96c40e-e677-4f1f-87dd-47cd202214e8',
              email: 'owner@example.com',
              firstName: 'Luis',
              lastName: 'Owner',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    window.history.replaceState({}, '', '/practice');
    render(<App appStore={createAppStore()} />);
    await screen.findByRole('heading', { name: 'Sign in' });

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Practice' }),
    ).toBeInTheDocument();
    expect(authStorage.read()).toBe('new-token');
    expect(window.location.pathname).toBe('/practice');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('restores a valid user on refresh and sends the bearer token', async () => {
    authStorage.write('valid-token');
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((input) => {
      const request = input as Request;
      expect(request.headers.get('authorization')).toBe('Bearer valid-token');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: '0a96c40e-e677-4f1f-87dd-47cd202214e8',
              email: 'owner@example.com',
              firstName: 'Luis',
              lastName: 'Owner',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App appStore={createAppStore()} />);

    expect(
      await screen.findByRole('heading', {
        name: 'Make every practice day count.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('clears authentication and returns to login on logout', async () => {
    authStorage.write('valid-token');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: '0a96c40e-e677-4f1f-87dd-47cd202214e8',
              email: 'owner@example.com',
              firstName: 'Luis',
              lastName: 'Owner',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
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
