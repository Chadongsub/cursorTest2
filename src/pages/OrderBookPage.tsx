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
    const settings = getUpbitSettings();
    const { useSocket } = settings;

    if (useSocket && market) {
      // 초기 연결 상태 설정
      const currentState = upbitWebSocket.getConnectionState();
      if (currentState === 'connecting') {
        setConnectionStatus('connecting');
      } else if (currentState === 'connected') {
        setConnectionStatus('connected');
        // 이미 연결된 상태라면 해당 마켓 호가 구독
        upbitWebSocket.subscribeOrderBook([market]);
      } else {
        setConnectionStatus('disconnected');
        // 연결되지 않은 상태라면 연결 시도
        upbitWebSocket.connect();
      }

      // WebSocket 이벤트 핸들러 설정
      upbitWebSocket.onOrderBookUpdate = handleOrderBookUpdate;
      upbitWebSocket.onConnect = () => {
        setConnectionStatus('connected');
        showToast('실시간 데이터 연결됨', 'success');
        // 연결 후 해당 마켓 호가 구독
        if (market) {
          upbitWebSocket.subscribeOrderBook([market]);
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
          // 연결 상태가 변경되면 해당 마켓 호가 구독
          if (market) {
            upbitWebSocket.subscribeOrderBook([market]);
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
          upbitWebSocket.unsubscribeOrderBook([market]);
        }
        upbitWebSocket.onOrderBookUpdate = undefined;
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
      // 호가 데이터는 OrderBookComponent에서 자체적으로 처리하므로
      // 여기서는 연결 상태만 확인
      setLastUpdate(new Date());
      showToast('데이터가 새로고침되었습니다.', 'success');
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
            <Typography variant="h5" gutterBottom>
              {market} 호가 정보
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
            <OrderBookComponent market={market} />
          </Paper>
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default OrderBookPage; 