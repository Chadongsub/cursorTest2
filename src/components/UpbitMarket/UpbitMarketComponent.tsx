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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
`;

const Title = styled.h1`
  margin: 0;
  color: #333;
`;

const UpdateInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
`;

const LastUpdate = styled.span`
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
`;

const ConnectionStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: ${props => props.status === 'connected' ? '#00c851' : '#ff4444'};
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // WebSocket 티커 업데이트 핸들러
  const handleTickerUpdate = useCallback((ticker: UpbitTicker) => {
    setTickers(prev => new Map(prev.set(ticker.market, ticker)));
    setLastUpdate(new Date());
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadMarkets();
      setLoading(false);
    };

    fetchData();

    // WebSocket 이벤트 핸들러 설정
    upbitWebSocket.onTickerUpdate = handleTickerUpdate;
    upbitWebSocket.onConnect = () => {
      setConnectionStatus('connected');
      console.log('마켓현황 WebSocket 연결됨');
    };
    upbitWebSocket.onDisconnect = () => {
      setConnectionStatus('disconnected');
      console.log('마켓현황 WebSocket 연결 끊김');
    };
    upbitWebSocket.onError = () => {
      setConnectionStatus('disconnected');
      console.log('마켓현황 WebSocket 오류');
    };

    return () => {
      // 컴포넌트 언마운트 시 이벤트 핸들러 제거
      upbitWebSocket.onTickerUpdate = undefined;
      upbitWebSocket.onConnect = undefined;
      upbitWebSocket.onDisconnect = undefined;
      upbitWebSocket.onError = undefined;
      upbitWebSocket.disconnect();
    };
  }, [handleTickerUpdate]);

  const loadMarkets = async () => {
    try {
      // 마켓 목록 로드
      const marketList = await upbitApi.getMarkets();
      const krwMarkets = marketList.filter(market => market.market.startsWith('KRW-'));
      setMarkets(krwMarkets);

      // 초기 티커 데이터 로드
      const marketCodes = krwMarkets.map(market => market.market).join(',');
      const initialTickers = await upbitApi.getTicker(marketCodes);
      
      // 초기 데이터를 Map으로 변환
      const tickerMap = new Map();
      initialTickers.forEach(ticker => {
        tickerMap.set(ticker.market, ticker);
      });
      setTickers(tickerMap);
      setLastUpdate(new Date());

      // WebSocket 연결 및 구독
      setConnectionStatus('connecting');
      upbitWebSocket.connect();
      
      // 모든 마켓 구독
      setTimeout(() => {
        upbitWebSocket.subscribeToMarkets(krwMarkets.map(market => market.market));
      }, 2000);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching data:', err);
    }
  };

  const handleAddInterest = async (marketCode: string, koreanName: string) => {
    try {
      const interestMarket: InterestMarket = {
        market: marketCode,
        korean_name: koreanName,
        english_name: marketCode,
        added_date: new Date().toISOString().split('T')[0]
      };
      
      const success = await interestService.addInterestMarket(interestMarket);
      if (success) {
        console.log(`${marketCode} 관심 종목에 추가됨`);
      }
    } catch (error) {
      console.error('관심 종목 추가 실패:', error);
    }
  };

  const getTickerByMarket = (marketCode: string) => {
    return tickers.get(marketCode);
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

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return <Loading>마켓 정보를 불러오는 중...</Loading>;
  }

  if (error) {
    return <Error>{error}</Error>;
  }

  return (
    <MarketContainer>
      <Header>
        <Title>업비트 마켓 현황</Title>
        <UpdateInfo>
          <ConnectionStatus status={connectionStatus}>
            {connectionStatus === 'connected' ? '🟢' : 
             connectionStatus === 'connecting' ? '🟡' : '🔴'}
            {connectionStatus === 'connected' ? '실시간' : 
             connectionStatus === 'connecting' ? '연결중' : '연결끊김'}
          </ConnectionStatus>
          {lastUpdate && (
            <LastUpdate>
              마지막 업데이트: {formatLastUpdate(lastUpdate)}
            </LastUpdate>
          )}
        </UpdateInfo>
      </Header>
      <MarketGrid>
        {markets.map((market) => {
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
              <InterestButton 
                isInterest={false}
                onClick={() => handleAddInterest(market.market, market.korean_name)}
              >
                관심 추가
              </InterestButton>
            </MarketCard>
          );
        })}
      </MarketGrid>
    </MarketContainer>
  );
};

export default UpbitMarketComponent; 