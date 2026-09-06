import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/index';
import { ErrorMessage } from '../../components/UI';

// ─────────────────────────────────────────────────────────────
// BRAND (identical to LoginPages.jsx — kept in sync manually)
// ─────────────────────────────────────────────────────────────

const Brand = () => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        margin: 0,
        padding: 0,
      }}
    >
      <img
        src="/logo.png"
        alt="Vertex Lab"
        style={{
          width: '48px',
          height: '48px',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto',
        }}
      />

      <div
        style={{
          width: '100%',
          marginTop: '3px',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            lineHeight: '21px',
            color: '#111827',
            textAlign: 'center',
            margin: 0,
            padding: 0,
          }}
        >
          VERTEX LAB
        </div>

        <div
          style={{
            fontSize: '8px',
            fontWeight: 500,
            letterSpacing: '0.7px',
            lineHeight: '11px',
            color: '#64748b',
            textAlign: 'center',
            margin: 0,
            padding: 0,
          }}
        >
          EVALUATION PLATFORM
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('This reset link is invalid or missing a token. Please request a new one.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend endpoint expected:
       *
       * POST /api/auth/reset-password/:token
       *
       * Body:
       * {
       *   password
       * }
       */

      await authService.resetPassword(token, password);

      setSuccess('Your password has been reset successfully. Redirecting to sign in...');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/student/login', { replace: true });
      }, 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'This reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '450px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          padding: '38px 36px 32px',
        }}
      >
        {/* BRAND */}

        <Brand />

        {/* TITLE */}

        <h1
          className="auth-title"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '26px 0 8px 0',
            padding: 0,
            lineHeight: '1.25',
          }}
        >
          Reset Password
        </h1>

        {/* SUBTITLE */}

        <p
          className="auth-subtitle"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '0 0 25px 0',
            padding: 0,
            lineHeight: '1.5',
          }}
        >
          Enter a new password for your account.
        </p>

        {/* ERROR */}

        <ErrorMessage message={error} />

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              marginBottom: '18px',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'left',
            }}
          >
            {success}
          </div>
        )}

        {/* FORM */}

        {!success && (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{
              width: '100%',
              margin: 0,
              padding: 0,
            }}
          >
            {/* NEW PASSWORD */}

            <div
              className="form-group"
              style={{
                width: '100%',
                marginBottom: '18px',
              }}
            >
              <label
                htmlFor="new-password"
                className="form-label"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '7px',
                }}
              >
                New Password <span className="form-required">*</span>
              </label>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                }}
              >
                <input
                  id="new-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '42px',
                    boxSizing: 'border-box',
                    paddingRight: '44px',
                  }}
                />

                <button
                  type="button"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    margin: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-muted)',
                  }}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}

            <div
              className="form-group"
              style={{
                width: '100%',
                marginBottom: '18px',
              }}
            >
              <label
                htmlFor="confirm-password"
                className="form-label"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '7px',
                }}
              >
                Confirm Password <span className="form-required">*</span>
              </label>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                }}
              >
                <input
                  id="confirm-password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '42px',
                    boxSizing: 'border-box',
                    paddingRight: '44px',
                  }}
                />

                <button
                  type="button"
                  aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    margin: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-muted)',
                  }}
                >
                  {showConfirmPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              {loading ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {/* BACK TO LOGIN */}

        <div
          style={{
            width: '100%',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <Link
            to="/student/login"
            style={{
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              padding: '4px 8px',
              textDecoration: 'none',
            }}
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
