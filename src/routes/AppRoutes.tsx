import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import {
  PageLoadingFallback,
  FullPageLoadingFallback,
} from '../components/common/LoadingFallback';

// Layouts (kept static for instant shell rendering)
import { ParentLayout } from '../components/layout/ParentLayout';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public Pages (Lazy Loaded)
const LandingPage = lazy(() =>
  import('../features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const ResetPasswordPage = lazy(() =>
  import('../features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);

// Parent Pages (Lazy Loaded)
const ParentDashboard = lazy(() =>
  import('../features/parent/ParentDashboard').then((m) => ({ default: m.ParentDashboard }))
);
const ChildProfileView = lazy(() =>
  import('../features/parent/ChildProfileView').then((m) => ({ default: m.ChildProfileView }))
);
const AcademicProgressView = lazy(() =>
  import('../features/parent/AcademicProgressView').then((m) => ({ default: m.AcademicProgressView }))
);
const QuranHifzView = lazy(() =>
  import('../features/parent/QuranHifzView').then((m) => ({ default: m.QuranHifzView }))
);
const AttendanceCalendarView = lazy(() =>
  import('../features/parent/AttendanceCalendarView').then((m) => ({ default: m.AttendanceCalendarView }))
);
const AkhlaqView = lazy(() =>
  import('../features/parent/AkhlaqView').then((m) => ({ default: m.AkhlaqView ?? m.default }))
);
const AchievementsView = lazy(() =>
  import('../features/parent/AchievementsView').then((m) => ({ default: m.AchievementsView }))
);
const NotificationCenterView = lazy(() =>
  import('../features/parent/NotificationCenterView').then((m) => ({ default: m.NotificationCenterView }))
);
const ParentProfileView = lazy(() =>
  import('../features/parent/ParentProfileView').then((m) => ({ default: m.ParentProfileView }))
);

// Teacher Pages (Lazy Loaded)
const TeacherDashboard = lazy(() =>
  import('../features/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const StudentRosterView = lazy(() =>
  import('../features/teacher/StudentRosterView').then((m) => ({ default: m.StudentRosterView }))
);
const AttendanceBatchMarker = lazy(() =>
  import('../features/teacher/AttendanceBatchMarker').then((m) => ({ default: m.AttendanceBatchMarker }))
);
const AcademicAssessmentsTeacherView = lazy(() =>
  import('../features/teacher/AcademicAssessmentsTeacherView').then((m) => ({
    default: m.AcademicAssessmentsTeacherView,
  }))
);
const QuranHifzTeacherView = lazy(() =>
  import('../features/teacher/QuranHifzTeacherView').then((m) => ({ default: m.QuranHifzTeacherView }))
);
const AkhlaqRemarksTeacherView = lazy(() =>
  import('../features/teacher/AkhlaqRemarksTeacherView').then((m) => ({
    default: m.AkhlaqRemarksTeacherView,
  }))
);
const MyAttendanceView = lazy(() =>
  import('../features/teacher/MyAttendanceView').then((m) => ({ default: m.MyAttendanceView }))
);

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() =>
  import('../features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const StudentManagerView = lazy(() =>
  import('../features/admin/StudentManagerView').then((m) => ({ default: m.StudentManagerView }))
);
const TeacherManagerView = lazy(() =>
  import('../features/admin/TeacherManagerView').then((m) => ({ default: m.TeacherManagerView }))
);
const ParentManagerView = lazy(() =>
  import('../features/admin/ParentManagerView').then((m) => ({ default: m.ParentManagerView }))
);
const ClassManagerView = lazy(() =>
  import('../features/admin/ClassManagerView').then((m) => ({ default: m.ClassManagerView }))
);
const ReportsCenterView = lazy(() =>
  import('../features/admin/ReportsCenterView').then((m) => ({ default: m.ReportsCenterView }))
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<FullPageLoadingFallback />}>
      <Routes>
        {/* Public Landing & Login */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Parent Portal */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/parent/dashboard" replace />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="child-profile" element={<ChildProfileView />} />
          <Route path="progress" element={<AcademicProgressView />} />
          <Route path="quran" element={<QuranHifzView />} />
          <Route path="attendance" element={<AttendanceCalendarView />} />
          <Route path="akhlaq" element={<AkhlaqView />} />
          <Route path="achievements" element={<AchievementsView />} />
          <Route path="notifications" element={<NotificationCenterView />} />
          <Route path="profile" element={<ParentProfileView />} />
        </Route>

        {/* Teacher / Muallim Portal */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['MUALLIM', 'SADHR_MUALLIM']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="students" element={<StudentRosterView />} />
          <Route path="attendance" element={<AttendanceBatchMarker />} />
          <Route path="assessments" element={<AcademicAssessmentsTeacherView />} />
          <Route path="quran" element={<QuranHifzTeacherView />} />
          <Route path="akhlaq-remarks" element={<AkhlaqRemarksTeacherView />} />
          <Route path="my-attendance" element={<MyAttendanceView />} />
        </Route>

        {/* Sadhr Muallim Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['SADHR_MUALLIM']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagerView />} />
          <Route path="teachers" element={<TeacherManagerView />} />
          <Route path="attendance" element={<Navigate to="/admin/teachers?tab=attendance" replace />} />
          <Route path="parents" element={<ParentManagerView />} />
          <Route path="classes" element={<ClassManagerView />} />
          <Route path="reports" element={<ReportsCenterView />} />
          <Route path="result" element={<ReportsCenterView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
