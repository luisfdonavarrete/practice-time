import { useState, type FormEvent } from 'react';
import { isFetchBaseQueryError } from '../features/auth/is-fetch-base-query-error';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useLoginMutation } from '../features/auth/auth.api';
import { authStorage } from '../features/auth/auth-storage';
import { tokenReceived } from '../features/auth/auth.slice';
import { MetronomeMark } from '../components/MetronomeMark';

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (currentUser) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    setServerError(null);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      authStorage.write(result.accessToken);
      dispatch(tokenReceived(result.accessToken));
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from ?? '/', { replace: true });
    } catch (error) {
      setServerError(loginErrorMessage(error));
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Sign in form">
        <form onSubmit={(event) => void submit(event)} noValidate>
          <MetronomeMark className="login-mark" />
          <h2>Sign in</h2>

          {serverError && (
            <div className="form-alert" role="alert">
              {serverError}
            </div>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email && (
            <span className="field-error" id="email-error">
              {errors.email}
            </span>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && (
            <span className="field-error" id="password-error">
              {errors.password}
            </span>
          )}

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    errors.email = 'Enter your email address.';
  } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

function loginErrorMessage(error: unknown): string {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 401) return 'Email or password is incorrect.';
    if (error.status === 'FETCH_ERROR') {
      return 'The API could not be reached. Check your connection and try again.';
    }
    if (typeof error.status === 'number' && error.status >= 500) {
      return 'The server could not sign you in. Try again shortly.';
    }
  }
  return 'Sign in failed. Check your details and try again.';
}
