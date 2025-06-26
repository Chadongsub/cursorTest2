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
  Divider,
  useTheme,
  useMediaQuery
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
import { loadUpbitSettings, getUpbitSettings } from '../../utils/upbitSettings';
import Toast from '../Toast/Toast';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'change'
})<{ change: string }>(({ theme, change }) => ({
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

const PriceTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'change'
})<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.primary,
  fontWeight: 'bold',
}));

const ChangeTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'change'
})<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.secondary,
}));

const UpbitMarketComponent: React.FC = () => {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<UpbitMarket[]>([]);
  const [tickers, setTickers] = useState<{ [key: string]: UpbitTicker }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [interestMarkets, setInterestMarkets] = useState<string[]>([]);
  const [useSocket, setUseSocket] = useState(true);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // WebSocket 티커 업데이트 핸들러
  const handleTickerUpdate = useCallback((ticker: UpbitTicker) => {
    setTickers(prev => ({ ...prev, [ticker.market]: ticker }));
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    loadUpbitSettings().then((settings) => {
      setUseSocket(settings.useSocket);
    });
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadMarkets();
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const settings = getUpbitSettings();
    const { useSocket } = settings;
    setUseSocket(useSocket);

    if (useSocket) {
      // WebSocket 이벤트 핸들러 설정
      upbitWebSocket.onTickerUpdate = handleTickerUpdate;
      upbitWebSocket.onConnect = () => {
        setConnectionStatus('connected');
        showToast('실시간 데이터 연결됨', 'success');
        console.log('마켓현황 WebSocket 연결됨');
      };
      upbitWebSocket.onDisconnect = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 끊김', 'warning');
        console.log('마켓현황 WebSocket 연결 끊김');
      };
      upbitWebSocket.onError = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 오류', 'error');
        console.log('마켓현황 WebSocket 오류');
      };

      // 연결 상태 주기적 확인 (5초마다)
      const connectionCheckInterval = setInterval(() => {
        const currentState = upbitWebSocket.getConnectionState();
        if (currentState === 'connected' && connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        } else if (currentState === 'disconnected' && connectionStatus !== 'disconnected') {
          setConnectionStatus('disconnected');
        }
      }, 5000);

      return () => {
        clearInterval(connectionCheckInterval);
        // 컴포넌트 언마운트 시 이벤트 핸들러 제거
        upbitWebSocket.onTickerUpdate = undefined;
        upbitWebSocket.onConnect = undefined;
        upbitWebSocket.onDisconnect = undefined;
        upbitWebSocket.onError = undefined;
        upbitWebSocket.disconnect(); // 연결 해제
      };
    } else {
      // WebSocket 사용 안함일 때 연결 상태를 disconnected로 설정
      setConnectionStatus('disconnected');
      // 기존 연결이 있으면 해제
      if (upbitWebSocket.isConnected()) {
        upbitWebSocket.disconnect();
      }
    }

    loadInterestList();
  }, [handleTickerUpdate]);

  const loadMarkets = async () => {
    try {
      const marketList = await upbitApi.getMarkets();
      const krwMarkets = marketList.filter(market => market.market.startsWith('KRW-'));
      setMarkets(krwMarkets);

      // 초기 티커 데이터 로드
      const marketCodes = krwMarkets.map(market => market.market).join(',');
      const initialTickers = await upbitApi.getTicker(marketCodes);
      
      // 초기 데이터를 WebSocket UpbitTicker 형식으로 변환
      const tickerMap: { [key: string]: UpbitTicker } = {};
      initialTickers.forEach(ticker => {
        tickerMap[ticker.market] = {
          market: ticker.market,
          trade_date: ticker.trade_date,
          trade_time: ticker.trade_time,
          trade_price: ticker.trade_price,
          trade_volume: ticker.trade_volume,
          prev_closing_price: ticker.prev_closing_price,
          change: ticker.change as 'RISE' | 'FALL' | 'EVEN',
          change_price: ticker.change_price,
          change_rate: ticker.change_rate,
          signed_change_price: ticker.change_price,
          signed_change_rate: ticker.change_rate,
          trade_timestamp: Date.now(),
          acc_trade_volume_24h: ticker.acc_trade_volume_24h,
          acc_trade_price_24h: ticker.acc_trade_price_24h,
          acc_trade_volume: ticker.acc_trade_volume_24h,
          acc_trade_price: ticker.acc_trade_price_24h,
          acc_ask_volume: 0,
          acc_bid_volume: 0,
          highest_52_week_price: 0,
          highest_52_week_date: '',
          lowest_52_week_price: 0,
          lowest_52_week_date: '',
          market_warning: ''
        };
      });
      setTickers(tickerMap);
      setLastUpdate(new Date());

      // useSocket 설정에 따라 WebSocket 연결
      const settings = getUpbitSettings();
      if (settings.useSocket) {
        setConnectionStatus('connecting');
        upbitWebSocket.connect();
        
        // 모든 마켓 구독
        setTimeout(() => {
          upbitWebSocket.subscribeToMarkets(krwMarkets.map(market => market.market));
        }, 2000);
      } else {
        setConnectionStatus('disconnected');
      }
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
    return tickers[marketCode];
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

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  const handleCurrentPriceClick = (marketCode: string) => {
    navigate(`/current-price/${marketCode}`);
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
            <Grid key={index} sx={{ width: { xs: '100%', sm: '20%', md: '20%', lg: '20%', xl: '20%' } }}>
              <Box sx={{ height: '280px', width: '100%', minWidth: '240px' }}>
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
    <Box sx={{ p: 2 }}>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
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
                <Grid key={market.market} sx={{ width: { xs: '100%', sm: '20%', md: '20%', lg: '20%', xl: '20%' } }}>
                  <Box sx={{ height: '280px', width: '100%', minWidth: '240px' }}>
                    <StyledCard change={ticker.change} sx={{ height: '100%', width: '100%' }}>
                      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
                        {/* 헤더 영역 */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexShrink: 0 }}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              component="div" 
                              gutterBottom
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '1rem',
                                mb: 0.5
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
                        <Box sx={{ mb: 1, flexShrink: 0 }}>
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
                        {/* 거래량 영역 */}
                        <Box sx={{ mb: 1, flexShrink: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            거래량: {formatVolume(ticker.trade_volume)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {/* 상세 정보 버튼 영역 */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexShrink: 0 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={() => handleCurrentPriceClick(market.market)}
                            sx={{ 
                              flex: 1, 
                              fontSize: '0.7rem', 
                              py: 0.5,
                              minHeight: '28px'
                            }}
                          >
                            현재가
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => console.log('호가:', market.market)}
                            sx={{ 
                              flex: 1, 
                              fontSize: '0.7rem', 
                              py: 0.5,
                              minHeight: '28px'
                            }}
                          >
                            호가
                          </Button>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Box>
                </Grid>
              );
            })}
        </Grid>
      </Box>
    </Box>
  );
};

export default UpbitMarketComponent; 