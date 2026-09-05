import { useState } from 'react';
import { Camera, Save } from 'lucide-react';
import Layout from '../../components/Layout';
import { Avatar, LoadingSpinner, ErrorMessage, SuccessMessage } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Profile = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobileNumber: user?.mobileNumber || '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formPayload = new FormData();
      formPayload.append('name', formData.name);
      formPayload.append('mobileNumber', formData.mobileNumber);
      if (file) {
        formPayload.append('avatar', file);
      }

      const res = await api.put('/auth/update-profile', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update auth context state with the new user object and existing token
      login({ user: res.data.data.user, token: localStorage.getItem('token') });
      setSuccess('Profile updated successfully.');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Profile">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Update your personal information and profile picture.</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
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
              <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{user?.email}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                {user?.role === 'student' ? 'Student Account' : 'Faculty Account'}
              </div>
            </div>
          </div>

          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              className="form-input"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter mobile number"
            />
          </div>

          {user?.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={user.registrationNumber || ''}
                  disabled
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', cursor: 'not-allowed' }}
                />
                <div className="form-hint">Contact admin to change this.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Class & Section</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${user.class || ''} - ${user.section || ''}`}
                  disabled
                  style={{ backgroundColor: 'var(--color-bg-tertiary)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
