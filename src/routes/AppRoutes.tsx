import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { ParentLayout } from '../components/layout/ParentLayout';
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public Pages
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';

// Parent Pages
import { ParentDashboard } from '../features/parent/ParentDashboard';
import { ChildProfileView } from '../features/parent/ChildProfileView';
import { AcademicProgressView } from '../features/parent/AcademicProgressView';
import { QuranHifzView } from '../features/parent/QuranHifzView';
import { AttendanceCalendarView } from '../features/parent/AttendanceCalendarView';
import { AkhlaqView } from '../features/parent/AkhlaqView';
import { AchievementsView } from '../features/parent/AchievementsView';
import { NotificationCenterView } from '../features/parent/NotificationCenterView';
import { ParentProfileView } from '../features/parent/ParentProfileView';

// Teacher Pages
import { TeacherDashboard } from '../features/teacher/TeacherDashboard';
import { StudentRosterView } from '../features/teacher/StudentRosterView';
import { AttendanceBatchMarker } from '../features/teacher/AttendanceBatchMarker';
import { AcademicAssessmentsTeacherView } from '../features/teacher/AcademicAssessmentsTeacherView';
import { QuranHifzTeacherView } from '../features/teacher/QuranHifzTeacherView';
import { AkhlaqRemarksTeacherView } from '../features/teacher/AkhlaqRemarksTeacherView';

// Admin Pages
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { StudentManagerView } from '../features/admin/StudentManagerView';
import { TeacherManagerView } from '../features/admin/TeacherManagerView';
import { ParentManagerView } from '../features/admin/ParentManagerView';
import { ClassManagerView } from '../features/admin/ClassManagerView';
import { ReportsCenterView } from '../features/admin/ReportsCenterView';

import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
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
        <Route path="parents" element={<ParentManagerView />} />
        <Route path="classes" element={<ClassManagerView />} />
        <Route path="reports" element={<ReportsCenterView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
