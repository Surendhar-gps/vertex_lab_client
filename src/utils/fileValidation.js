/**
 * Shared DXF file validation utility.
 * Used by both faculty answer-key upload and student submission upload.
 *
 * Some browsers map .dxf to an unknown or generic MIME type, which can
 * cause browser-level <input accept> to block the file picker. We work
 * around this by accepting any file through the input and validating
 * purely by extension here, while also keeping a permissive accept attr.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error: string }}
 */
export const validateDxfFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected.' };

  console.log('[Frontend Upload] Validating file:', {
    name: file.name,
    type: file.type,
    size: file.size
  });

  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();

  if (ext !== 'dxf' && ext !== 'dwg') {
    return { valid: false, error: 'Only .dxf or .dwg files are allowed.' };
  }

  const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
  if (file.size > MAX_BYTES) {
    return { valid: false, error: 'File size must not exceed 20 MB.' };
  }

  return { valid: true, error: '' };
};

/**
 * Accept attribute value for file inputs that accept DXF/DWG.
 * We list multiple MIME types because browsers vary in how they classify CAD files.
 * The extensions ".dxf" and ".dwg" are also included as a fallback.
 */
export const CAD_ACCEPT = '.dxf,.dwg,application/dxf,image/vnd.dxf,application/octet-stream,image/vnd.dwg,application/acad';
