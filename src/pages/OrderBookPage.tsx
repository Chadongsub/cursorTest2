import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography, 
  Paper, 
  Grid, 
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { upbitWebSocket } from '../services/upbitWebSocket';
import { getUpbitSettings } from '../utils/upbitSettings';
import Toast from '../components/Toast/Toast';
import PageLayout from '../components/Layout/PageLayout';
import OrderBookComponent from '../components/OrderBook/OrderBookComponent';

const OrderBookPage: React.FC = () => {
  const { market } = useParams<{ market: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 새로고침을 위한 키
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

  // WebSocket 호가 업데이트 핸들러
  const handleOrderBookUpdate = (updatedOrderBook: any) => {
    if (updatedOrderBook.market === market) {
      console.log('OrderBookPage에서 호가 업데이트 수신:', updatedOrderBook.market);
      setLastUpdate(new Date());
    }
  };

  // WebSocket 연결
  useEffect(() => {
    const initializeWebSocket = async () => {
      const settings = await getUpbitSettings();
      const { useSocket } = settings;

      if (useSocket && market) {
        // 초기 연결 상태 설정
        setConnectionStatus('connecting');
        
        // WebSocket 이벤트 핸들러 설정
        upbitWebSocket.onOrderBookUpdate = handleOrderBookUpdate;
        upbitWebSocket.onConnect = () => {
          setConnectionStatus('connected');
          console.log('OrderBookPage WebSocket 연결됨');
        };
        upbitWebSocket.onDisconnect = () => {
          setConnectionStatus('disconnected');
          console.log('OrderBookPage WebSocket 연결 끊김');
        };
        upbitWebSocket.onError = () => {
          setConnectionStatus('disconnected');
          console.log('OrderBookPage WebSocket 오류');
        };

        // WebSocket 연결
        upbitWebSocket.connect();
        
        // 호가 데이터 구독
        setTimeout(() => {
          upbitWebSocket.subscribeOrderBook([market]);
        }, 1000);
      } else {
        setConnectionStatus('disconnected');
      }
    };

    initializeWebSocket();

    return () => {
      // 컴포넌트 언마운트 시 이벤트 핸들러 제거
      upbitWebSocket.onOrderBookUpdate = undefined;
      upbitWebSocket.onConnect = undefined;
      upbitWebSocket.onDisconnect = undefined;
      upbitWebSocket.onError = undefined;
    };
  }, [market, handleOrderBookUpdate]);

  const handleRefresh = async () => {
    if (!market) return;
    
    try {
      setLoading(true);
      
      // WebSocket이 연결된 상태라면 WebSocket을 통해 최신 데이터 요청
      if (connectionStatus === 'connected') {
        console.log('WebSocket을 통해 최신 호가 데이터 요청:', market);
        // WebSocket을 통해 해당 마켓의 최신 호가 데이터를 받기 위해 구독 갱신
        upbitWebSocket.subscribeOrderBook([market]);
        showToast('실시간 호가 데이터를 요청했습니다.', 'info');
      } else {
        // WebSocket이 연결되지 않은 상태라면 refreshKey를 증가시켜 API 호출
        console.log('API를 통해 호가 데이터 새로고침:', market);
        setRefreshKey(prev => prev + 1);
        showToast('호가 데이터가 새로고침되었습니다.', 'success');
      }
      
      setLastUpdate(new Date());
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

  if (error || !market) {
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
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontSize: '1.75rem',
                fontWeight: 700,
                mb: 2
              }}
            >
              {market} 호가
            </Typography>
            <Typography variant="body2" color="text.secondary">
              실시간 호가 및 거래 정보
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

      {/* 호가 정보 */}
      <Grid container spacing={3}>
        <Grid sx={{ width: '100%' }}>
          <Paper sx={{ p: 3 }}>
            <OrderBookComponent market={market} refreshKey={refreshKey} />
          </Paper>
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default OrderBookPage; 