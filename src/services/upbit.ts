import axios from 'axios';

const UPBIT_API_BASE_URL = 'https://api.upbit.com/v1';

export interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
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
  }
}; 