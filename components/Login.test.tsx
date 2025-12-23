import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../tests/utils/renderWithProviders';
import Login from './Login';
import { createAdminUser } from '../tests/fixtures/users';

describe('Login', () => {
  it('should render login form', () => {
    const users = [createAdminUser()];
    renderWithProviders(<Login onLogin={vi.fn()} users={users} />);

    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});
