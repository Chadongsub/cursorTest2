export interface UpbitSettings {
  useSocket: boolean;
  apiInterval: number;
}

const LOCAL_KEY = 'upbitSettings';
const FILE_PATH = '/upbit-settings.json';

export function getUpbitSettings(): UpbitSettings {
  // localStorage에서 동기적으로 가져오기
  const local = localStorage.getItem(LOCAL_KEY);
  if (local) {
    return JSON.parse(local);
  }
  // 기본값 반환
  return {
    useSocket: true,
    apiInterval: 5000
  };
}

export async function loadUpbitSettings(): Promise<UpbitSettings> {
  // 1. localStorage 우선
  const local = localStorage.getItem(LOCAL_KEY);
  if (local) {
    return JSON.parse(local);
  }
  // 2. 파일에서 fetch
  const res = await fetch(FILE_PATH);
  const data = await res.json();
  return data;
}

export function saveUpbitSettings(settings: UpbitSettings) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
} 