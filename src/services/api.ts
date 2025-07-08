const API_BASE_URL = 'http://localhost:4000/api';

export interface UpbitSetting {
  id: number;
  useSocket: boolean;
  apiInterval: number;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    return response.json();
  }

  // 업비트 설정 조회
  async getUpbitSettings(): Promise<UpbitSetting | null> {
    try {
      return await this.request<UpbitSetting>('/upbit-setting');
    } catch (error) {
      console.error('업비트 설정 조회 실패:', error);
      return null;
    }
  }

  // 업비트 설정 저장/수정
  async saveUpbitSettings(settings: { useSocket: boolean; apiInterval: number }): Promise<UpbitSetting | null> {
    try {
      return await this.request<UpbitSetting>('/upbit-setting', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('업비트 설정 저장 실패:', error);
      return null;
    }
  }
}

export const apiService = new ApiService(); 