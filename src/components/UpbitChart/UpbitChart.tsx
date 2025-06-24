import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { upbitApi } from '../../services/upbit';

const ChartContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const MarketSelector = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background: white;
`;

const ChartCanvas = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Loading = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
`;

const Error = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #ff4444;
`;

const SimpleChart = styled.div`
  width: 100%;
  height: 300px;
  position: relative;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
`;

const ChartLine = styled.svg`
  width: 100%;
  height: 100%;
`;

const PriceInfo = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const PriceCard = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
`;

const PriceLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
`;

const PriceValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;

const UpbitChart: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState('KRW-BTC');
  const [markets, setMarkets] = useState<Array<{market: string, korean_name: string}>>([]);
  const [candles, setCandles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const marketData = await upbitApi.getMarkets();
        const krwMarkets = marketData
          .filter(market => market.market.startsWith('KRW-'))
          .slice(0, 10); // 상위 10개만
        setMarkets(krwMarkets);
      } catch (err) {
        console.error('Error fetching markets:', err);
      }
    };

    fetchMarkets();
  }, []);

  useEffect(() => {
    const fetchCandles = async () => {
      try {
        setLoading(true);
        const candleData = await upbitApi.getCandles(selectedMarket, 1, 100);
        setCandles(candleData.reverse()); // 시간순으로 정렬
      } catch (err) {
        setError('차트 데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching candles:', err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMarket) {
      fetchCandles();
    }
  }, [selectedMarket]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const renderSimpleChart = () => {
    if (candles.length === 0) return null;

    const prices = candles.map(candle => candle.trade_price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const width = 800;
    const height = 250;
    const padding = 40;

    const points = candles.map((candle, index) => {
      const x = (index / (candles.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((candle.trade_price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <SimpleChart>
        <ChartLine>
          <polyline
            fill="none"
            stroke="#007bff"
            strokeWidth="2"
            points={points}
          />
        </ChartLine>
      </SimpleChart>
    );
  };

  const getCurrentPrice = () => {
    return candles.length > 0 ? candles[candles.length - 1].trade_price : 0;
  };

  const getPriceChange = () => {
    if (candles.length < 2) return { change: 0, changeRate: 0 };
    const current = candles[candles.length - 1].trade_price;
    const previous = candles[candles.length - 2].trade_price;
    const change = current - previous;
    const changeRate = (change / previous) * 100;
    return { change, changeRate };
  };

  const getHighLow = () => {
    if (candles.length === 0) return { high: 0, low: 0 };
    const prices = candles.map(candle => candle.trade_price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices)
    };
  };

  if (loading) {
    return <Loading>차트 데이터를 불러오는 중...</Loading>;
  }

  if (error) {
    return <Error>{error}</Error>;
  }

  const currentPrice = getCurrentPrice();
  const { change, changeRate } = getPriceChange();
  const { high, low } = getHighLow();

  return (
    <ChartContainer>
      <ChartHeader>
        <h1>업비트 차트</h1>
        <MarketSelector 
          value={selectedMarket} 
          onChange={(e) => setSelectedMarket(e.target.value)}
        >
          {markets.map(market => (
            <option key={market.market} value={market.market}>
              {market.korean_name} ({market.market})
            </option>
          ))}
        </MarketSelector>
      </ChartHeader>

      <ChartCanvas>
        {renderSimpleChart()}
      </ChartCanvas>

      <PriceInfo>
        <PriceCard>
          <PriceLabel>현재가</PriceLabel>
          <PriceValue>₩{formatPrice(currentPrice)}</PriceValue>
        </PriceCard>
        <PriceCard>
          <PriceLabel>변동</PriceLabel>
          <PriceValue style={{ color: change >= 0 ? '#00c851' : '#ff4444' }}>
            {change >= 0 ? '+' : ''}₩{formatPrice(change)} ({changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%)
          </PriceValue>
        </PriceCard>
        <PriceCard>
          <PriceLabel>고가</PriceLabel>
          <PriceValue>₩{formatPrice(high)}</PriceValue>
        </PriceCard>
        <PriceCard>
          <PriceLabel>저가</PriceLabel>
          <PriceValue>₩{formatPrice(low)}</PriceValue>
        </PriceCard>
      </PriceInfo>
    </ChartContainer>
  );
};

export default UpbitChart; 