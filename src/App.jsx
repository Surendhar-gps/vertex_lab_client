import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import { StudentLogin, FacultyLogin, AdminLogin } from './pages/auth/LoginPages';
import ProfileSetup from './pages/auth/ProfileSetup';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import LabsList from './pages/student/LabsList';
import TopicView from './pages/student/TopicView';
import ExperimentView from './pages/student/ExperimentView';
import SectionView from './pages/student/SectionView';
import ProblemView from './pages/student/ProblemView';
import StudentProgress from './pages/student/StudentProgress';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyLabsList from './pages/faculty/FacultyLabsList';
import CreateLab from './pages/faculty/CreateLab';
import EditLab from './pages/faculty/EditLab';
import FacultyLabDetail from './pages/faculty/FacultyLabDetail';
import FacultyExperimentDetail from './pages/faculty/FacultyExperimentDetail';
import FacultyStudentProgress from './pages/faculty/FacultyStudentProgress';
import FacultyStudentDetail from './pages/faculty/FacultyStudentDetail';
import FacultyReviews from './pages/faculty/FacultyReviews';
import FacultyReviewDetail from './pages/faculty/FacultyReviewDetail';
import ReviewScreen from './pages/faculty/ReviewScreen';
import ManualMarkEntry from './pages/faculty/ManualMarkEntry';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import { ManageFaculty, ManageStudents } from './pages/admin/ManageUsers';
import ManageClasses from './pages/admin/ManageClasses';

// Common Pages
import Profile from './pages/common/Profile';

// 404
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <LoadingProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/student/login" replace />} />

            {/* ─── Auth Routes (public) ────────────────────────────────────── */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/faculty/login" element={<FacultyLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ─── Student Profile Setup (legacy for admin-pre-created accounts) */}
            <Route
              path="/student/profile-setup"
              element={
                <ProtectedRoute roles={['student']}>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />

            {/* ─── Student Routes ──────────────────────────────────────────── */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/labs"
              element={
                <ProtectedRoute roles={['student']}>
                  <LabsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/labs/:labId"
              element={
                <ProtectedRoute roles={['student']}>
                  <TopicView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/labs/:labId/experiments/:experimentId"
              element={
                <ProtectedRoute roles={['student']}>
                  <ExperimentView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/labs/:labId/experiments/:experimentId/sections/:sectionId"
              element={
                <ProtectedRoute roles={['student']}>
                  <SectionView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/problems/:problemId"
              element={
                <ProtectedRoute roles={['student']}>
                  <ProblemView />
                </ProtectedRoute>
              }
            />
            {/* Progress page kept accessible via direct URL, but no longer in sidebar */}
            <Route
              path="/student/progress"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute roles={['student']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ─── Faculty Routes ──────────────────────────────────────────── */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/labs"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyLabsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/labs/create"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <CreateLab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/labs/:labId/edit"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <EditLab />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/labs/:labId"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyLabDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/experiments/:experimentId"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyExperimentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/student-progress"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyStudentProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/student-progress/:studentId"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyStudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/reviews"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyReviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/reviews/:studentId"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <FacultyReviewDetail />
                </ProtectedRoute>
              }
            />
            {/* Legacy ReviewScreen used by FacultyReviewDetail for individual review */}
            <Route
              path="/faculty/review/:submissionId"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <ReviewScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/manual-marks"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <ManualMarkEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/profile"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ─── Admin Routes ────────────────────────────────────────────── */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculty"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageClasses />
                </ProtectedRoute>
              }
            />

            {/* ─── 404 ─────────────────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LoadingProvider>
  );
};

export default App;