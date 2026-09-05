import { useState, useEffect } from 'react';
import { Camera, Save } from 'lucide-react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner, ErrorMessage, Avatar, SuccessMessage } from '../../components/UI';
import api from '../../services/api';
import { labService } from '../../services/index';
import ProgressCircle from '../../components/ProgressCircle';

const Profile = () => {
  const { user, setAuth, token } = useAuth();
  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [file, setFile] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        mobileNumber: user.mobileNumber || '',
      });
      if (user.role === 'student') {
        labService.getLabs().then(res => setLabs(res.data.data.labs || [])).catch(console.error);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobileNumber.trim()) {
      setError('Name and mobile number are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formPayload = new FormData();
      formPayload.append('name', form.name);
      formPayload.append('mobileNumber', form.mobileNumber);
      if (file) {
        formPayload.append('avatar', file);
      }

      const res = await api.put('/auth/update-profile', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data.data.user;
      
      // Update local context
      setAuth(updatedUser, token);
      setSuccess('Profile updated successfully.');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <Layout title="My Profile">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
            <div style={{ position: 'relative' }}>
              <Avatar 
                user={file ? { ...user, avatarUrl: URL.createObjectURL(file) } : user} 
                size={80} 
              />
              <label 
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--color-bg)'
                }}
              >
                <Camera size={14} />
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{user.name}</div>
              <div style={{ color: 'var(--color-muted)' }}>{user.role === 'student' ? 'Student Account' : 'Faculty Account'}</div>
            </div>
          </div>

          <ErrorMessage message={error} />
          {success && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-success)', color: 'white', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                name="mobileNumber"
                className="form-input"
                value={form.mobileNumber}
                onChange={handleChange}
              />
            </div>

            {/* Read Only Fields */}
            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input"
                value={user.email}
                disabled
              />
            </div>

            {user.role === 'student' && (
              <>
                <div className="form-group">
                  <label className="form-label">Registration Number (Read-only)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user.registrationNumber || ''}
                    disabled
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Class (Read-only)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user.class || ''}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section (Read-only)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user.section || ''}
                      disabled
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {user.role === 'student' && labs.length > 0 && (
          <div className="card" style={{ marginTop: 'var(--space-6)' }}>
            <div className="card-header">
              <div className="card-title">My Lab Progress</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
              {labs.map(lab => (
                <div key={lab._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    {lab.title}
                  </div>
                  <ProgressCircle percent={lab.progressPercentage || 0} size={100} strokeWidth={8} />
                  <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {lab.completedExperiments || 0} of {lab.totalExperiments || 0} weeks completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
