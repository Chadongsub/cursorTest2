import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { upbitApi, type UpbitTicker } from '../../services/upbit';
import { interestService, type InterestMarket } from '../../services/interestService';

interface InterestData {
  interestMarkets: InterestMarket[];
}

const InterestContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const InterestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const InterestCard = styled.div<{ change: string; isDragging: boolean }>`
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
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  opacity: ${props => props.isDragging ? 0.8 : 1};
  transform: ${props => props.isDragging ? 'rotate(5deg)' : 'none'};

  &:hover {
    transform: ${props => props.isDragging ? 'rotate(5deg)' : 'translateY(-2px)'};
  }
`;

const InterestBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #ff0000;
    transform: scale(1.05);
  }
`;

const DragHandle = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  color: #666;
  font-size: 12px;
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  &:active {
    cursor: grabbing;
  }
`;

const MarketName = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
  padding-right: 80px;
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

const InterestMarkets: React.FC = () => {
  const [interestMarkets, setInterestMarkets] = useState<InterestMarket[]>([]);
  const [tickers, setTickers] = useState<UpbitTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const loadInterestMarkets = async () => {
    try {
      // 관심 종목 서비스를 통해 로드 (로컬 스토리지 우선)
      const allMarkets = await interestService.getInterestMarkets();
      setInterestMarkets(allMarkets);

      // 현재가 조회
      if (allMarkets.length > 0) {
        const marketCodes = allMarkets.map(market => market.market).join(',');
        const tickerData = await upbitApi.getTicker(marketCodes);
        setTickers(tickerData);
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadInterestMarkets();
      setLoading(false);
    };

    fetchData();

    // 10초마다 데이터 갱신
    const interval = setInterval(loadInterestMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveInterest = async (marketCode: string) => {
    try {
      const success = await interestService.removeInterestMarket(marketCode);
      if (success) {
        setInterestMarkets(prev => prev.filter(m => m.market !== marketCode));
        console.log(`${marketCode} 관심 종목에서 삭제됨`);
      }
    } catch (error) {
      console.error('관심 종목 삭제 실패:', error);
    }
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newMarkets = [...interestMarkets];
    const draggedMarket = newMarkets[draggedIndex];
    
    // 드래그된 항목 제거
    newMarkets.splice(draggedIndex, 1);
    // 새로운 위치에 삽입
    newMarkets.splice(dropIndex, 0, draggedMarket);
    
    setInterestMarkets(newMarkets);
    setDraggedIndex(null);
    
    // 로컬 스토리지에 새로운 순서 저장
    const updatedData = { interestMarkets: newMarkets };
    localStorage.setItem('interestMarkets', JSON.stringify(updatedData));
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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
    return <Loading>관심 종목을 불러오는 중...</Loading>;
  }

  if (error) {
    return <Error>{error}</Error>;
  }

  return (
    <InterestContainer>
      <h1>관심 종목</h1>
      <InterestGrid>
        {interestMarkets.map((market, index) => {
          const ticker = getTickerByMarket(market.market);
          if (!ticker) return null;

          return (
            <InterestCard 
              key={market.market} 
              change={ticker.change}
              isDragging={draggedIndex === index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <RemoveButton onClick={() => handleRemoveInterest(market.market)}>
                삭제
              </RemoveButton>
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
              <DragHandle>⋮⋮ 드래그</DragHandle>
            </InterestCard>
          );
        })}
      </InterestGrid>
    </InterestContainer>
  );
};

export default InterestMarkets; 