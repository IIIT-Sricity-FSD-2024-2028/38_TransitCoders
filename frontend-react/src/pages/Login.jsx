import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API } from '../services/api';
import { dashboards, saveSession } from '../services/session';
import loginBg from '../assets/login-bg.png';
import containerIcon from '../assets/Container.svg';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem('swifttrack_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('swifttrack_remembered_email')));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await API.auth.login(email.trim().toLowerCase(), password);
      const { token, user } = result.data;
      const destination = dashboards[user.role];
      if (!destination) throw new Error('No dashboard is configured for this role.');
      saveSession(token, user);

      if (rememberMe) {
        localStorage.setItem('swifttrack_remembered_email', email);
      } else {
        localStorage.removeItem('swifttrack_remembered_email');
      }

      const from = location.state?.from;
      const portal = destination.slice(0, destination.lastIndexOf('/'));
      const canReturn = from?.pathname === portal || from?.pathname.startsWith(`${portal}/`);
      navigate(canReturn ? { pathname: from.pathname, search: from.search, hash: from.hash } : destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      {/* Left Side: Branding & Hero Logistics Image */}
      <div className="auth-left">
        <div className="auth-overlay"></div>
        <img src={loginBg} alt="SwiftTrack Logistics Platform" className="auth-left-img" />

        <div className="auth-left-content">
          <div className="auth-logo">
            <img src={containerIcon} alt="SwiftTrack logo" className="auth-logo-icon" />
            <span className="auth-logo-text">
              <span className="auth-logo-swift">Swift</span>
              <span className="auth-logo-track">Track</span>
            </span>
          </div>

          <div className="auth-promo">
            <h2>
              Streamline Your<br />Delivery Operations
            </h2>
            <p>
              Track shipments in real-time, manage dispatches, and optimize your logistics workflow with our powerful platform.
            </p>
          </div>

          <div className="auth-social-proof">
            <div className="avatars">
              <div className="avatar-circle">RA</div>
              <div className="avatar-circle">PS</div>
              <div className="avatar-circle">VK</div>
            </div>
            <span className="proof-text">Trusted by 2,000+ logistics teams</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sign In Form Box */}
      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error-banner" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember my email</span>
              </label>
              <button type="button" className="forgot-link" aria-expanded={showResetHelp} onClick={() => setShowResetHelp(value => !value)}>Forgot password?</button>
            </div>
            {showResetHelp && <p className="text-sm text-gray-600">Contact your SwiftTrack administrator to reset your password.</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-footer">
              New to SwiftTrack? <Link to="/register">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
