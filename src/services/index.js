import api from './api';

// ─────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────

export const authService = {
  // Login
  login: (email, password, role) =>
    api.post('/auth/login', {
      email,
      password,
      role,
    }),

  // Normal registration
  register: (data) =>
    api.post('/auth/register', data),

  // Student registration
  studentRegister: (data) =>
    api.post('/auth/student-register', data),

  // Get logged-in user
  getMe: () =>
    api.get('/auth/me'),

  // Student first-time profile setup
  profileSetup: (data) =>
    api.put('/auth/profile-setup', data),

  // Update profile
  updateProfile: (data) =>
    api.put('/auth/update-profile', data),

  // ─────────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────────

  // Send password reset email
  forgotPassword: (email, role) =>
    api.post('/auth/forgot-password', {
      email,
      role,
    }),

  // Reset password using token from email
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, {
      password,
    }),
};


// ─────────────────────────────────────────────────────────────
// LAB SERVICE
// ─────────────────────────────────────────────────────────────

export const labService = {
  getLabs: () =>
    api.get('/labs'),

  getLabById: (id) =>
    api.get(`/labs/${id}`),

  createLab: (data) =>
    api.post('/labs', data),

  updateLab: (id, data) =>
    api.put(`/labs/${id}`, data),

  deleteLab: (id) =>
    api.delete(`/labs/${id}`),

  getExperiments: (labId) =>
    api.get(`/labs/${labId}/experiments`),

  createExperiment: (labId, data) =>
    api.post(`/labs/${labId}/experiments`, data),

  // Publish/unpublish a whole lab — students should only see labs where isPublished === true.
  publishLab: (labId, data) =>
    api.put(`/labs/${labId}/publish`, data),
};


// ─────────────────────────────────────────────────────────────
// EXPERIMENT SERVICE
// ─────────────────────────────────────────────────────────────

export const experimentService = {
  getById: (id) =>
    api.get(`/experiments/${id}`),

  update: (id, data) =>
    api.put(`/experiments/${id}`, data),

  delete: (id) =>
    api.delete(`/experiments/${id}`),

  submit: (experimentId) =>
    api.post(`/experiments/${experimentId}/submit`),

  submitSection: (experimentId, section, data = {}) =>
    api.post(
      `/experiments/${experimentId}/submit/${section}`,
      data
    ),

  getProgress: (experimentId, studentId) =>
    api.get(`/experiments/${experimentId}/progress`, {
      params: studentId
        ? { studentId }
        : {},
    }),

  // Publish/unpublish a single weekly experiment — students should only see weeks where
  // isPublished === true, even if the parent lab itself is already published.
  publish: (experimentId, data) =>
    api.put(`/experiments/${experimentId}/publish`, data),
};


// ─────────────────────────────────────────────────────────────
// PROBLEM SERVICE
// ─────────────────────────────────────────────────────────────

export const problemService = {
  create: (formData) =>
    api.post('/problems', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getById: (id) =>
    api.get(`/problems/${id}`),

  update: (id, formData) =>
    api.put(`/problems/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  delete: (id) =>
    api.delete(`/problems/${id}`),

  parseQuestions: (formData) =>
    api.post('/problems/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  bulkQuestions: (data) =>
    api.post('/problems/bulk', data),
};


// ─────────────────────────────────────────────────────────────
// SUBMISSION SERVICE
// ─────────────────────────────────────────────────────────────

export const submissionService = {
  upload: (formData) =>
    api.post('/submissions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  submitMcq: (data) =>
    api.post('/submissions/mcq', data),

  getStudentSubmissions: (params) =>
    api.get('/submissions/student', {
      params,
    }),

  getById: (id) =>
    api.get(`/submissions/${id}`),

  review: (id, data) =>
    api.put(`/submissions/${id}/review`, data),

  getFacultyProgress: (params) =>
    api.get('/submissions/faculty/progress', {
      params,
    }),

  getStudentsForExperiment: (experimentId) =>
    api.get(
      '/submissions/faculty/students-for-experiment',
      {
        params: {
          experimentId,
        },
      }
    ),

  manualReviewBulk: (data) =>
    api.put('/submissions/manual-review', data),
};


// ─────────────────────────────────────────────────────────────
// FACULTY SERVICE
// ─────────────────────────────────────────────────────────────

export const facultyService = {
  getStudents: (params) =>
    api.get('/faculty/students', {
      params,
    }),

  getStudentFilters: () =>
    api.get('/faculty/student-filters'),

  getStudentProgress: (studentId) =>
    api.get(`/faculty/students/${studentId}/progress`),

  getDashboardStats: () =>
    api.get('/faculty/dashboard-stats'),
};


// ─────────────────────────────────────────────────────────────
// ADMIN SERVICE
// ─────────────────────────────────────────────────────────────

export const adminService = {
  getStats: () =>
    api.get('/admin/stats'),

  getUsers: (params) =>
    api.get('/admin/users', {
      params,
    }),

  createUser: (data) =>
    api.post('/admin/users', data),

  createStudent: (data) =>
    api.post('/admin/students', data),

  updateUser: (id, data) =>
    api.put(`/admin/users/${id}`, data),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  getClasses: () =>
    api.get('/admin/classes'),

  createClass: (data) =>
    api.post('/admin/classes', data),

  deleteClass: (id) =>
    api.delete(`/admin/classes/${id}`),

  addStudentToClass: (id, data) =>
    api.post(`/admin/classes/${id}/students`, data),

  getDepartments: () =>
    api.get('/admin/departments'),

  createDepartment: (data) =>
    api.post('/admin/departments', data),

  deleteDepartment: (id) =>
    api.delete(`/admin/departments/${id}`),

  parseCombined: (formData) =>
    api.post('/admin/parse-combined', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  bulkCombined: (data) =>
    api.post('/admin/bulk-combined', data),

  parseFaculty: (formData) =>
    api.post('/admin/parse-faculty', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  bulkFaculty: (data) =>
    api.post('/admin/bulk-faculty', data),

  parseStudents: (formData) =>
    api.post('/admin/parse-students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  bulkStudents: (data) =>
    api.post('/admin/bulk-students', data),
};