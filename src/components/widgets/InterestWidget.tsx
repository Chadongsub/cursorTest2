import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Chip, Box, LinearProgress } from '@mui/material';
import { upbitWebSocket, type UpbitTicker } from '../../services/upbitWebSocket';
import { upbitApi } from '../../services/upbit';
import { interestService, type InterestMarket } from '../../services/interestService';

export default function InterestWidget() {
  const [interestMarkets, setInterestMarkets] = useState<InterestMarket[]>([]);
  const [tickers, setTickers] = useState<Map<string, UpbitTicker>>(new Map());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleTickerUpdate = useCallback((ticker: UpbitTicker) => {
    setTickers(prev => new Map(prev.set(ticker.market, ticker)));
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allMarkets = await interestService.getInterestMarkets();
      setInterestMarkets(allMarkets);
      if (allMarkets.length > 0) {
        const marketCodes = allMarkets.map(m => m.market).join(',');
        const initialTickers = await upbitApi.getTicker(marketCodes);
        const tickerMap = new Map();
        initialTickers.forEach(ticker => tickerMap.set(ticker.market, ticker));
        setTickers(tickerMap);
        setLastUpdate(new Date());
        upbitWebSocket.onTickerUpdate = handleTickerUpdate;
        upbitWebSocket.connect();
        setTimeout(() => {
          upbitWebSocket.subscribeToMarkets(allMarkets.map(m => m.market));
        }, 1000);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      upbitWebSocket.onTickerUpdate = undefined;
      upbitWebSocket.disconnect();
    };
  }, [handleTickerUpdate]);

  if (loading) return <LinearProgress />;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>관심 종목</Typography>
        {interestMarkets.length === 0 && <Typography variant="body2">관심 종목이 없습니다.</Typography>}
        {interestMarkets.map(market => {
          const ticker = tickers.get(market.market);
          if (!ticker) return null;
          return (
            <Box key={market.market} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{market.korean_name}</Typography>
              <Chip label={`₩${ticker.trade_price.toLocaleString()}`} size="small" color={ticker.change === 'RISE' ? 'success' : ticker.change === 'FALL' ? 'error' : 'default'} />
            </Box>
          );
        })}
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary">업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}</Typography>
        )}
      </CardContent>
    </Card>
  );
} 