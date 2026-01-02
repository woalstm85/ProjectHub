import React, { useState, useMemo } from 'react';
import { Layout, Menu, theme, Dropdown, Avatar, Space, Tooltip, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  HistoryOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  NotificationOutlined,
  BugOutlined,
  FileDoneOutlined,
  ReadOutlined,
  CloudServerOutlined,
  BgColorsOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import CommandPalette from '../components/CommandPalette';
import { useAuthStore } from '../store/authStore';
import { useSettings } from '../store/settingsStore';
import NotificationCenter from '../components/NotificationCenter';

const { Header, Sider, Content } = Layout;

// 색상을 HSL로 변환하는 유틸리티
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

// 보조 색상 계산 (색상환에서 조화로운 색상 찾기)
const getAccentHue = (baseHue: number): number => {
  const purpleHue = 270;
  if (baseHue > 240 && baseHue < 300) {
    return 200;
  }
  if (baseHue < 60 || baseHue > 330) {
    return 320;
  }
  return purpleHue;
};

// 테마 색상 기반 사이드바 테마 생성
const getSidebarTheme = (primaryColor: string, isDark: boolean) => {
  const hsl = hexToHsl(primaryColor);
  const baseHue = hsl.h;
  const accentHue = getAccentHue(baseHue);

  if (isDark) {
    return {
      gradientStart: `hsl(${baseHue}, 20%, 13%)`,
      gradientMid: `hsl(${(baseHue + accentHue) / 2}, 18%, 10%)`,
      gradientEnd: `hsl(${accentHue}, 25%, 8%)`,
      hoverBg: `hsla(${baseHue}, 30%, 25%, 0.5)`,
      selectedBg: `hsla(${baseHue}, 40%, 22%, 0.6)`,
      borderColor: `hsla(${(baseHue + accentHue) / 2}, 20%, 25%, 0.5)`,
      accentColor: primaryColor,
      secondaryColor: `hsl(${accentHue}, 50%, 50%)`,
    };
  } else {
    return {
      gradientStart: `hsl(${baseHue}, 35%, 24%)`,
      gradientMid: `hsl(${(baseHue + accentHue) / 2}, 32%, 18%)`,
      gradientEnd: `hsl(${accentHue}, 40%, 14%)`,
      hoverBg: `hsla(${baseHue}, 40%, 35%, 0.4)`,
      selectedBg: `hsla(${baseHue}, 50%, 30%, 0.5)`,
      borderColor: `hsla(${(baseHue + accentHue) / 2}, 30%, 30%, 0.3)`,
      accentColor: primaryColor,
      secondaryColor: `hsl(${accentHue}, 60%, 60%)`,
    };
  }
};

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { settings, effectiveTheme, updateSettings, saveSettings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const isDark = effectiveTheme === 'dark';

  const sidebarTheme = useMemo(() =>
    getSidebarTheme(settings.primaryColor, isDark),
    [settings.primaryColor, isDark]
  );

  const colors = {
    siderBg: `linear-gradient(180deg, ${sidebarTheme.gradientStart} 0%, ${sidebarTheme.gradientMid} 50%, ${sidebarTheme.gradientEnd} 100%)`,
    headerBg: isDark ? '#141414' : '#ffffff',
    contentBg: isDark ? '#000000' : '#f5f7fa',
    cardBg: isDark ? '#141414' : '#ffffff',
    textPrimary: isDark ? '#ffffff' : '#1a202c',
    textSecondary: isDark ? '#a0aec0' : '#718096',
    border: isDark ? '#303030' : '#e2e8f0',
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '대시보드' },
    { key: '/projects', icon: <ProjectOutlined />, label: '프로젝트' },
    { key: '/tasks', icon: <CheckSquareOutlined />, label: '작업관리' },
    { key: '/issues', icon: <BugOutlined />, label: '이슈 트래커' },
    { key: '/timeline', icon: <ScheduleOutlined />, label: '타임라인' },
    { key: '/calendar', icon: <CalendarOutlined />, label: '캘린더' },
    { key: '/activity', icon: <HistoryOutlined />, label: '활동 로그' },
    { key: '/members', icon: <TeamOutlined />, label: '팀원 관리' },
    { key: '/reports', icon: <BarChartOutlined />, label: '보고서' },
    { key: '/communication', icon: <NotificationOutlined />, label: '커뮤니케이션' },
    { key: '/approvals', icon: <FileDoneOutlined />, label: '전자결재' },
    { key: '/wiki', icon: <ReadOutlined />, label: '지식 관리' },
    { key: '/drive', icon: <CloudServerOutlined />, label: '통합 자료실' },
    { key: '/support', icon: <CustomerServiceOutlined />, label: '고객지원' }, // Add Support Menu Item
  ];


  return (
    <Layout style={{ minHeight: '100vh', background: colors.contentBg }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: colors.siderBg,
          boxShadow: `2px 0 12px ${sidebarTheme.accentColor}22`,
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 24px',
            borderBottom: `1px solid ${sidebarTheme.borderColor}`,
            transition: 'all 0.3s',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${sidebarTheme.secondaryColor} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${settings.primaryColor}66`,
            }}
          >
            <ProjectOutlined style={{ fontSize: 20, color: 'white' }} />
          </div>
          {!collapsed && (
            <div style={{ marginLeft: 12, overflow: 'hidden' }}>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>ProjectHub</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Management System</div>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', padding: '16px 12px' }}
          theme="dark"
        />

        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px',
              borderTop: `1px solid ${sidebarTheme.borderColor}`,
              background: `linear-gradient(180deg, transparent 0%, ${sidebarTheme.gradientEnd} 100%)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={36}
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${sidebarTheme.secondaryColor} 100%)`,
                  boxShadow: `0 2px 8px ${settings.primaryColor}44`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{user?.name || '사용자'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'user@example.com'}</div>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'fixed',
          left: collapsed ? 80 : 260,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 48,
          background: colors.cardBg,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 101,
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
          border: `1px solid ${colors.border}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 12px ${settings.primaryColor}44`;
          e.currentTarget.style.borderColor = settings.primaryColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        {collapsed ? <RightOutlined style={{ fontSize: 12, color: colors.textSecondary }} /> : <LeftOutlined style={{ fontSize: 12, color: colors.textSecondary }} />}
      </div>

      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)', background: colors.contentBg }}>
        <Header
          style={{
            padding: '0 32px',
            background: colors.headerBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 21, 41, 0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 64,
          }}
        >
          {/* Search Bar (Left) - Expandable */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: isDark ? '#1f1f1f' : '#f5f7fa',
              padding: '0 12px',
              height: 36, // Reduced height
              borderRadius: 18, // Pill shape
              cursor: 'text',
              width: 40, // Default collapsed width
              gap: 10,
              border: `1px solid ${isDark ? 'transparent' : 'transparent'}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              flexShrink: 0
            }}
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            onMouseEnter={e => {
              e.currentTarget.style.width = '240px';
              e.currentTarget.style.background = isDark ? '#262626' : '#edf2f7';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.width = '40px';
              e.currentTarget.style.background = isDark ? '#1f1f1f' : '#f5f7fa';
            }}
          >
            <SearchOutlined style={{ color: colors.textSecondary, fontSize: 18, minWidth: 18 }} />
            <div style={{ color: colors.textSecondary, fontSize: 13, whiteSpace: 'nowrap', opacity: 1, transition: 'opacity 0.2s', flex: 1 }}>빠른 검색...</div>
            <div style={{
              fontSize: 10,
              background: isDark ? '#303030' : '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${isDark ? '#434343' : '#e2e8f0'}`,
              color: colors.textSecondary,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}>Ctrl K</div>
          </div>

          {/* Right Side Icons */}
          <Space size={20}>
            <Tooltip title="알림">
              <NotificationCenter />
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'user-info',
                    label: (
                      <div style={{ padding: '8px 4px', minWidth: 200 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{user?.name}</div>
                        <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>{user?.email}</div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: '#f6ffed', color: '#52c41a', fontSize: 11, border: '1px solid #b7eb8f' }}>온라인</span>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: '#e6f7ff', color: '#1890ff', fontSize: 11, border: '1px solid #91d5ff' }}>{user?.role === 'admin' ? '관리자' : '멤버'}</span>
                        </div>
                      </div>
                    ),
                  },
                  { type: 'divider' },
                  {
                    key: 'theme',
                    icon: <BgColorsOutlined />,
                    label: `테마 변경 (${isDark ? '다크' : '라이트'})`,
                    onClick: () => {
                      const newTheme = settings.theme === 'light' ? 'dark' : 'light';
                      updateSettings('theme', newTheme);
                      saveSettings();
                    }
                  },
                  {
                    key: 'command',
                    icon: <SearchOutlined />,
                    label: <Typography.Text><Space><span>커맨드 센터</span><Typography.Text type="secondary" style={{ fontSize: 10 }}>Ctrl+K</Typography.Text></Space></Typography.Text>,
                    onClick: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
                  },
                  { type: 'divider' },
                  { key: 'settings', icon: <SettingOutlined />, label: '환경설정', onClick: () => navigate('/settings') },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '로그아웃', danger: true, onClick: () => { logout(); navigate('/login'); } },
                ],
                onClick: (info) => {
                  if (info.key === 'theme') {
                    // We need to implement toggle here properly.
                    // Wait, I can't put complex logic easily in inline onClick for the item if I want to use the hook's functions.
                    // Actually I can, the items array is created in render.
                  }
                }
              }}
              placement="bottomRight"
              trigger={['click']}
              dropdownRender={(menu) => (
                <div style={{
                  background: isDark ? '#1f1f1f' : '#ffffff',
                  borderRadius: 12,
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)',
                  padding: 4
                }}>
                  {React.cloneElement(menu as React.ReactElement<any>, { style: { boxShadow: 'none', background: 'transparent' } })}
                </div>
              )}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 30, transition: 'all 0.2s', border: `1px solid ${colors.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = settings.primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
              >
                <Avatar size={32} icon={<UserOutlined />} src={user?.avatar} style={{ background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${sidebarTheme.secondaryColor} 100%)` }} />
                <div style={{ lineHeight: 1.2, paddingRight: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{user?.name || '사용자'}</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 24, minHeight: 'calc(100vh - 64px - 48px)' }}>
          <div style={{ padding: 28, minHeight: '100%', background: colors.cardBg, borderRadius: borderRadiusLG, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <CommandPalette />
      <style>{`
        .ant-layout-sider .ant-menu-dark { background: transparent !important; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item { margin: 4px 0; padding-left: 16px !important; border-radius: 8px; height: 44px; line-height: 44px; color: rgba(255, 255, 255, 0.7); transition: all 0.2s; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item:hover { background: ${sidebarTheme.hoverBg} !important; color: #ffffff; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item-selected { background: ${sidebarTheme.selectedBg} !important; color: #ffffff !important; font-weight: 500; position: relative; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item-selected::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; background: linear-gradient(180deg, ${settings.primaryColor} 0%, ${sidebarTheme.secondaryColor} 100%); border-radius: 0 2px 2px 0; box-shadow: 0 0 8px ${settings.primaryColor}88; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item .anticon { font-size: 18px; transition: all 0.2s; }
        .ant-layout-sider .ant-menu-dark .ant-menu-item-selected .anticon { color: ${settings.primaryColor}; filter: drop-shadow(0 0 4px ${settings.primaryColor}66); }
        .ant-layout-sider::-webkit-scrollbar { width: 6px; }
        .ant-layout-sider::-webkit-scrollbar-thumb { background: ${settings.primaryColor}44; border-radius: 3px; }
        .ant-layout-sider::-webkit-scrollbar-thumb:hover { background: ${settings.primaryColor}66; }
        .ant-layout-sider::-webkit-scrollbar-track { background: transparent; }
        .ant-layout-sider-collapsed .ant-menu-item { padding-left: 24px !important; justify-content: center; }
        .ant-layout-sider-collapsed .ant-menu-item-selected::before { display: none; }
      `}</style>
    </Layout>
  );
};

export default MainLayout;
