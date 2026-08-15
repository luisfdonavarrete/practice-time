import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the shell and navigates without reloading', async () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Make every practice day count.' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Practice' }));
    expect(
      screen.getByRole('heading', { name: 'Practice' }),
    ).toBeInTheDocument();
  });
});
