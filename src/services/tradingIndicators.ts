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
    
    // 추가 조건: 단기 이동평균이 장기 이동평균보다 높고, 가격이 단기 이동평균 위에 있을 때
    const shortAboveLong = currentShort > currentLong;
    const priceAboveShort = prices[prices.length - 1] > currentShort;
    const priceBelowShort = prices[prices.length - 1] < currentShort;
    
    // 신호 강도 계산 (이동평균 간 거리)
    const distance = Math.abs(currentShort - currentLong) / currentLong;
    const strength = Math.min(distance * 10, 1); // 0-1 범위로 정규화
    
    if (shortCrossedAbove) {
      return { value: currentShort, signal: 'buy', strength: Math.max(strength, 0.3) };
    } else if (shortCrossedBelow) {
      return { value: currentShort, signal: 'sell', strength: Math.max(strength, 0.3) };
    }
    // 추가 매수 조건: 단기 이동평균이 장기 이동평균 위에 있고, 가격이 단기 이동평균 위에 있을 때
    else if (shortAboveLong && priceAboveShort) {
      return { value: currentShort, signal: 'buy', strength: 0.2 };
    }
    // 추가 매도 조건: 단기 이동평균이 장기 이동평균 아래에 있고, 가격이 단기 이동평균 아래에 있을 때
    else if (!shortAboveLong && priceBelowShort) {
      return { value: currentShort, signal: 'sell', strength: 0.2 };
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
    
    // RSI 조건을 더 완화 (30→35, 70→65)
    if (currentRSI <= 35) {
      signal = 'buy';
      strength = (35 - currentRSI) / 35; // 35 이하일수록 강한 매수 신호
    } else if (currentRSI >= 65) {
      signal = 'sell';
      strength = (currentRSI - 65) / 35; // 65 이상일수록 강한 매도 신호
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

  /**
   * 볼린저 밴드 계산
   */
  static calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(data, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upperBand.push(NaN);
        lowerBand.push(NaN);
        continue;
      }
      
      // 표준편차 계산
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(mean + (stdDev * standardDeviation));
      lowerBand.push(mean - (stdDev * standardDeviation));
    }
    
    return { sma, upperBand, lowerBand };
  }

  /**
   * 볼린저 밴드 신호 생성
   */
  static generateBollingerSignal(prices: number[], period: number = 20, stdDev: number = 2): IndicatorResult {
    const bands = this.calculateBollingerBands(prices, period, stdDev);
    
    if (prices.length === 0 || isNaN(bands.upperBand[bands.upperBand.length - 1])) {
      return { value: 0, signal: 'hold', strength: 0 };
    }
    
    const currentPrice = prices[prices.length - 1];
    const upperBand = bands.upperBand[bands.upperBand.length - 1];
    const lowerBand = bands.lowerBand[bands.lowerBand.length - 1];
    const middleBand = bands.sma[bands.sma.length - 1];
    
    // 밴드폭 계산
    const bandWidth = (upperBand - lowerBand) / middleBand;
    
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0;
    
    if (currentPrice <= lowerBand) {
      signal = 'buy';
      strength = Math.min((lowerBand - currentPrice) / lowerBand * 10, 1);
    } else if (currentPrice >= upperBand) {
      signal = 'sell';
      strength = Math.min((currentPrice - upperBand) / upperBand * 10, 1);
    }
    
    return { value: currentPrice, signal, strength };
  }

  /**
   * 스토캐스틱 계산
   */
  static calculateStochastic(high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3) {
    const kLine: number[] = [];
    const dLine: number[] = [];
    
    for (let i = kPeriod - 1; i < close.length; i++) {
      const highestHigh = Math.max(...high.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - kPeriod + 1, i + 1));
      const currentClose = close[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kLine.push(k);
    }
    
    // %D 라인 계산 (K의 이동평균)
    for (let i = dPeriod - 1; i < kLine.length; i++) {
      const d = kLine.slice(i - dPeriod + 1, i + 1).reduce((sum, val) => sum + val, 0) / dPeriod;
      dLine.push(d);
    }
    
    return { kLine, dLine };
  }

  /**
   * 스토캐스틱 신호 생성
   */
  static generateStochasticSignal(high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3): IndicatorResult {
    const stoch = this.calculateStochastic(high, low, close, kPeriod, dPeriod);
    
    if (stoch.kLine.length === 0 || stoch.dLine.length === 0) {
      return { value: 0, signal: 'hold', strength: 0 };
    }
    
    const currentK = stoch.kLine[stoch.kLine.length - 1];
    const currentD = stoch.dLine[stoch.dLine.length - 1];
    const previousK = stoch.kLine[stoch.kLine.length - 2] || currentK;
    const previousD = stoch.dLine[stoch.dLine.length - 2] || currentD;
    
    let signal: 'buy' | 'sell' | 'hold' = 'hold';
    let strength = 0;
    
    // 과매수/과매도 구간 확인
    if (currentK <= 20 && currentD <= 20) {
      signal = 'buy';
      strength = (20 - Math.min(currentK, currentD)) / 20;
    } else if (currentK >= 80 && currentD >= 80) {
      signal = 'sell';
      strength = (Math.max(currentK, currentD) - 80) / 20;
    }
    
    // 크로스오버 확인
    if (previousK <= previousD && currentK > currentD && currentK < 50) {
      signal = 'buy';
      strength = Math.max(strength, 0.5);
    } else if (previousK >= previousD && currentK < currentD && currentK > 50) {
      signal = 'sell';
      strength = Math.max(strength, 0.5);
    }
    
    return { value: currentK, signal, strength };
  }
} 