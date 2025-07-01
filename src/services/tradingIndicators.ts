export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1 사이의 신호 강도
}

export class TradingIndicators {
  /**
   * 단순이동평균(SMA) 계산
   */
  static calculateSMA(data: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
        continue;
      }
      
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }

  /**
   * 지수이동평균(EMA) 계산
   */
  static calculateEMA(data: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema.push(data[0]);
        continue;
      }
      
      const newEMA = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(newEMA);
    }
    
    return ema;
  }

  /**
   * RSI 계산
   */
  static calculateRSI(data: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // 가격 변화 계산
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // 첫 번째 평균 계산
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsi.push(NaN);
        continue;
      }
      
      if (i === period) {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
        continue;
      }
      
      // 지수이동평균 방식으로 업데이트
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }

  /**
   * MACD 계산
   */
  static calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);
    
    const macdLine: number[] = [];
    const signalLine: number[] = [];
    const histogram: number[] = [];
    
    // MACD 라인 계산
    for (let i = 0; i < data.length; i++) {
      if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
        macdLine.push(NaN);
        continue;
      }
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    // 시그널 라인 계산 (MACD의 EMA)
    const signalEMA = this.calculateEMA(macdLine.filter(val => !isNaN(val)), signalPeriod);
    let signalIndex = 0;
    
    for (let i = 0; i < macdLine.length; i++) {
      if (isNaN(macdLine[i])) {
        signalLine.push(NaN);
        histogram.push(NaN);
        continue;
      }
      
      if (signalIndex < signalEMA.length) {
        signalLine.push(signalEMA[signalIndex]);
        histogram.push(macdLine[i] - signalEMA[signalIndex]);
        signalIndex++;
      } else {
        signalLine.push(NaN);
        histogram.push(NaN);
      }
    }
    
    return { macdLine, signalLine, histogram };
  }

  /**
   * 이동평균 크로스오버 신호 생성
   */
  static generateMACrossoverSignal(shortPeriod: number, longPeriod: number, prices: number[]): IndicatorResult {
    const shortMA = this.calculateEMA(prices, shortPeriod);
    const longMA = this.calculateEMA(prices, longPeriod);
    
    if (shortMA.length < 2 || longMA.length < 2) {
      return { value: 0, signal: 'hold', strength: 0 };
    }
    
    const currentShort = shortMA[shortMA.length - 1];
    const previousShort = shortMA[shortMA.length - 2];
    const currentLong = longMA[longMA.length - 1];
    const previousLong = longMA[longMA.length - 2];
    
    // 크로스오버 확인
    const shortCrossedAbove = previousShort <= previousLong && currentShort > currentLong;
    const shortCrossedBelow = previousShort >= previousLong && currentShort < currentLong;
    
    // 신호 강도 계산 (이동평균 간 거리)
    const distance = Math.abs(currentShort - currentLong) / currentLong;
    const strength = Math.min(distance * 10, 1); // 0-1 범위로 정규화
    
    if (shortCrossedAbove) {
      return { value: currentShort, signal: 'buy', strength };
    } else if (shortCrossedBelow) {
      return { value: currentShort, signal: 'sell', strength };
    }
    
    return { value: currentShort, signal: 'hold', strength: 0 };
  }

  /**
   * RSI 신호 생성
   */
  static generateRSISignal(prices: number[], period: number = 14): IndicatorResult {
    const rsi = this.calculateRSI(prices, period);
    
    if (rsi.length === 0 || isNaN(rsi[rsi.length - 1])) {
      return { value: 0, signal: 'hold', strength: 0 };
    }
    
    const currentRSI = rsi[rsi.length - 1];
    
    // 신호 강도 계산
    let strength = 0;
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    
    if (currentRSI <= 30) {
      signal = 'buy';
      strength = (30 - currentRSI) / 30; // 30 이하일수록 강한 매수 신호
    } else if (currentRSI >= 70) {
      signal = 'sell';
      strength = (currentRSI - 70) / 30; // 70 이상일수록 강한 매도 신호
    }
    
    return { value: currentRSI, signal, strength };
  }

  /**
   * 복합 신호 생성 (이동평균 + RSI)
   */
  static generateCombinedSignal(prices: number[], shortPeriod: number = 5, longPeriod: number = 20, rsiPeriod: number = 14): {
    maSignal: IndicatorResult;
    rsiSignal: IndicatorResult;
    combinedSignal: 'buy' | 'sell' | 'hold';
    confidence: number;
  } {
    const maSignal = this.generateMACrossoverSignal(shortPeriod, longPeriod, prices);
    const rsiSignal = this.generateRSISignal(prices, rsiPeriod);
    
    let combinedSignal: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;
    
    // 두 신호가 일치하는 경우
    if (maSignal.signal === rsiSignal.signal && maSignal.signal !== 'hold') {
      combinedSignal = maSignal.signal;
      confidence = (maSignal.strength + rsiSignal.strength) / 2;
    }
    // 신호가 상충하는 경우 (이동평균 신호를 우선)
    else if (maSignal.signal !== 'hold') {
      combinedSignal = maSignal.signal;
      confidence = maSignal.strength * 0.7; // 신뢰도 감소
    }
    // RSI만 신호가 있는 경우
    else if (rsiSignal.signal !== 'hold') {
      combinedSignal = rsiSignal.signal;
      confidence = rsiSignal.strength * 0.5; // 신뢰도 더 감소
    }
    
    return {
      maSignal,
      rsiSignal,
      combinedSignal,
      confidence
    };
  }
} 