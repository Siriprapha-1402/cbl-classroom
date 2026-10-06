import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import StudentLayout from './components/Layout/StudentLayout';
import TeacherLayout from './components/Layout/TeacherLayout';
import Login from './pages/auth/Login';

// Student Pages
import StudentHome from './pages/student/Home';
import ChallengeView from './pages/student/ChallengeView';
import GroupSummary from './pages/student/GroupSummary';
import MyWork from './pages/student/MyWork';
import StudentGroups from './pages/student/Groups';
import StudentQuizzes from './pages/student/Quizzes';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import ChallengeList from './pages/teacher/ChallengeList';
import CreateChallenge from './pages/teacher/CreateChallenge';
import Submissions from './pages/teacher/Submissions';
import GradeFeedback from './pages/teacher/GradeFeedback';
import Students from './pages/teacher/Students';
import StudentDetail from './pages/teacher/StudentDetail';
import TeacherGroups from './pages/teacher/Groups';
import TeacherAssessments from './pages/teacher/Assessments';

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/home'} replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route path="home" element={<StudentHome />} />
          <Route path="groups" element={<StudentGroups />} />
          <Route path="challenges/:id" element={<ChallengeView />} />
          <Route path="challenges/:id/summary" element={<GroupSummary />} />
          <Route path="my-work" element={<MyWork />} />
          <Route path="quizzes" element={<StudentQuizzes />} />
          <Route path="*" element={<Navigate to="home" />} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="challenges" element={<ChallengeList />} />
          <Route path="challenges/create" element={<CreateChallenge />} />
          <Route path="challenges/edit/:id" element={<CreateChallenge />} />
          <Route path="challenges/:id/edit" element={<CreateChallenge />} />
          <Route path="groups" element={<TeacherGroups />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="grading/:id" element={<GradeFeedback />} />
          <Route path="assessments" element={<TeacherAssessments />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="*" element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
