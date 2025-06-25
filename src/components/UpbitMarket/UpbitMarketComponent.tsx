import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { upbitApi, type UpbitMarket } from '../../services/upbit';
import { upbitWebSocket, type UpbitTicker } from '../../services/upbitWebSocket';
import { interestService, type InterestMarket } from '../../services/interestService';

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

const InterestButton = styled.button<{ isInterest: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => props.isInterest ? '#ff6b6b' : '#3498db'};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.isInterest ? '#ff5252' : '#2980b9'};
    transform: scale(1.05);
  }
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
  position: relative;

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
  const [tickers, setTickers] = useState<Map<string, UpbitTicker>>(new Map());
  const [interestMarkets, setInterestMarkets] = useState<InterestMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // WebSocket 티커 업데이트 핸들러
  const handleTickerUpdate = useCallback((ticker: UpbitTicker) => {
    setTickers(prev => new Map(prev.set(ticker.market, ticker)));
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // 마켓 목록 조회 (REST API 사용)
        const marketData = await upbitApi.getMarkets();
        const krwMarkets = marketData.filter(market => market.market.startsWith('KRW-'));
        
        // DOGE를 특별히 포함시키기 위한 로직
        const dogeMarket = krwMarkets.find(market => market.market === 'KRW-DOGE');
        let selectedMarkets = krwMarkets.slice(0, 20); // 상위 20개
        
        // DOGE가 상위 20개에 없으면 마지막 항목을 DOGE로 교체
        if (dogeMarket && !selectedMarkets.find(market => market.market === 'KRW-DOGE')) {
          selectedMarkets = [...selectedMarkets.slice(0, 19), dogeMarket];
        }
        
        setMarkets(selectedMarkets);

        // 관심 종목 로드
        const interestData = await interestService.getInterestMarkets();
        setInterestMarkets(interestData);

        // WebSocket 연결 및 구독
        upbitWebSocket.onTickerUpdate = handleTickerUpdate;
        upbitWebSocket.onConnect = () => {
          setConnectionStatus('connected');
          console.log('WebSocket 연결됨');
        };
        upbitWebSocket.onDisconnect = () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket 연결 끊김');
        };
        upbitWebSocket.onError = () => {
          setConnectionStatus('disconnected');
          console.log('WebSocket 오류');
        };
        
        setConnectionStatus('connecting');
        upbitWebSocket.connect();
        
        // 마켓 구독
        const marketCodes = selectedMarkets.map(market => market.market);
        setTimeout(() => {
          upbitWebSocket.subscribeToMarkets(marketCodes);
        }, 1000); // 연결 후 1초 뒤 구독

      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      upbitWebSocket.disconnect();
    };
  }, [handleTickerUpdate]);

  const getTickerByMarket = (marketCode: string) => {
    return tickers.get(marketCode);
  };

  const isInterestMarket = (marketCode: string) => {
    return interestMarkets.some(market => market.market === marketCode);
  };

  const handleInterestToggle = async (market: UpbitMarket) => {
    try {
      const isInterest = isInterestMarket(market.market);
      
      if (isInterest) {
        // 관심 종목에서 삭제
        const success = await interestService.removeInterestMarket(market.market);
        if (success) {
          setInterestMarkets(prev => prev.filter(m => m.market !== market.market));
          console.log(`${market.korean_name} 관심 해제됨`);
        }
      } else {
        // 관심 종목에 추가
        const interestMarket: InterestMarket = {
          market: market.market,
          korean_name: market.korean_name,
          english_name: market.english_name,
          added_date: new Date().toISOString().split('T')[0]
        };
        
        const success = await interestService.addInterestMarket(interestMarket);
        if (success) {
          setInterestMarkets(prev => [...prev, interestMarket]);
          console.log(`${market.korean_name} 관심 추가됨`);
        }
      }
    } catch (error) {
      console.error('관심 종목 토글 실패:', error);
    }
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
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        fontSize: '14px',
        color: connectionStatus === 'connected' ? '#00c851' : '#ff4444'
      }}>
        {connectionStatus === 'connected' ? '🟢 실시간 연결됨' : 
         connectionStatus === 'connecting' ? '🟡 연결 중...' : '🔴 연결 끊김'}
      </div>
      <MarketGrid>
        {markets.map(market => {
          const ticker = getTickerByMarket(market.market);
          if (!ticker) return null;

          const isInterest = isInterestMarket(market.market);

          return (
            <MarketCard key={market.market} change={ticker.change}>
              <InterestButton 
                isInterest={isInterest}
                onClick={() => handleInterestToggle(market)}
              >
                {isInterest ? '관심 해제' : '관심 추가'}
              </InterestButton>
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