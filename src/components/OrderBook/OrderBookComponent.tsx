import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { upbitApi } from '../../services/upbit';
import { upbitWebSocket } from '../../services/upbitWebSocket';
import { getUpbitSettings } from '../../utils/upbitSettings';

interface OrderBookData {
  market: string;
  orderbook_units: Array<{
    ask_price: number;
    bid_price: number;
    ask_size: number;
    bid_size: number;
  }>;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
}

interface OrderBookComponentProps {
  market: string;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const PriceCell = styled(TableCell)<{ type: 'ask' | 'bid' }>(({ theme, type }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 'bold',
  color: type === 'ask' ? theme.palette.error.main : theme.palette.success.main,
}));

const SizeCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  textAlign: 'right',
}));

const OrderBookComponent: React.FC<OrderBookComponentProps> = ({ market }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatSize = (size: number) => {
    if (size >= 1000000) {
      return `${(size / 1000000).toFixed(2)}M`;
    } else if (size >= 1000) {
      return `${(size / 1000).toFixed(2)}K`;
    }
    return size.toFixed(4);
  };

  // 초기 호가 데이터 로드
  useEffect(() => {
    const loadOrderBook = async () => {
      if (!market) return;
      
      try {
        setLoading(true);
        const orderBookData = await upbitApi.getOrderBook(market);
        if (orderBookData.length > 0) {
          setOrderBook(orderBookData[0]);
        }
      } catch (err) {
        setError('호가 데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching orderbook data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrderBook();
  }, [market]);

  // WebSocket 호가 업데이트 핸들러
  const handleOrderBookUpdate = (updatedOrderBook: any) => {
    if (updatedOrderBook.market === market) {
      setOrderBook(updatedOrderBook);
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
        // 이미 연결된 상태라면 해당 마켓 구독
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
        // 연결 후 해당 마켓 구독
        if (market) {
          upbitWebSocket.subscribeOrderBook([market]);
        }
      };
      upbitWebSocket.onDisconnect = () => {
        setConnectionStatus('disconnected');
      };
      upbitWebSocket.onError = () => {
        setConnectionStatus('disconnected');
      };

      // 연결 상태 주기적 확인
      const connectionCheckInterval = setInterval(() => {
        const currentState = upbitWebSocket.getConnectionState();
        if (currentState === 'connected' && connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          // 연결 상태가 변경되면 해당 마켓 구독
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

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>호가 데이터를 불러오는 중...</Typography>
      </Box>
    );
  }

  if (error || !orderBook) {
    return (
      <Alert severity="error">
        {error || '호가 데이터를 찾을 수 없습니다.'}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">호가 정보</Typography>
        <Chip
          label={connectionStatus === 'connected' ? '실시간' : '정적'}
          color={connectionStatus === 'connected' ? 'success' : 'default'}
          size="small"
        />
      </Box>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>매도잔량</StyledTableCell>
              <StyledTableCell>매도가격</StyledTableCell>
              <StyledTableCell>매수가격</StyledTableCell>
              <StyledTableCell>매수잔량</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderBook.orderbook_units.slice(0, 10).map((unit, index) => (
              <TableRow key={index} hover>
                <SizeCell>{formatSize(unit.ask_size)}</SizeCell>
                <PriceCell type="ask">{formatPrice(unit.ask_price)}</PriceCell>
                <PriceCell type="bid">{formatPrice(unit.bid_price)}</PriceCell>
                <SizeCell>{formatSize(unit.bid_size)}</SizeCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'text.secondary' }}>
        <Typography variant="body2">
          총 매도잔량: {formatSize(orderBook.total_ask_size)}
        </Typography>
        <Typography variant="body2">
          총 매수잔량: {formatSize(orderBook.total_bid_size)}
        </Typography>
      </Box>
    </Box>
  );
};

export default OrderBookComponent; 