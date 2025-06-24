import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { upbitApi, type UpbitMarket, UpbitTicker } from '../../services/upbit';

const MarketContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const MarketGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const MarketCard = styled.div<{ change: string }>`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => 
    props.change === 'RISE' ? '#00c851' : 
    props.change === 'FALL' ? '#ff4444' : '#666'
  };
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const MarketName = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
`;

const MarketCode = styled.div`
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
`;

const PriceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const CurrentPrice = styled.div<{ change: string }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => 
    props.change === 'RISE' ? '#00c851' : 
    props.change === 'FALL' ? '#ff4444' : '#333'
  };
`;

const ChangeInfo = styled.div<{ change: string }>`
  text-align: right;
  color: ${props => 
    props.change === 'RISE' ? '#00c851' : 
    props.change === 'FALL' ? '#ff4444' : '#666'
  };
`;

const ChangeRate = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const ChangePrice = styled.div`
  font-size: 14px;
`;

const VolumeInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 10px;
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

const UpbitMarketComponent: React.FC = () => {
  const [markets, setMarkets] = useState<UpbitMarket[]>([]);
  const [tickers, setTickers] = useState<UpbitTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 마켓 목록 조회
        const marketData = await upbitApi.getMarkets();
        const krwMarkets = marketData.filter(market => market.market.startsWith('KRW-'));
        setMarkets(krwMarkets.slice(0, 20)); // 상위 20개만 표시

        // 현재가 조회
        const marketCodes = krwMarkets.slice(0, 20).map(market => market.market).join(',');
        const tickerData = await upbitApi.getTicker(marketCodes);
        setTickers(tickerData);

      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 10초마다 데이터 갱신
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getTickerByMarket = (marketCode: string) => {
    return tickers.find(ticker => ticker.market === marketCode);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(2);
  };

  if (loading) {
    return <Loading>데이터를 불러오는 중...</Loading>;
  }

  if (error) {
    return <Error>{error}</Error>;
  }

  return (
    <MarketContainer>
      <h1>업비트 마켓 현황</h1>
      <MarketGrid>
        {markets.map(market => {
          const ticker = getTickerByMarket(market.market);
          if (!ticker) return null;

          return (
            <MarketCard key={market.market} change={ticker.change}>
              <MarketName>{market.korean_name}</MarketName>
              <MarketCode>{market.market}</MarketCode>
              <PriceInfo>
                <CurrentPrice change={ticker.change}>
                  ₩{formatPrice(ticker.trade_price)}
                </CurrentPrice>
                <ChangeInfo change={ticker.change}>
                  <ChangeRate>
                    {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                    {(ticker.change_rate * 100).toFixed(2)}%
                  </ChangeRate>
                  <ChangePrice>
                    {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                    ₩{formatPrice(ticker.change_price)}
                  </ChangePrice>
                </ChangeInfo>
              </PriceInfo>
              <VolumeInfo>
                거래량: {formatVolume(ticker.trade_volume)}
              </VolumeInfo>
            </MarketCard>
          );
        })}
      </MarketGrid>
    </MarketContainer>
  );
};

export default UpbitMarketComponent; 