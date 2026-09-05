import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { validateDxfFile, CAD_ACCEPT } from '../utils/fileValidation';

const FileUpload = ({ onFileSelect, disabled = false, currentFile }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');

  const handleFile = (file) => {
    if (!file) return;
    const { valid, error } = validateDxfFile(file);
    if (!valid) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError('');
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {selectedFile ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--border-radius)',
            background: 'var(--color-success-muted)',
          }}
        >
          <CheckCircle size={16} color="var(--color-success)" />
          <FileText size={14} color="var(--color-success)" />
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={clearFile}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`file-upload-zone${dragOver ? ' drag-over' : ''}${disabled ? ' disabled' : ''}`}
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
        >
          <Upload size={24} className="file-upload-icon" />
          <p className="file-upload-text">
            <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Click to upload</span> or drag &amp; drop
          </p>
          <p className="file-upload-hint">DXF/DWG files only — max 20 MB</p>
          {currentFile && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 'var(--space-2)' }}>
              Current: {currentFile}
            </p>
          )}
        </div>
      )}

      {validationError && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--space-1)' }}>
          {validationError}
        </p>
      )}

      {/* Use CAD_ACCEPT to list multiple MIME types, preventing browsers from
          blocking the file picker due to unknown MIME type for .dxf/.dwg */}
      <input
        ref={inputRef}
        type="file"
        accept={CAD_ACCEPT}
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
      />
    </div>
  );
};

export default FileUpload;
