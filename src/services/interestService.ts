export interface InterestMarket {
  market: string;
  korean_name: string;
  english_name: string;
  added_date: string;
}

export interface InterestData {
  interestMarkets: InterestMarket[];
}

class InterestService {
  private readonly INTEREST_FILE_PATH = '/interest.json';

  // 관심 종목 목록 가져오기 (로컬 스토리지 우선)
  async getInterestMarkets(): Promise<InterestMarket[]> {
    try {
      // 먼저 로컬 스토리지에서 확인
      const storageMarkets = this.getInterestMarketsFromStorage();
      if (storageMarkets.length > 0) {
        return storageMarkets;
      }

      // 로컬 스토리지가 없으면 JSON 파일에서 로드
      const response = await fetch(this.INTEREST_FILE_PATH);
      const data: InterestData = await response.json();
      return data.interestMarkets;
    } catch (error) {
      console.error('관심 종목 로드 실패:', error);
      return [];
    }
  }

  // 관심 종목에 추가
  async addInterestMarket(market: InterestMarket): Promise<boolean> {
    try {
      const currentMarkets = await this.getInterestMarkets();
      
      // 이미 존재하는지 확인
      if (currentMarkets.find(m => m.market === market.market)) {
        return false; // 이미 존재함
      }

      // 새 관심 종목 추가
      const newMarkets = [...currentMarkets, market];
      const updatedData: InterestData = { interestMarkets: newMarkets };

      // 로컬 스토리지에 저장
      localStorage.setItem('interestMarkets', JSON.stringify(updatedData));
      
      return true;
    } catch (error) {
      console.error('관심 종목 추가 실패:', error);
      return false;
    }
  }

  // 관심 종목에서 삭제
  async removeInterestMarket(marketCode: string): Promise<boolean> {
    try {
      const currentMarkets = await this.getInterestMarkets();
      const filteredMarkets = currentMarkets.filter(m => m.market !== marketCode);
      
      const updatedData: InterestData = { interestMarkets: filteredMarkets };
      
      // 로컬 스토리지에 저장
      localStorage.setItem('interestMarkets', JSON.stringify(updatedData));
      
      return true;
    } catch (error) {
      console.error('관심 종목 삭제 실패:', error);
      return false;
    }
  }

  // 관심 종목인지 확인
  async isInterestMarket(marketCode: string): Promise<boolean> {
    try {
      const currentMarkets = await this.getInterestMarkets();
      return currentMarkets.some(m => m.market === marketCode);
    } catch (error) {
      console.error('관심 종목 확인 실패:', error);
      return false;
    }
  }

  // 로컬 스토리지에서 관심 종목 가져오기
  getInterestMarketsFromStorage(): InterestMarket[] {
    try {
      const stored = localStorage.getItem('interestMarkets');
      if (stored) {
        const data: InterestData = JSON.parse(stored);
        return data.interestMarkets;
      }
    } catch (error) {
      console.error('로컬 스토리지에서 관심 종목 로드 실패:', error);
    }
    return [];
  }

  // 로컬 스토리지 초기화 (JSON 파일로 리셋)
  async resetToDefault(): Promise<void> {
    try {
      const response = await fetch(this.INTEREST_FILE_PATH);
      const data: InterestData = await response.json();
      localStorage.setItem('interestMarkets', JSON.stringify(data));
    } catch (error) {
      console.error('기본 관심 종목으로 리셋 실패:', error);
    }
  }
}

export const interestService = new InterestService(); 