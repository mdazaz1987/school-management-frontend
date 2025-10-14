import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { ComingSoon } from './pages/ComingSoon';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { StudentList } from './pages/StudentList';
import { StudentForm } from './pages/StudentForm';
import { ClassList } from './pages/ClassList';
import { ClassForm } from './pages/ClassForm';
import { ClassDetail } from './pages/ClassDetail';
import { StudentDetail } from './pages/StudentDetail';
import { DebugAuth } from './pages/DebugAuth';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { LangProvider } from './contexts/LangContext';
import { SubjectList } from './pages/SubjectList';
import { SubjectForm } from './pages/SubjectForm';
import { ExamList } from './pages/ExamList';
import { ExamForm } from './pages/ExamForm';
import { FeeList } from './pages/FeeList';
import { FeeForm } from './pages/FeeForm';
import { TimetableList } from './pages/TimetableList';
import { TimetableFormImproved as TimetableForm } from './pages/TimetableFormImproved';
import { TeacherList } from './pages/TeacherList';
import { TeacherForm } from './pages/TeacherForm';
import { TeacherDetail } from './pages/TeacherDetail';
import { Notifications } from './pages/Notifications';
import { CreateNotification } from './pages/CreateNotification';
import { AttendancePage } from './pages/Attendance';
import { StudentAssignments } from './pages/StudentAssignments';
import { StudentExams } from './pages/StudentExams';
import { StudentQuizzes } from './pages/StudentQuizzes';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentTimetable } from './pages/StudentTimetable';
import { StudentFeePayment } from './pages/StudentFeePayment';
import { StudentNotifications } from './pages/StudentNotifications';
import { ParentChildren } from './pages/ParentChildren';
import { ParentAttendance } from './pages/ParentAttendance';
import { ParentPerformance } from './pages/ParentPerformance';
import { ParentFees } from './pages/ParentFees';
import { ParentNotifications } from './pages/ParentNotifications';
import { TeacherMyClasses } from './pages/TeacherMyClasses';
import { TeacherAssignments } from './pages/TeacherAssignments';
import { TeacherStudyMaterials } from './pages/TeacherStudyMaterials';
import { TeacherQuizTest } from './pages/TeacherQuizTest';
import { TeacherAttendance } from './pages/TeacherAttendance';
import { TeacherGrading } from './pages/TeacherGrading';
import { TeacherTimetable } from './pages/TeacherTimetable';
import { ContactSupport } from './pages/ContactSupport';
import { TeacherStudents } from './pages/TeacherStudents';
import { AdminFinanceTools } from './pages/AdminFinanceTools';
import { AdminNotificationTools } from './pages/AdminNotificationTools';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Dashboard Router Component
const DashboardRouter: React.FC = () => {
  const { hasRole, user } = useAuth();

  console.log('DashboardRouter - Current user:', user);
  console.log('DashboardRouter - User roles:', user?.roles);

  // Route to appropriate dashboard based on user role
  if (hasRole('ADMIN')) {
    console.log('Rendering Admin Dashboard');
    return <AdminDashboard />;
  } else if (hasRole('TEACHER')) {
    console.log('Rendering Teacher Dashboard');
    return <TeacherDashboard />;
  } else if (hasRole('STUDENT')) {
    console.log('Rendering Student Dashboard');
    return <StudentDashboard />;
  } else if (hasRole('PARENT')) {
    console.log('Rendering Parent Dashboard');
    return <ParentDashboard />;
  }

  console.error('No matching role found for user:', user);
  return (
    <Container className="text-center mt-5">
      <h1>Unauthorized</h1>
      <p>You don't have permission to access this page.</p>
      <p className="text-muted">User roles: {JSON.stringify(user?.roles)}</p>
    </Container>
  );
};

function App() {
  return (
    <LangProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          
          {/* Profile and Settings - Available for all users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-support"
            element={
              <ProtectedRoute>
                <ContactSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/create"
            element={
              <ProtectedRoute>
                <CreateNotification />
              </ProtectedRoute>
            }
          />
          
          {/* Student Management Routes */}
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/new"
            element={
              <ProtectedRoute>
                <StudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id/edit"
            element={
              <ProtectedRoute>
                <StudentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Teacher Management Routes */}
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <TeacherList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers/new"
            element={
              <ProtectedRoute>
                <TeacherForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers/:id/edit"
            element={
              <ProtectedRoute>
                <TeacherForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers/:id"
            element={
              <ProtectedRoute>
                <TeacherDetail />
              </ProtectedRoute>
            }
          />
          {/* Class Management Routes */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <ClassList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/new"
            element={
              <ProtectedRoute>
                <ClassForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/edit/:id"
            element={
              <ProtectedRoute>
                <ClassForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/:id"
            element={
              <ProtectedRoute>
                <ClassDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <SubjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/new"
            element={
              <ProtectedRoute>
                <SubjectForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:id/edit"
            element={
              <ProtectedRoute>
                <SubjectForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parents"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <ProtectedRoute>
                <ExamList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/new"
            element={
              <ProtectedRoute>
                <ExamForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/:id/edit"
            element={
              <ProtectedRoute>
                <ExamForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees"
            element={
              <ProtectedRoute>
                <FeeList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees/new"
            element={
              <ProtectedRoute>
                <FeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees/:id/edit"
            element={
              <ProtectedRoute>
                <FeeForm />
              </ProtectedRoute>
            }
          />

          {/* Admin Tools */}
          <Route
            path="/admin/tools/finance"
            element={
              <ProtectedRoute>
                <AdminFinanceTools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tools/notifications"
            element={
              <ProtectedRoute>
                <AdminNotificationTools />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <TimetableList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable/new"
            element={
              <ProtectedRoute>
                <TimetableForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable/:id/edit"
            element={
              <ProtectedRoute>
                <TimetableForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-classes"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grading"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-children"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          
          {/* Student Portal Routes */}
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute>
                <StudentQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exams"
            element={
              <ProtectedRoute>
                <StudentExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fees"
            element={
              <ProtectedRoute>
                <StudentFeePayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute>
                <StudentNotifications />
              </ProtectedRoute>
            }
          />
          
          {/* Parent Portal Routes */}
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute>
                <ParentChildren />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <ProtectedRoute>
                <ParentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/performance"
            element={
              <ProtectedRoute>
                <ParentPerformance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/fees"
            element={
              <ProtectedRoute>
                <ParentFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/notifications"
            element={
              <ProtectedRoute>
                <ParentNotifications />
              </ProtectedRoute>
            }
          />
          
          {/* Teacher Portal Routes */}
          <Route
            path="/teacher/my-classes"
            element={
              <ProtectedRoute>
                <TeacherMyClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute>
                <TeacherAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/study-materials"
            element={
              <ProtectedRoute>
                <TeacherStudyMaterials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quiz-test"
            element={
              <ProtectedRoute>
                <TeacherQuizTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute>
                <TeacherAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grading"
            element={
              <ProtectedRoute>
                <TeacherGrading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/timetable"
            element={
              <ProtectedRoute>
                <TeacherTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute>
                <TeacherStudents />
              </ProtectedRoute>
            }
          />
          
          {/* Debug page */}
          <Route
            path="/debug-auth"
            element={
              <ProtectedRoute>
                <DebugAuth />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Catch-all for any other routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
        </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </LangProvider>
  );
}

export default App;
