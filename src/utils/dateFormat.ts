import dayjs from 'dayjs';

// 설정에서 날짜/시간 형식 가져오기
const getSettings = () => {
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// 날짜 포맷팅
export const formatDate = (date: Date | string | dayjs.Dayjs, customFormat?: string): string => {
  if (!date) return '-';
  
  const settings = getSettings();
  const dateFormat = customFormat || settings?.dateFormat || 'YYYY-MM-DD';
  
  return dayjs(date).format(dateFormat);
};

// 시간 포맷팅
export const formatTime = (date: Date | string | dayjs.Dayjs, customFormat?: string): string => {
  if (!date) return '-';
  
  const settings = getSettings();
  const timeFormat = settings?.timeFormat || '24h';
  
  if (customFormat) {
    return dayjs(date).format(customFormat);
  }
  
  return timeFormat === '24h' 
    ? dayjs(date).format('HH:mm')
    : dayjs(date).format('h:mm A');
};

// 날짜 + 시간 포맷팅
export const formatDateTime = (date: Date | string | dayjs.Dayjs): string => {
  if (!date) return '-';
  
  const settings = getSettings();
  const dateFormat = settings?.dateFormat || 'YYYY-MM-DD';
  const timeFormat = settings?.timeFormat || '24h';
  
  const timePart = timeFormat === '24h' ? 'HH:mm' : 'h:mm A';
  
  return dayjs(date).format(`${dateFormat} ${timePart}`);
};

// 상대 시간 (예: 3일 전, 2시간 전)
export const formatRelativeTime = (date: Date | string | dayjs.Dayjs): string => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

// 날짜 범위 포맷팅
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const settings = getSettings();
  const dateFormat = settings?.dateFormat || 'YYYY-MM-DD';
  
  return `${dayjs(startDate).format(dateFormat)} ~ ${dayjs(endDate).format(dateFormat)}`;
};

// 짧은 날짜 (월/일만)
export const formatShortDate = (date: Date | string | dayjs.Dayjs): string => {
  if (!date) return '-';
  return dayjs(date).format('MM.DD');
};
