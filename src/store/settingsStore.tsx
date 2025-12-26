// ReactNode 앞에 'type'을 붙여줍니다.
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 설정 저장소 키
const SETTINGS_KEY = 'app-settings';

// 기본 설정값
export const defaultSettings = {
  // 테마 설정
  theme: 'light' as 'light' | 'dark' | 'system',
  primaryColor: '#667eea',
  fontSize: 14,
  compactMode: false,

  // 알림 설정
  notifications: {
    enabled: true,
    sound: true,
    desktop: false,
    email: false,
    deadlineReminder: true,
    deadlineDays: 3,
    taskAssigned: true,
    taskCompleted: true,
    projectUpdates: true,
    dailyDigest: false,
    digestTime: '09:00',
  },

  // 언어 설정
  language: 'ko',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h' as '24h' | '12h',

  // 기타
  autoSave: true,
  showTips: true,
};

export type SettingsType = typeof defaultSettings;

interface SettingsContextType {
  settings: SettingsType;
  updateSettings: (path: string, value: any) => void;
  saveSettings: () => void;
  resetSettings: () => void;
  hasChanges: boolean;
  // 계산된 테마 값 (system일 경우 실제 테마)
  effectiveTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// 시스템 다크모드 감지
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsType>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [savedSettings, setSavedSettings] = useState<SettingsType>(settings);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme());

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 실제 적용될 테마 계산
  const effectiveTheme: 'light' | 'dark' =
    settings.theme === 'system' ? systemTheme : settings.theme;

  // CSS 변수 적용 (글꼴 크기)
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize}px`);
  }, [settings.fontSize]);

  // 변경사항 감지
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // 설정 업데이트 함수
  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      return newSettings;
    });
  };

  // 설정 저장
  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSavedSettings(settings);
  };

  // 설정 초기화
  const resetSettings = () => {
    setSettings(defaultSettings);
    setSavedSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettings,
        resetSettings,
        hasChanges,
        effectiveTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
