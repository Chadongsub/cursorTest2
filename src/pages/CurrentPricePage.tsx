import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Divider,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { upbitApi, type UpbitTicker } from '../services/upbit';
import { upbitWebSocket, type UpbitTicker as WebSocketTicker } from '../services/upbitWebSocket';
import { getUpbitSettings } from '../utils/upbitSettings';
import Toast from '../components/Toast/Toast';
import PageLayout from '../components/Layout/PageLayout';

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

const AnimatedPriceTypography = styled(PriceTypography, {
  shouldForwardProp: (prop) => prop !== 'animation'
})<{ animation: 'up' | 'down' | 'none' }>(({ animation }) => ({
  transition: 'all 0.3s ease-in-out',
  ...(animation === 'up' && {
    transform: 'scale(1.05)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '4px',
    padding: '4px 8px',
  }),
  ...(animation === 'down' && {
    transform: 'scale(1.05)',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: '4px',
    padding: '4px 8px',
  }),
}));

const CurrentPricePage: React.FC = () => {
  const { market } = useParams<{ market: string }>();
  const navigate = useNavigate();
  const [ticker, setTicker] = useState<UpbitTicker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | 'none'>('none');
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

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
        return <TrendingUpIcon color="success" />;
      case 'connecting':
        return <TrendingUpIcon color="warning" />;
      case 'disconnected':
        return <TrendingDownIcon color="error" />;
      default:
        return <TrendingDownIcon color="error" />;
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

  // WebSocket 티커 업데이트 핸들러
  const handleTickerUpdate = (updatedTicker: WebSocketTicker) => {
    if (updatedTicker.market === market) {
      // 이전 가격과 비교하여 애니메이션 설정
      if (ticker) {
        if (updatedTicker.trade_price > ticker.trade_price) {
          setPriceAnimation('up');
        } else if (updatedTicker.trade_price < ticker.trade_price) {
          setPriceAnimation('down');
        }
        
        // 애니메이션 효과 제거
        setTimeout(() => {
          setPriceAnimation('none');
        }, 1000);
      }

      // WebSocket 티커를 API 티커 형식으로 변환
      const convertedTicker: UpbitTicker = {
        market: updatedTicker.market,
        trade_date: updatedTicker.trade_date,
        trade_time: updatedTicker.trade_time,
        trade_price: updatedTicker.trade_price,
        trade_volume: updatedTicker.trade_volume,
        prev_closing_price: updatedTicker.prev_closing_price,
        change: updatedTicker.change,
        change_price: updatedTicker.change_price,
        change_rate: updatedTicker.change_rate,
        high_price: 0, // WebSocket에서는 제공하지 않음
        low_price: 0,  // WebSocket에서는 제공하지 않음
        acc_trade_volume_24h: updatedTicker.acc_trade_volume_24h,
        acc_trade_price_24h: updatedTicker.acc_trade_price_24h
      };
      setTicker(convertedTicker);
      setLastUpdate(new Date());
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    const loadTickerData = async () => {
      if (!market) return;
      
      try {
        setLoading(true);
        const tickers = await upbitApi.getTicker(market);
        if (tickers.length > 0) {
          setTicker(tickers[0]);
          setLastUpdate(new Date());
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching ticker data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTickerData();
  }, [market]);

  // WebSocket 연결
  useEffect(() => {
    const settings = getUpbitSettings();
    const { useSocket } = settings;

    if (useSocket && market) {
      // 초기 연결 상태 설정
      const currentState = upbitWebSocket.getConnectionState();
      if (currentState === 'connecting') {
        setConnectionStatus('connecting');
      } else if (currentState === 'connected') {
        setConnectionStatus('connected');
        // 이미 연결된 상태라면 해당 마켓 구독
        upbitWebSocket.subscribeToMarkets([market]);
      } else {
        setConnectionStatus('disconnected');
        // 연결되지 않은 상태라면 연결 시도
        upbitWebSocket.connect();
      }

      // WebSocket 이벤트 핸들러 설정
      upbitWebSocket.onTickerUpdate = handleTickerUpdate;
      upbitWebSocket.onConnect = () => {
        setConnectionStatus('connected');
        showToast('실시간 데이터 연결됨', 'success');
        // 연결 후 해당 마켓 구독
        if (market) {
          upbitWebSocket.subscribeToMarkets([market]);
        }
      };
      upbitWebSocket.onDisconnect = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 끊김', 'warning');
      };
      upbitWebSocket.onError = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 오류', 'error');
      };

      // 연결 상태 주기적 확인
      const connectionCheckInterval = setInterval(() => {
        const currentState = upbitWebSocket.getConnectionState();
        if (currentState === 'connected' && connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          // 연결 상태가 변경되면 해당 마켓 구독
          if (market) {
            upbitWebSocket.subscribeToMarkets([market]);
          }
        } else if (currentState === 'connecting' && connectionStatus !== 'connecting') {
          setConnectionStatus('connecting');
        } else if (currentState === 'disconnected' && connectionStatus !== 'disconnected') {
          setConnectionStatus('disconnected');
        }
      }, 5000);

      return () => {
        clearInterval(connectionCheckInterval);
        // 컴포넌트 언마운트 시 해당 마켓 구독 해제
        if (market) {
          upbitWebSocket.unsubscribeFromMarkets([market]);
        }
        upbitWebSocket.onTickerUpdate = undefined;
        upbitWebSocket.onConnect = undefined;
        upbitWebSocket.onDisconnect = undefined;
        upbitWebSocket.onError = undefined;
      };
    } else {
      setConnectionStatus('disconnected');
    }
  }, [market, connectionStatus]);

  const handleRefresh = async () => {
    if (!market) return;
    
    try {
      setLoading(true);
      
      // WebSocket이 연결된 상태라면 WebSocket을 통해 최신 데이터 요청
      if (connectionStatus === 'connected') {
        console.log('WebSocket을 통해 최신 데이터 요청:', market);
        // WebSocket을 통해 해당 마켓의 최신 데이터를 받기 위해 구독 갱신
        upbitWebSocket.subscribeToMarkets([market]);
        showToast('실시간 데이터를 요청했습니다.', 'info');
      } else {
        // WebSocket이 연결되지 않은 상태라면 API 호출
        console.log('API를 통해 데이터 새로고침:', market);
        const tickers = await upbitApi.getTicker(market);
        if (tickers.length > 0) {
          setTicker(tickers[0]);
          setLastUpdate(new Date());
          showToast('데이터가 새로고침되었습니다.', 'success');
        }
      }
    } catch (err) {
      showToast('새로고침 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <PageLayout>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>데이터를 불러오는 중...</Typography>
      </PageLayout>
    );
  }

  if (error || !ticker) {
    return (
      <PageLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || '데이터를 찾을 수 없습니다.'}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
      
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="뒤로 가기">
            <IconButton onClick={handleBackClick} color="primary">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" gutterBottom>
              {ticker.market} 현재가 정보
            </Typography>
            <Typography variant="body2" color="text.secondary">
              실시간 현재가 및 거래 정보
            </Typography>
          </Box>
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
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 현재가 상세 정보 */}
      <Grid container spacing={3}>
        {/* 주요 정보 카드 */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              현재가
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <AnimatedPriceTypography variant="h3" change={ticker.change} animation={priceAnimation} sx={{ mb: 1 }}>
                ₩{formatPrice(ticker.trade_price)}
              </AnimatedPriceTypography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                {ticker.change === 'RISE' ? (
                  <TrendingUpIcon color="success" />
                ) : ticker.change === 'FALL' ? (
                  <TrendingDownIcon color="error" />
                ) : (
                  <RemoveIcon color="action" />
                )}
                <ChangeTypography variant="h6" change={ticker.change}>
                  {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                  {(ticker.change_rate * 100).toFixed(2)}%
                </ChangeTypography>
              </Box>
              <ChangeTypography variant="body1" change={ticker.change}>
                {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                ₩{formatPrice(ticker.change_price)}
              </ChangeTypography>
            </Box>
          </Paper>
        </Grid>

        {/* 거래 정보 카드 */}
        <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              거래 정보
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="body2" color="text.secondary">
                  거래량
                </Typography>
                <Typography variant="body1">
                  {formatVolume(ticker.trade_volume)}
                </Typography>
              </Grid>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="body2" color="text.secondary">
                  24시간 거래량
                </Typography>
                <Typography variant="body1">
                  {formatVolume(ticker.acc_trade_volume_24h)}
                </Typography>
              </Grid>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="body2" color="text.secondary">
                  24시간 거래대금
                </Typography>
                <Typography variant="body1">
                  ₩{formatPrice(ticker.acc_trade_price_24h)}
                </Typography>
              </Grid>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="body2" color="text.secondary">
                  전일 종가
                </Typography>
                <Typography variant="body1">
                  ₩{formatPrice(ticker.prev_closing_price)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 고가/저가 정보 카드 */}
        <Grid sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              가격 정보
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      고가
                    </Typography>
                    <PriceTypography variant="h5" change="RISE">
                      ₩{formatPrice(ticker.high_price)}
                    </PriceTypography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      저가
                    </Typography>
                    <PriceTypography variant="h5" change="FALL">
                      ₩{formatPrice(ticker.low_price)}
                    </PriceTypography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      거래 시간
                    </Typography>
                    <Typography variant="body1">
                      {ticker.trade_time}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default CurrentPricePage; 