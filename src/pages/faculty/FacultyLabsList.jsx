import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner } from '../../components/UI';
import { labService } from '../../services/index';

const FacultyLabsList = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    labService.getLabs()
      .then((res) => setLabs(res.data.data.labs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Labs"><LoadingSpinner /></Layout>;

  return (
    <Layout title="My Labs">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Manage Labs</h1>
            <p className="page-subtitle">Create and manage your courses and labs</p>
          </div>
          <button className="btn btn-primary btn-capsule" onClick={() => navigate('/faculty/labs/create')}>
            <Plus size={14} /> Create Lab
          </button>
        </div>
      </div>

      {labs.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
            No labs created yet. Click "Create Lab" to get started.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Topic</th>
                <th>Class</th>
                <th>Reg Range</th>
                <th>Experiments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr key={lab._id}>
                  <td style={{ fontWeight: 500 }}>{lab.title}</td>
                  <td>{lab.topic}</td>
                  <td>{lab.class} — {lab.section}</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    {lab.regNoFrom && lab.regNoTo ? `${lab.regNoFrom} → ${lab.regNoTo}` : 'All students'}
                  </td>
                  <td>{lab.experimentCount || 0}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/faculty/labs/${lab._id}`)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default FacultyLabsList;
