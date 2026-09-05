import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService, adminService } from '../../services/index';
import { ErrorMessage } from '../../components/UI';

const ProfileSetup = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    registrationNumber: '',
    mobileNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.registrationNumber.trim()) e.registrationNumber = 'Registration number is required.';
    if (!form.mobileNumber.trim()) {
      e.mobileNumber = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      e.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await authService.profileSetup(form);
      const updatedUser = res.data.data.user;
      updateUser(updatedUser);
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Profile setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <GraduationCap size={22} color="white" />
          </div>
          <span className="auth-logo-text">CAD Lab Platform</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <UserCircle size={32} color="var(--color-primary)" />
          <div>
            <h1 className="auth-title" style={{ marginBottom: 0 }}>Complete Your Profile</h1>
            <p className="auth-subtitle" style={{ marginBottom: 0, marginTop: 4 }}>
              This information is required before you can access your labs.
            </p>
          </div>
        </div>

        <ErrorMessage message={apiError} />

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label className="form-label">Registration Number <span className="form-required">*</span></label>
            <input
              type="text"
              className={`form-input${errors.registrationNumber ? ' error' : ''}`}
              placeholder="e.g., CSE001"
              value={form.registrationNumber}
              onChange={handleChange('registrationNumber')}
            />
            {errors.registrationNumber && <span className="form-error">{errors.registrationNumber}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number <span className="form-required">*</span></label>
            <input
              type="tel"
              className={`form-input${errors.mobileNumber ? ' error' : ''}`}
              placeholder="10-digit mobile number"
              value={form.mobileNumber}
              onChange={handleChange('mobileNumber')}
              maxLength={10}
            />
            {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
          </div>

          <button
            id="profile-setup-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save & Continue →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
