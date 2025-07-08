import { apiService, UpbitSetting } from '../services/api';

export interface UpbitSettings {
  useSocket: boolean;
  apiInterval: number;
}

const LOCAL_KEY = 'upbitSettings';
const FILE_PATH = '/upbit-settings.json';

// 설정 변경 이벤트
const SETTINGS_CHANGE_EVENT = 'upbitSettingsChange';

// 기본 설정값
const DEFAULT_SETTINGS: UpbitSettings = {
  useSocket: true,
  apiInterval: 5000
};

export async function getUpbitSettings(): Promise<UpbitSettings> {
  try {
    // API에서 설정 조회 시도
    const apiSettings = await apiService.getUpbitSettings();
    if (apiSettings) {
      return {
        useSocket: apiSettings.useSocket,
        apiInterval: apiSettings.apiInterval
      };
    }
  } catch (error) {
    console.log('API 설정 조회 실패, localStorage 사용:', error);
  }

  // API 실패 시 localStorage에서 동기적으로 가져오기
  const local = localStorage.getItem(LOCAL_KEY);
  if (local) {
    return JSON.parse(local);
  }
  
  // 기본값 반환
  return DEFAULT_SETTINGS;
}

export async function loadUpbitSettings(): Promise<UpbitSettings> {
  return getUpbitSettings();
}

export async function saveUpbitSettings(settings: UpbitSettings): Promise<void> {
  try {
    // API에 저장 시도
    const savedSettings = await apiService.saveUpbitSettings(settings);
    if (savedSettings) {
      console.log('API에 설정 저장 성공');
      // 설정 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
      return;
    }
  } catch (error) {
    console.log('API 설정 저장 실패, localStorage 사용:', error);
  }

  // API 실패 시 localStorage에 저장
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  
  // 설정 변경 이벤트 발생
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
}

// 설정 변경 이벤트 리스너 등록
export function onSettingsChange(callback: (settings: UpbitSettings) => void) {
  const handler = (event: CustomEvent) => {
    callback(event.detail);
  };
  
  window.addEventListener(SETTINGS_CHANGE_EVENT, handler as EventListener);
  
  // 리스너 제거 함수 반환
  return () => {
    window.removeEventListener(SETTINGS_CHANGE_EVENT, handler as EventListener);
  };
} 