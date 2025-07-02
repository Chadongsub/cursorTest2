import { TradingIndicators, CandleData, IndicatorResult } from './tradingIndicators';

export interface TradingSignal {
  timestamp: number;
  market: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  price: number;
  indicators: {
    maSignal: IndicatorResult;
    rsiSignal: IndicatorResult;
  };
  reason: string;
}

export type AlgorithmType = 'ma_rsi' | 'bollinger' | 'stochastic' | 'macd' | 'custom';

export interface TradingConfig {
  algorithmType: AlgorithmType;
  shortPeriod: number;
  longPeriod: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
  stochasticKPeriod: number;
  stochasticDPeriod: number;
  minConfidence: number;
}

export class TradingAlgorithm {
  private config: TradingConfig;
  private priceHistory: Map<string, number[]> = new Map();
  private signalHistory: Map<string, TradingSignal[]> = new Map();

  constructor(config: TradingConfig = {
    algorithmType: 'ma_rsi',
    shortPeriod: 5,
    longPeriod: 20,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    stochasticKPeriod: 14,
    stochasticDPeriod: 3,
    minConfidence: 0.3
  }) {
    this.config = config;
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<TradingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 가격 데이터 추가
   */
  addPriceData(market: string, price: number, timestamp: number) {
    if (!this.priceHistory.has(market)) {
      this.priceHistory.set(market, []);
    }
    
    const prices = this.priceHistory.get(market)!;
    prices.push(price);
    
    // 최근 100개 데이터만 유지
    if (prices.length > 100) {
      prices.shift();
    }
  }

  /**
   * 캔들 데이터 추가
   */
  addCandleData(market: string, candle: CandleData) {
    this.addPriceData(market, candle.close, candle.timestamp);
  }

  /**
   * 트레이딩 신호 생성
   */
  generateSignal(market: string): TradingSignal | null {
    const prices = this.priceHistory.get(market);
    
    if (!prices || prices.length < this.config.longPeriod) {
      return null;
    }

    let signal: TradingSignal | null = null;

    // 알고리즘 타입에 따른 신호 생성
    switch (this.config.algorithmType) {
      case 'ma_rsi':
        const combinedSignal = TradingIndicators.generateCombinedSignal(
          prices,
          this.config.shortPeriod,
          this.config.longPeriod,
          this.config.rsiPeriod
        );
        
        if (combinedSignal.confidence >= this.config.minConfidence) {
          signal = {
            timestamp: Date.now(),
            market,
            signal: combinedSignal.combinedSignal,
            confidence: combinedSignal.confidence,
            price: prices[prices.length - 1],
            indicators: {
              maSignal: combinedSignal.maSignal,
              rsiSignal: combinedSignal.rsiSignal
            },
            reason: this.generateReason(combinedSignal)
          };
        }
        break;

      case 'bollinger':
        const bollingerSignal = TradingIndicators.generateBollingerSignal(
          prices,
          this.config.bollingerPeriod,
          this.config.bollingerStdDev
        );
        
        if (bollingerSignal.strength >= this.config.minConfidence) {
          signal = {
            timestamp: Date.now(),
            market,
            signal: bollingerSignal.signal,
            confidence: bollingerSignal.strength,
            price: prices[prices.length - 1],
            indicators: {
              maSignal: bollingerSignal,
              rsiSignal: bollingerSignal
            },
            reason: this.generateBollingerReason(bollingerSignal)
          };
        }
        break;

      case 'stochastic':
        // 스토캐스틱는 high, low, close 데이터가 필요하므로 임시로 close만 사용
        const stochasticSignal = TradingIndicators.generateStochasticSignal(
          prices, // high (임시)
          prices, // low (임시)
          prices, // close
          this.config.stochasticKPeriod,
          this.config.stochasticDPeriod
        );
        
        if (stochasticSignal.strength >= this.config.minConfidence) {
          signal = {
            timestamp: Date.now(),
            market,
            signal: stochasticSignal.signal,
            confidence: stochasticSignal.strength,
            price: prices[prices.length - 1],
            indicators: {
              maSignal: stochasticSignal,
              rsiSignal: stochasticSignal
            },
            reason: this.generateStochasticReason(stochasticSignal)
          };
        }
        break;

      default:
        // 기본값은 ma_rsi
        const defaultSignal = TradingIndicators.generateCombinedSignal(
          prices,
          this.config.shortPeriod,
          this.config.longPeriod,
          this.config.rsiPeriod
        );
        
        if (defaultSignal.confidence >= this.config.minConfidence) {
          signal = {
            timestamp: Date.now(),
            market,
            signal: defaultSignal.combinedSignal,
            confidence: defaultSignal.confidence,
            price: prices[prices.length - 1],
            indicators: {
              maSignal: defaultSignal.maSignal,
              rsiSignal: defaultSignal.rsiSignal
            },
            reason: this.generateReason(defaultSignal)
          };
        }
        break;
    }

    // 신호가 생성된 경우에만 히스토리에 저장
    if (signal) {
      if (!this.signalHistory.has(market)) {
        this.signalHistory.set(market, []);
      }
      
      const history = this.signalHistory.get(market)!;
      history.push(signal);
      
      // 최근 50개 신호만 유지
      if (history.length > 50) {
        history.shift();
      }
    }

    return signal;
  }

  /**
   * 신호 이유 생성
   */
  private generateReason(combinedSignal: any): string {
    const { maSignal, rsiSignal, combinedSignal: signal } = combinedSignal;
    
    if (signal === 'buy') {
      if (maSignal.signal === 'buy' && rsiSignal.signal === 'buy') {
        return '이동평균 상향돌파 + RSI 과매도 구간';
      } else if (maSignal.signal === 'buy') {
        return '이동평균 상향돌파';
      } else {
        return 'RSI 과매도 구간';
      }
    } else if (signal === 'sell') {
      if (maSignal.signal === 'sell' && rsiSignal.signal === 'sell') {
        return '이동평균 하향돌파 + RSI 과매수 구간';
      } else if (maSignal.signal === 'sell') {
        return '이동평균 하향돌파';
      } else {
        return 'RSI 과매수 구간';
      }
    }
    
    return '신호 없음';
  }

  /**
   * 볼린저 밴드 신호 이유 생성
   */
  private generateBollingerReason(signal: any): string {
    if (signal.signal === 'buy') {
      return '볼린저 밴드 하단 터치 (과매도)';
    } else if (signal.signal === 'sell') {
      return '볼린저 밴드 상단 터치 (과매수)';
    }
    return '신호 없음';
  }

  /**
   * 스토캐스틱 신호 이유 생성
   */
  private generateStochasticReason(signal: any): string {
    if (signal.signal === 'buy') {
      return '스토캐스틱 과매도 구간';
    } else if (signal.signal === 'sell') {
      return '스토캐스틱 과매수 구간';
    }
    return '신호 없음';
  }

  /**
   * 모든 마켓에 대한 신호 생성
   */
  generateAllSignals(markets: string[]): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    for (const market of markets) {
      const signal = this.generateSignal(market);
      if (signal) {
        signals.push(signal);
      }
    }
    
    return signals;
  }

