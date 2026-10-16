import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Token } from '../services/api';
import loginBg from '../assets/login-bg.png';
import containerIcon from '../assets/Container.svg';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check saved remember me email on load
  useEffect(() => {
    const savedEmail = localStorage.getItem('swifttrack_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await API.auth.login(email, password);
      const token = result.data.token;
      const user = result.data.user;

      Token.set(token);
      localStorage.setItem('user', JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem('swifttrack_remembered_email', email);
      } else {
        localStorage.removeItem('swifttrack_remembered_email');
      }

      const routes = {
        super_user: '/admin/dashboard',
        admin: '/admin/dashboard',
        hub_manager: '/hub/dashboard',
        customer: '/customer/dashboard',
        merchant: '/merchant/dashboard',
        delivery_agent: '/agent/dashboard',
      };

      const destination = routes[user.role];
      if (destination) {
        navigate(destination);
      } else {
        Token.clear();
        localStorage.removeItem('user');
        setError('No dashboard configured for this role');
      }
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
                <span>Remember me</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your administrator or hub manager to reset your password.'); }} className="forgot-link">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="divider">or</div>

            <button
              type="button"
              className="google-btn"
              onClick={() => alert('Google Single Sign-On is configured for company domain accounts.')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="auth-footer">
              Don't have an account?{' '}
              <a href="#signup" onClick={(e) => { e.preventDefault(); alert('Please reach out to your administrator to create a SwiftTrack account.'); }}>
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}