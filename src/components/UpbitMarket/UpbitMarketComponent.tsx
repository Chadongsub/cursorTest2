import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Alert,
  Skeleton,
  Button,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Favorite as FavoriteIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  WifiTethering as WifiTetheringIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { upbitApi, type UpbitMarket } from '../../services/upbit';
import { upbitWebSocket, type UpbitTicker } from '../../services/upbitWebSocket';
import { interestService, type InterestMarket } from '../../services/interestService';

const StyledCard = styled(Card)<{ change: string }>(({ theme, change }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  borderLeft: `4px solid ${
    change === 'RISE' ? theme.palette.success.main :
    change === 'FALL' ? theme.palette.error.main :
    theme.palette.grey[400]
  }`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const PriceTypography = styled(Typography)<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.primary,
  fontWeight: 'bold',
}));

const ChangeTypography = styled(Typography)<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.secondary,
}));

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

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon color="success" />;
      case 'connecting':
        return <WifiTetheringIcon color="warning" />;
      case 'disconnected':
        return <WifiOffIcon color="error" />;
      default:
        return <WifiOffIcon color="error" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '실시간 연결됨';
      case 'connecting':
        return '연결 중...';
      case 'disconnected':
        return '연결 끊김';
      default:
        return '연결 끊김';
    }
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3 }}>
          {[...Array(12)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            실시간 업비트 마켓 정보
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={getConnectionIcon()}
            label={getConnectionText()}
            color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
            variant="outlined"
          />
          {lastUpdate && (
            <Chip
              label={`마지막 업데이트: ${formatLastUpdate(lastUpdate)}`}
              variant="outlined"
              size="small"
            />
          )}
          <Tooltip title="새로고침">
            <IconButton onClick={loadMarkets} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 마켓 카드 그리드 */}
      <Grid container spacing={3}>
        {markets.map((market) => {
          const ticker = getTickerByMarket(market.market);
          if (!ticker) return null;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={market.market}>
              <StyledCard change={ticker.change}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        {market.korean_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {market.market}
                      </Typography>
                    </Box>
                    <Tooltip title="관심 종목에 추가">
                      <IconButton
                        size="small"
                        onClick={() => handleAddInterest(market.market, market.korean_name)}
                        sx={{ color: 'primary.main' }}
                      >
                        <FavoriteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <PriceTypography variant="h5" change={ticker.change}>
                      ₩{formatPrice(ticker.trade_price)}
                    </PriceTypography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {ticker.change === 'RISE' ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : ticker.change === 'FALL' ? (
                        <TrendingDownIcon color="error" fontSize="small" />
                      ) : (
                        <RemoveIcon color="action" fontSize="small" />
                      )}
                      <ChangeTypography variant="body2" change={ticker.change}>
                        {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                        {(ticker.change_rate * 100).toFixed(2)}%
                      </ChangeTypography>
                    </Box>
                    <ChangeTypography variant="body2" change={ticker.change}>
                      {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                      ₩{formatPrice(ticker.change_price)}
                    </ChangeTypography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    거래량: {formatVolume(ticker.trade_volume)}
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default UpbitMarketComponent; 