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
  Tooltip,
  Radio,
  Divider
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
  height: '240px',
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
  '& .MuiCardContent-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
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
  const [interestMarkets, setInterestMarkets] = useState<string[]>([]);

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

    // WebSocket 이벤트 핸들러 설정 (비활성화)
    /*
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
    */

    // 연결 상태를 disconnected로 설정
    setConnectionStatus('disconnected');

    loadInterestList();

    return () => {
      // 컴포넌트 언마운트 시 이벤트 핸들러 제거
      upbitWebSocket.onTickerUpdate = undefined;
      upbitWebSocket.onConnect = undefined;
      upbitWebSocket.onDisconnect = undefined;
      upbitWebSocket.onError = undefined;
      // upbitWebSocket.disconnect(); // 연결 해제 비활성화
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

      // WebSocket 연결 및 구독 (비활성화)
      /*
      setConnectionStatus('connecting');
      upbitWebSocket.connect();
      
      // 모든 마켓 구독
      setTimeout(() => {
        upbitWebSocket.subscribeToMarkets(krwMarkets.map(market => market.market));
      }, 2000);
      */
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching data:', err);
    }
  };

  // 관심종목 목록 불러오기
  const loadInterestList = async () => {
    const list = await interestService.getInterestMarkets();
    setInterestMarkets(list.map(m => m.market));
  };

  // 관심 등록
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
        setInterestMarkets(prev => [...prev, marketCode]);
      }
    } catch (error) {
      console.error('관심 종목 추가 실패:', error);
    }
  };

  // 관심 해제
  const handleRemoveInterest = async (marketCode: string) => {
    try {
      const success = await interestService.removeInterestMarket(marketCode);
      if (success) {
        setInterestMarkets(prev => prev.filter(m => m !== marketCode));
      }
    } catch (error) {
      console.error('관심 종목 해제 실패:', error);
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
        <Grid container spacing={2} sx={{ 
          '& .MuiGrid-item': {
            minWidth: '240px'
          }
        }}>
          {[...Array(12)].map((_, index) => (
            <Grid item xs={4} sm={2.4} md={2.4} lg={2.4} xl={2.4} key={index} {...({} as any)}>
              <Box sx={{ height: '240px', width: '100%', minWidth: '240px' }}>
                <Card sx={{ height: '100%', width: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={16} />
                    <Box sx={{ mt: 'auto' }}>
                      <Skeleton variant="text" width="50%" height={12} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          ))}
        </Grid>
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
      <Grid container spacing={2} sx={{ 
        '& .MuiGrid-item': {
          minWidth: '240px'
        }
      }}>
        {markets
          .slice()
          .sort((a, b) => {
            const aInterest = interestMarkets.includes(a.market) ? 0 : 1;
            const bInterest = interestMarkets.includes(b.market) ? 0 : 1;
            return aInterest - bInterest;
          })
          .map((market) => {
            const ticker = getTickerByMarket(market.market);
            if (!ticker) return null;
            const isInterest = interestMarkets.includes(market.market);
            return (
              <Grid item xs={4} sm={2.4} md={2.4} lg={2.4} xl={2.4} key={market.market} {...({} as any)}>
                <Box sx={{ height: '240px', width: '100%', minWidth: '240px' }}>
                  <StyledCard change={ticker.change} sx={{ height: '100%', width: '100%' }}>
                    <CardContent>
                      {/* 헤더 영역 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexShrink: 0 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            component="div" 
                            gutterBottom
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '1rem'
                            }}
                          >
                            {market.korean_name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem'
                            }}
                          >
                            {market.market}
                          </Typography>
                        </Box>
                        <Tooltip title={isInterest ? '관심 종목 해제' : '관심 종목에 추가'}>
                          <Button
                            variant={isInterest ? 'contained' : 'outlined'}
                            size="small"
                            color={isInterest ? 'secondary' : 'primary'}
                            onClick={() => isInterest ? handleRemoveInterest(market.market) : handleAddInterest(market.market, market.korean_name)}
                            sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.75rem', flexShrink: 0 }}
                          >
                            {isInterest ? '해제' : '관심'}
                          </Button>
                        </Tooltip>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 가격 영역 */}
                      <Box sx={{ mb: 2, flexShrink: 0 }}>
                        <PriceTypography variant="h5" change={ticker.change} sx={{ fontSize: '1.25rem' }}>
                          ₩{formatPrice(ticker.trade_price)}
                        </PriceTypography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 변동률 및 변동가격 영역 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {ticker.change === 'RISE' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : ticker.change === 'FALL' ? (
                            <TrendingDownIcon color="error" fontSize="small" />
                          ) : (
                            <RemoveIcon color="action" fontSize="small" />
                          )}
                          <ChangeTypography variant="body2" change={ticker.change} sx={{ fontSize: '0.75rem' }}>
                            {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                            {(ticker.change_rate * 100).toFixed(2)}%
                          </ChangeTypography>
                        </Box>
                        <ChangeTypography variant="body2" change={ticker.change} sx={{ fontSize: '0.75rem' }}>
                          {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                          ₩{formatPrice(ticker.change_price)}
                        </ChangeTypography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 거래량 영역 - 하단에 고정 */}
                      <Box sx={{ mt: 'auto', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          거래량: {formatVolume(ticker.trade_volume)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Box>
              </Grid>
            );
          })}
      </Grid>
    </Box>
  );
};

export default UpbitMarketComponent; 