  /**
   * 특정 마켓의 신호 히스토리 조회
   */
  getSignalHistory(market: string): TradingSignal[] {
    return this.signalHistory.get(market) || [];
  }

  /**
   * 모든 신호 히스토리 조회
   */
  getAllSignalHistory(): Map<string, TradingSignal[]> {
    return new Map(this.signalHistory);
  }

  /**
   * 성과 분석
   */
  analyzePerformance(market: string, days: number = 7): {
    totalSignals: number;
    buySignals: number;
    sellSignals: number;
    avgConfidence: number;
    lastSignal: TradingSignal | null;
  } {
    const history = this.getSignalHistory(market);
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const recentSignals = history.filter(signal => signal.timestamp >= cutoffTime);
    
    const buySignals = recentSignals.filter(signal => signal.signal === 'buy').length;
    const sellSignals = recentSignals.filter(signal => signal.signal === 'sell').length;
    const avgConfidence = recentSignals.length > 0 
      ? recentSignals.reduce((sum, signal) => sum + signal.confidence, 0) / recentSignals.length 
      : 0;
    
    return {
      totalSignals: recentSignals.length,
      buySignals,
      sellSignals,
      avgConfidence,
      lastSignal: history.length > 0 ? history[history.length - 1] : null
    };
  }

  /**
   * 백테스팅 (간단한 버전)
   */
  backtest(market: string, initialBalance: number = 1000000): {
    initialBalance: number;
    finalBalance: number;
    profit: number;
    profitRate: number;
    trades: number;
    winRate: number;
  } {
    const history = this.getSignalHistory(market);
    let balance = initialBalance;
    let position = 0;
    let trades = 0;
    let wins = 0;
    
    for (const signal of history) {
      if (signal.signal === 'buy' && position === 0) {
        // 매수
        position = balance / signal.price;
        balance = 0;
        trades++;
      } else if (signal.signal === 'sell' && position > 0) {
        // 매도
        const sellValue = position * signal.price;
        balance = sellValue;
        
        if (sellValue > initialBalance) {
          wins++;
        }
        
        position = 0;
        trades++;
      }
    }
    
    // 마지막 포지션 정리
    if (position > 0) {
      const lastPrice = history[history.length - 1]?.price || 0;
      balance = position * lastPrice;
    }
    
    const profit = balance - initialBalance;
    const profitRate = (profit / initialBalance) * 100;
    const winRate = trades > 0 ? (wins / trades) * 100 : 0;
    
    return {
      initialBalance,
      finalBalance: balance,
      profit,
      profitRate,
      trades,
      winRate
    };
  }
} 