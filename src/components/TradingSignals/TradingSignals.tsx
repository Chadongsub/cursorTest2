import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Info,
  Refresh,
  Settings
} from '@mui/icons-material';
import { TradingSignal, TradingAlgorithm } from '../../services/tradingAlgorithm';

interface TradingSignalsProps {
  signals: TradingSignal[];
  onRefresh?: () => void;
  onSettings?: () => void;
}

const TradingSignals: React.FC<TradingSignalsProps> = ({
  signals,
  onRefresh,
  onSettings
}) => {
  const [filteredSignals, setFilteredSignals] = useState<TradingSignal[]>([]);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    if (filter === 'all') {
      setFilteredSignals(signals);
    } else {
      setFilteredSignals(signals.filter(signal => signal.signal === filter));
    }
  }, [signals, filter]);

  const getSignalColor = (signal: 'buy' | 'sell' | 'hold') => {
    switch (signal) {
      case 'buy':
        return 'success';
      case 'sell':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSignalIcon = (signal: 'buy' | 'sell' | 'hold') => {
    switch (signal) {
      case 'buy':
        return <TrendingUp />;
      case 'sell':
        return <TrendingDown />;
      default:
        return <Remove />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMarketDisplayName = (market: string) => {
    return market.replace('KRW-', '');
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            트레이딩 신호
          </Typography>
          <Box>
            <Tooltip title="설정">
              <IconButton size="small" onClick={onSettings}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="새로고침">
              <IconButton size="small" onClick={onRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 필터 버튼 */}
        <Box display="flex" gap={1} mb={2}>
          <Chip
            label="전체"
            variant={filter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter('all')}
            size="small"
          />
          <Chip
            label="매수"
            variant={filter === 'buy' ? 'filled' : 'outlined'}
            color="success"
            onClick={() => setFilter('buy')}
            size="small"
          />
          <Chip
            label="매도"
            variant={filter === 'sell' ? 'filled' : 'outlined'}
            color="error"
            onClick={() => setFilter('sell')}
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 신호 요약 */}
        <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box textAlign="center" flex={1}>
            <Typography variant="h6" color="success.main">
              {signals.filter(s => s.signal === 'buy').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              매수 신호
            </Typography>
          </Box>
          <Box textAlign="center" flex={1}>
            <Typography variant="h6" color="error.main">
              {signals.filter(s => s.signal === 'sell').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              매도 신호
            </Typography>
          </Box>
          <Box textAlign="center" flex={1}>
            <Typography variant="h6" color="primary.main">
              {signals.length > 0 
                ? (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length * 100).toFixed(1)
                : '0'
              }%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              평균 신뢰도
            </Typography>
          </Box>
        </Box>

        {/* 신호 목록 */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>코인</TableCell>
                <TableCell>신호</TableCell>
                <TableCell>가격</TableCell>
                <TableCell>신뢰도</TableCell>
                <TableCell>시간</TableCell>
                <TableCell>상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSignals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      신호가 없습니다
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSignals.map((signal, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {getMarketDisplayName(signal.market)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getSignalIcon(signal.signal)}
                        label={signal.signal === 'buy' ? '매수' : signal.signal === 'sell' ? '매도' : '보유'}
                        color={getSignalColor(signal.signal) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatPrice(signal.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={signal.confidence * 100}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                          color={signal.confidence > 0.7 ? 'success' : signal.confidence > 0.4 ? 'warning' : 'error'}
                        />
                        <Typography variant="caption">
                          {formatConfidence(signal.confidence)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatTime(signal.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={signal.reason}>
                        <IconButton size="small">
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TradingSignals; 