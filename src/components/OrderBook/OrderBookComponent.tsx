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
  refreshKey?: number;
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

const OrderBookComponent: React.FC<OrderBookComponentProps> = ({ market, refreshKey = 0 }) => {
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
  }, [market, refreshKey]);

  // WebSocket 호가 업데이트 핸들러
  const handleOrderBookUpdate = (updatedOrderBook: any) => {
    if (updatedOrderBook.market === market) {
      console.log('OrderBookComponent에서 호가 업데이트 수신:', updatedOrderBook.market, '호가 단위 수:', updatedOrderBook.orderbook_units?.length || 0);
      setOrderBook(updatedOrderBook);
    }
  };

  // WebSocket 연결
  useEffect(() => {
    const initializeWebSocket = async () => {
      const settings = await getUpbitSettings();
      const { useSocket } = settings;

      console.log('OrderBookComponent WebSocket 설정:', { useSocket, market });

      if (useSocket && market) {
        // 초기 연결 상태 설정
        setConnectionStatus('connecting');
        
        // WebSocket 이벤트 핸들러 설정
        upbitWebSocket.onOrderBookUpdate = handleOrderBookUpdate;
        upbitWebSocket.onConnect = () => {
          setConnectionStatus('connected');
          console.log('OrderBook WebSocket 연결됨');
        };
        upbitWebSocket.onDisconnect = () => {
          setConnectionStatus('disconnected');
          console.log('OrderBook WebSocket 연결 끊김');
        };
        upbitWebSocket.onError = () => {
          setConnectionStatus('disconnected');
          console.log('OrderBook WebSocket 오류');
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