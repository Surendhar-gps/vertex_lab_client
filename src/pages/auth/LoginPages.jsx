import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService, adminService } from '../../services/index';
import { ErrorMessage } from '../../components/UI';

// Fixed academic-year options — matches the backend Class model's enum (I/II/III/IV).
const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];

// ─────────────────────────────────────────────────────────────
// BRAND
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
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────

const ForgotPassword = ({ role, roleLabel, onBack }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your college email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend endpoint expected:
       *
       * POST /api/auth/forgot-password
       *
       * Body:
       * {
       *   email,
       *   role
       * }
       */

      await authService.forgotPassword(cleanEmail, role);

      setSuccess(
        `If an account exists for this email, a password reset link has been sent to ${cleanEmail}. Please check your inbox.`
      );

      setEmail('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to send password reset email. Please try again.'
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

        {/* ROLE */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '26px',
            marginBottom: '18px',
          }}
        >
          <span
            className="auth-role-tag"
            style={{
              margin: 0,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* TITLE */}

        <h1
          className="auth-title"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '0 0 8px 0',
            padding: 0,
            lineHeight: '1.25',
          }}
        >
          Forgot Password?
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
          Enter your college email and we'll send you a password reset link.
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

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            width: '100%',
            margin: 0,
            padding: 0,
          }}
        >
          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '18px',
            }}
          >
            <label
              htmlFor="forgot-email"
              className="form-label"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              College Email{' '}
              <span className="form-required">*</span>
            </label>

            <input
              id="forgot-email"
              type="email"
              className="form-input"
              placeholder="yourname@college.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (error) {
                  setError('');
                }

                if (success) {
                  setSuccess('');
                }
              }}
              autoComplete="email"
              disabled={loading}
              style={{
                width: '100%',
                height: '42px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* SEND RESET LINK */}

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
              <span
                className="spinner"
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* BACK TO LOGIN */}

        <div
          style={{
            width: '100%',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              padding: '4px 8px',
            }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SHARED LOGIN PAGE
// ─────────────────────────────────────────────────────────────

const LoginPage = ({ role, roleLabel, otherLinks }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    const result = await login(
      email.trim(),
      password,
      role
    );

    if (!result.success) {
      if (result.needsRegistration) {
        setNeedsRegistration(true);
        return;
      }

      setError(result.message);
      return;
    }

    const { user } = result;

    if (user.role !== role) {
      setError(
        `This login is for ${roleLabel} only. Please use the correct login page.`
      );
      return;
    }

    // Student first login
    if (
      role === 'student' &&
      !user.profileCompleted
    ) {
      navigate(
        '/student/profile-setup',
        { replace: true }
      );
      return;
    }

    navigate(
      `/${role}/dashboard`,
      { replace: true }
    );
  };

  // ─────────────────────────────────────────────
  // FORGOT PASSWORD SCREEN
  // ─────────────────────────────────────────────

  if (showForgotPassword) {
    return (
      <ForgotPassword
        role={role}
        roleLabel={roleLabel}
        onBack={() => {
          setShowForgotPassword(false);
          setError('');
        }}
      />
    );
  }

  // ─────────────────────────────────────────────
  // STUDENT REGISTRATION
  // ─────────────────────────────────────────────

  if (
    needsRegistration &&
    role === 'student'
  ) {
    return (
      <StudentRegistrationForm
        prefillEmail={email}
        onSuccess={() =>
          navigate(
            '/student/dashboard',
            { replace: true }
          )
        }
        onBack={() =>
          setNeedsRegistration(false)
        }
      />
    );
  }

  // ─────────────────────────────────────────────
  // LOGIN PAGE
  // ─────────────────────────────────────────────

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

        {/* ROLE */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '26px',
            marginBottom: '18px',
          }}
        >
          <span
            className="auth-role-tag"
            style={{
              margin: 0,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* TITLE */}

        <h1
          className="auth-title"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '0 0 6px 0',
            padding: 0,
            lineHeight: '1.25',
          }}
        >
          Welcome back
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
          Sign in with your college email to continue
        </p>

        {/* ERROR */}

        <ErrorMessage message={error} />

        {/* LOGIN FORM */}

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            width: '100%',
            margin: 0,
            padding: 0,
          }}
        >

          {/* EMAIL */}

          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '18px',
            }}
          >
            <label
              htmlFor="email"
              className="form-label"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              College Email{' '}
              <span className="form-required">
                *
              </span>
            </label>

            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="yourname@college.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (error) {
                  setError('');
                }
              }}
              autoComplete="email"
              disabled={loading}
              style={{
                width: '100%',
                height: '42px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* PASSWORD */}

          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '8px',
            }}
          >
            <label
              htmlFor="password"
              className="form-label"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              Password{' '}
              <span className="form-required">
                *
              </span>
            </label>

            <div
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <input
                id="password"
                type={
                  showPwd
                    ? 'text'
                    : 'password'
                }
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (error) {
                    setError('');
                  }
                }}
                autoComplete="current-password"
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
                aria-label={
                  showPwd
                    ? 'Hide password'
                    : 'Show password'
                }
                onClick={() =>
                  setShowPwd(!showPwd)
                }
                style={{
                  position: 'absolute',
                  right: '11px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
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
                {showPwd ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* SIGN IN */}

          <button
            id={`${role}-login-submit`}
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{
              width: '100%',
              height: '46px',
              marginTop: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {loading ? (
              <span
                className="spinner"
                style={{
                  width: 16,
                  height: 16,
                }}
              />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* OTHER LOGIN PORTALS */}

        {otherLinks &&
          otherLinks.length > 0 && (
            <div
              className="auth-switch"
              style={{
                width: '100%',
                marginTop: '22px',
                padding: 0,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: '0 0 9px 0',
                  padding: 0,
                  textAlign: 'center',
                }}
              >
                Other login portals:
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '22px',
                }}
              >
                {otherLinks.map((l) => (
                  <Link
                    key={l.href}
                    to={l.href}
                    style={{
                      color:
                        'var(--color-primary)',
                      fontSize:
                        'var(--text-sm)',
                      textDecoration: 'none',
                      margin: 0,
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STUDENT REGISTRATION FORM
// ─────────────────────────────────────────────────────────────

const StudentRegistrationForm = ({
  prefillEmail,
  onSuccess,
  onBack,
}) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] =
    useState(null);

  const [form, setForm] = useState({
    name: '',
    email: prefillEmail || '',
    password: '',
    registrationNumber: '',
    mobileNumber: '',
    class: '',
    section: '',
    academicYear: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { setAuth } = useAuth();

  useEffect(() => {
    adminService
      .getClasses()
      .then((res) => {
        setClasses(
          res.data.data.classes || []
        );
      })
      .catch(() => { });
  }, []);

  const departments = [
    ...new Set(
      classes.map(
        (c) => c.department
      )
    ),
  ].sort();

  const sectionsForDept =
    selectedClass?.department
      ? classes.filter(
        (c) =>
          c.department ===
          selectedClass.department
      )
      : [];

  // Year of Study is now the fixed I/II/III/IV list (YEAR_OPTIONS) rather than
  // derived from which years happen to have an existing class for this Dept+Section.

  const handleChange =
    (field) => (e) => {
      const val = e.target.value;

      setForm((p) => ({
        ...p,
        [field]: val,
      }));

      if (errors[field]) {
        setErrors((p) => ({
          ...p,
          [field]: '',
        }));
      }

      if (field === 'class') {
        setSelectedClass((prev) => ({
          ...prev,
          department: val,
          section: '',
          academicYear: '',
        }));

        setForm((p) => ({
          ...p,
          class: val,
          section: '',
          academicYear: '',
          regNoFrom: '',
          regNoTo: '',
        }));
      }

      if (field === 'section') {
        setSelectedClass((prev) => ({
          ...prev,
          section: val,
          academicYear: '',
        }));

        setForm((p) => ({
          ...p,
          section: val,
          academicYear: '',
        }));
      }

      if (field === 'academicYear') {
        setSelectedClass((prev) => ({
          ...prev,
          academicYear: val,
        }));
      }
    };

  const validate = () => {
    const e = {};

    if (!form.name.trim()) {
      e.name = 'Name is required.';
    }

    if (!form.email.trim()) {
      e.email = 'Email is required.';
    }

    if (
      !form.password ||
      form.password.length < 6
    ) {
      e.password =
        'Password must be at least 6 characters.';
    }

    if (
      !form.registrationNumber.trim()
    ) {
      e.registrationNumber =
        'Registration number is required.';
    }

    if (!form.mobileNumber.trim()) {
      e.mobileNumber =
        'Mobile number is required.';
    } else if (
      !/^[6-9]\d{9}$/.test(
        form.mobileNumber
      )
    ) {
      e.mobileNumber =
        'Enter a valid 10-digit mobile number.';
    }

    if (
      form.academicYear &&
      !YEAR_OPTIONS.includes(form.academicYear)
    ) {
      e.academicYear =
        'Year of Study must be I, II, III, or IV.';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    setErrors(errs);

    if (
      Object.keys(errs).length > 0
    ) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res =
        await authService.studentRegister(
          form
        );

      const {
        token,
        user,
      } = res.data.data;

      setAuth(user, token);

      onSuccess();
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
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
          maxWidth: '480px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          padding: '38px 36px 32px',
        }}
      >

        {/* BRAND */}

        <Brand />

        {/* ROLE */}

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '26px',
            marginBottom: '18px',
          }}
        >
          <span
            className="auth-role-tag"
            style={{ margin: 0 }}
          >
            Student
          </span>
        </div>

        {/* TITLE */}

        <h1
          className="auth-title"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '0 0 6px 0',
            padding: 0,
          }}
        >
          Create Your Account
        </h1>

        {/* SUBTITLE */}

        <p
          className="auth-subtitle"
          style={{
            width: '100%',
            textAlign: 'center',
            margin: '0 0 25px 0',
            padding: 0,
          }}
        >
          Complete your profile to get started
        </p>

        <ErrorMessage message={apiError} />

        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            width: '100%',
          }}
        >

          {/* NAME */}

          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '17px',
            }}
          >
            <label
              className="form-label"
              style={{
                display: 'block',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              Full Name{' '}
              <span className="form-required">
                *
              </span>
            </label>

            <input
              type="text"
              className={`form-input${errors.name
                ? ' error'
                : ''
                }`}
              placeholder="e.g., Arun Sharma"
              value={form.name}
              onChange={handleChange(
                'name'
              )}
              style={{
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            {errors.name && (
              <span className="form-error">
                {errors.name}
              </span>
            )}
          </div>

          {/* EMAIL */}

          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '17px',
            }}
          >
            <label
              className="form-label"
              style={{
                display: 'block',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              College Email{' '}
              <span className="form-required">
                *
              </span>
            </label>

            <input
              type="email"
              className={`form-input${errors.email
                ? ' error'
                : ''
                }`}
              value={form.email}
              onChange={handleChange(
                'email'
              )}
              style={{
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            {errors.email && (
              <span className="form-error">
                {errors.email}
              </span>
            )}
          </div>

          {/* PASSWORD */}

          <div
            className="form-group"
            style={{
              width: '100%',
              marginBottom: '17px',
            }}
          >
            <label
              className="form-label"
              style={{
                display: 'block',
                textAlign: 'left',
                marginBottom: '7px',
              }}
            >
              Password{' '}
              <span className="form-required">
                *
              </span>
            </label>

            <div
              style={{
                position: 'relative',
                width: '100%',
              }}
            >
              <input
                type={
                  showPwd
                    ? 'text'
                    : 'password'
                }
                className={`form-input${errors.password
                  ? ' error'
                  : ''
                  }`}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange(
                  'password'
                )}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingRight: '44px',
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPwd(
                    !showPwd
                  )
                }
                style={{
                  position: 'absolute',
                  right: '11px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  background:
                    'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color:
                    'var(--color-muted)',
                }}
              >
                {showPwd ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {errors.password && (
              <span className="form-error">
                {errors.password}
              </span>
            )}
          </div>

          {/* REGISTRATION + MOBILE */}

          <div
            className="grid-2"
            style={{
              width: '100%',
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  textAlign: 'left',
                }}
              >
                Registration Number{' '}
                <span className="form-required">
                  *
                </span>
              </label>

              <input
                type="text"
                className={`form-input${errors.registrationNumber
                  ? ' error'
                  : ''
                  }`}
                placeholder="e.g., CSE001"
                value={
                  form.registrationNumber
                }
                onChange={handleChange(
                  'registrationNumber'
                )}
              />

              {errors.registrationNumber && (
                <span className="form-error">
                  {
                    errors.registrationNumber
                  }
                </span>
              )}
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  textAlign: 'left',
                }}
              >
                Mobile Number{' '}
                <span className="form-required">
                  *
                </span>
              </label>

              <input
                type="tel"
                className={`form-input${errors.mobileNumber
                  ? ' error'
                  : ''
                  }`}
                placeholder="10-digit number"
                value={
                  form.mobileNumber
                }
                onChange={handleChange(
                  'mobileNumber'
                )}
                maxLength={10}
              />

              {errors.mobileNumber && (
                <span className="form-error">
                  {errors.mobileNumber}
                </span>
              )}
            </div>
          </div>

          {/* CLASS + SECTION */}

          <div
            className="grid-2"
            style={{
              width: '100%',
            }}
          >
            <div className="form-group">
              <label
                className="form-label"
                style={{
                  textAlign: 'left',
                }}
              >
                Class / Department
              </label>

              <select
                className="form-select"
                value={form.class}
                onChange={handleChange(
                  'class'
                )}
              >
                <option value="">
                  Select class...
                </option>

                {departments.map(
                  (d) => (
                    <option
                      key={d}
                      value={d}
                    >
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{
                  textAlign: 'left',
                }}
              >
                Section
              </label>

              <select
                className="form-select"
                value={form.section}
                onChange={handleChange(
                  'section'
                )}
                disabled={
                  !form.class
                }
              >
                <option value="">
                  Select section...
                </option>

                {sectionsForDept.map(
                  (c) => (
                    <option
                      key={c._id}
                      value={c.section}
                    >
                      {c.section}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* ACADEMIC YEAR */}

          <div className="form-group">
            <label
              className="form-label"
              style={{
                textAlign: 'left',
              }}
            >
              Year of Study
            </label>

            <select
              className={`form-select${errors.academicYear
                ? ' error'
                : ''
                }`}
              value={
                form.academicYear
              }
              onChange={handleChange(
                'academicYear'
              )}
              disabled={
                !form.section
              }
            >
              <option value="">
                Select year of study...
              </option>

              {YEAR_OPTIONS.map(
                (y) => (
                  <option
                    key={y}
                    value={y}
                  >
                    {y} Year
                  </option>
                )
              )}
            </select>

            {errors.academicYear && (
              <span className="form-error">
                {errors.academicYear}
              </span>
            )}
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              marginTop: '8px',
            }}
          >
            <button
              id="student-register-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <span
                  className="spinner"
                  style={{
                    width: 16,
                    height: 16,
                  }}
                />
              ) : (
                'Create Account →'
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={onBack}
              disabled={loading}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LOGIN PAGES
// ─────────────────────────────────────────────────────────────

export const StudentLogin = () => (
  <LoginPage
    role="student"
    roleLabel="Student"
    otherLinks={[
      {
        href: '/faculty/login',
        label: 'Faculty',
      },
      {
        href: '/admin/login',
        label: 'Admin',
      },
    ]}
  />
);

export const FacultyLogin = () => (
  <LoginPage
    role="faculty"
    roleLabel="Faculty"
    otherLinks={[
      {
        href: '/student/login',
        label: 'Student',
      },
      {
        href: '/admin/login',
        label: 'Admin',
      },
    ]}
  />
);

export const AdminLogin = () => (
  <LoginPage
    role="admin"
    roleLabel="Administrator"
    otherLinks={[
      {
        href: '/student/login',
        label: 'Student',
      },
      {
        href: '/faculty/login',
        label: 'Faculty',
      },
    ]}
  />
);