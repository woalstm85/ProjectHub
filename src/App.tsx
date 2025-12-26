import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme } from 'antd';
import koKR from 'antd/locale/ko_KR';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Timeline from './pages/Timeline';
import Calendar from './pages/Calendar';
import ActivityLog from './pages/ActivityLog';
import Members from './pages/Members';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Communication from './pages/Communication';
import Issues from './pages/Issues';
import PrivateRoute from './components/PrivateRoute';
import { SettingsProvider, useSettings } from './store/settingsStore';

// 테마가 적용된 앱 컴포넌트
const ThemedApp: React.FC = () => {
  const { settings, effectiveTheme } = useSettings();

  return (
    <ConfigProvider
      locale={koKR}
      componentSize={settings.compactMode ? 'small' : 'middle'}
      theme={{
        token: {
          colorPrimary: settings.primaryColor,
          borderRadius: 8,
          fontSize: settings.fontSize,
        },
        algorithm: effectiveTheme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* 로그인 페이지 */}
          <Route path="/login" element={<Login />} />

          {/* 인증이 필요한 페이지들 */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="members" element={<Members />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="communication" element={<Communication />} />
            <Route path="issues" element={<Issues />} />
          </Route>

          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  );
};

export default App;
