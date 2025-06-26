import axios from 'axios';

const UPBIT_API_BASE_URL = 'https://api.upbit.com/v1';

export interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

export interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_price: number;
  trade_volume: number;
  prev_closing_price: number;
  change: string;
  change_price: number;
  change_rate: number;
  high_price: number;
  low_price: number;
  acc_trade_volume_24h: number;
  acc_trade_price_24h: number;
  market_warning?: string;
}

export interface UpbitOrderBook {
  market: string;
  orderbook_units: Array<{
    ask_price: number;
    bid_price: number;
    ask_size: number;
    bid_size: number;
  }>;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
}

// 시장경보 타입 정의
export type MarketWarningType = 
  | 'PRICE_FLUCTUATIONS'      // 가격 급등락 경보
  | 'TRADING_VOLUME_SOARING'  // 거래량 급등 경보
  | 'DEPOSIT_AMOUNT_SOARING'  // 입금량 급등 경보
  | 'GLOBAL_PRICE_DIFFERENCES' // 가격 차이 경보
  | 'CONCENTRATION_OF_SMALL_ACCOUNTS'; // 소수 계정 집중 경보

export interface MarketWarning {
  market: string;
  warning_type: MarketWarningType;
  warning_message: string;
  created_at: string;
}

export const upbitApi = {
  // 마켓 목록 조회
  getMarkets: async (): Promise<UpbitMarket[]> => {
    const response = await axios.get(`${UPBIT_API_BASE_URL}/market/all`);
    return response.data;
  },

  // 현재가 조회
  getTicker: async (markets: string): Promise<UpbitTicker[]> => {
    const response = await axios.get(`${UPBIT_API_BASE_URL}/ticker?markets=${markets}`);
    return response.data;
  },

  // 호가 정보 조회
  getOrderBook: async (markets: string): Promise<UpbitOrderBook[]> => {
    const response = await axios.get(`${UPBIT_API_BASE_URL}/orderbook?markets=${markets}`);
    return response.data;
  },

  // 분봉 조회
  getCandles: async (market: string, unit: number = 1, count: number = 200): Promise<any[]> => {
    const response = await axios.get(`${UPBIT_API_BASE_URL}/candles/minutes/${unit}?market=${market}&count=${count}`);
    return response.data;
  },

  // 시장경보 정보 조회 (업비트 공식 API는 없으므로 티커 데이터에서 market_warning 필드 활용)
  getMarketWarnings: async (): Promise<UpbitTicker[]> => {
    // 모든 마켓의 티커 정보를 가져와서 market_warning이 있는 것만 필터링
    const allMarkets = await upbitApi.getMarkets();
    const marketCodes = allMarkets.map(market => market.market).join(',');
    const tickers = await upbitApi.getTicker(marketCodes);
    
    // market_warning이 있는 티커만 반환
    return tickers.filter(ticker => ticker.market_warning);
  }
}; 