import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { mockTradingService, AutoTradingResult } from '../../services/mockTradingService';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const SignalCell = styled(TableCell)<{ signal: 'buy' | 'sell' | 'hold' }>(({ theme, signal }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 'bold',
  color: signal === 'buy' ? theme.palette.success.main : 
         signal === 'sell' ? theme.palette.error.main : 
         theme.palette.text.secondary,
}));

const ConfidenceCell = styled(TableCell)<{ confidence: number }>(({ theme, confidence }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 'bold',
  color: confidence >= 0.8 ? theme.palette.success.main :
         confidence >= 0.6 ? theme.palette.warning.main :
         theme.palette.error.main,
}));

interface AutoTradingResultsProps {
  refreshKey?: number;
}

const AutoTradingResults: React.FC<AutoTradingResultsProps> = ({ refreshKey = 0 }) => {
  const [results, setResults] = useState<AutoTradingResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AutoTradingResult[]>([]);
  const [filters, setFilters] = useState({
    market: 'all',
    signal: 'all',
    minConfidence: 0
  });

  useEffect(() => {
    loadResults();
  }, [refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [results, filters]);

  const loadResults = () => {
    const autoResults = mockTradingService.getAutoTradingResults();
    setResults(autoResults);
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (filters.market !== 'all') {
      filtered = filtered.filter(result => result.market === filters.market);
    }

    if (filters.signal !== 'all') {
      filtered = filtered.filter(result => result.signal === filters.signal);
    }

    if (filters.minConfidence > 0) {
      filtered = filtered.filter(result => result.confidence >= filters.minConfidence);
    }

    setFilteredResults(filtered);
  };

  const getSignalIcon = (signal: 'buy' | 'sell' | 'hold') => {
    switch (signal) {
      case 'buy':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'sell':
        return <TrendingDownIcon color="error" fontSize="small" />;
      default:
        return <RemoveIcon color="action" fontSize="small" />;
    }
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueMarkets = () => {
    const markets = results.map(result => result.market);
    return ['all', ...Array.from(new Set(markets))];
  };

  const getStats = () => {
    const totalSignals = filteredResults.length;
    const buySignals = filteredResults.filter(r => r.signal === 'buy').length;
    const sellSignals = filteredResults.filter(r => r.signal === 'sell').length;
    const avgConfidence = filteredResults.length > 0 
      ? filteredResults.reduce((sum, r) => sum + r.confidence, 0) / filteredResults.length 
      : 0;

    return {
      totalSignals,
      buySignals,
      sellSignals,
      avgConfidence
    };
  };

  const stats = getStats();

  return (
    <Box>
      {/* 필터 및 통계 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              자동 거래 결과
            </Typography>
            <Tooltip title="새로고침">
              <IconButton onClick={loadResults} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
            <Box flex="1" minWidth="200px">
              <FormControl fullWidth size="small">
                <InputLabel>마켓</InputLabel>
                <Select
                  value={filters.market}
                  onChange={(e) => setFilters({ ...filters, market: e.target.value })}
                  label="마켓"
                >
                  {getUniqueMarkets().map(market => (
                    <MenuItem key={market} value={market}>
                      {market === 'all' ? '전체' : market.replace('KRW-', '')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box flex="1" minWidth="200px">
              <FormControl fullWidth size="small">
                <InputLabel>신호</InputLabel>
                <Select
                  value={filters.signal}
                  onChange={(e) => setFilters({ ...filters, signal: e.target.value as any })}
                  label="신호"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="buy">매수</MenuItem>
                  <MenuItem value="sell">매도</MenuItem>
                  <MenuItem value="hold">보유</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                size="small"
                label="최소 신뢰도"
                type="number"
                value={filters.minConfidence}
                onChange={(e) => setFilters({ ...filters, minConfidence: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
              />
            </Box>
            <Box flex="1" minWidth="200px" display="flex" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                결과: {filteredResults.length}개
              </Typography>
            </Box>
          </Box>

          {/* 통계 */}
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1" minWidth="150px" textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="primary">
                {stats.totalSignals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 신호
              </Typography>
            </Box>
            <Box flex="1" minWidth="150px" textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {stats.buySignals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                매수 신호
              </Typography>
            </Box>
            <Box flex="1" minWidth="150px" textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {stats.sellSignals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                매도 신호
              </Typography>
            </Box>
            <Box flex="1" minWidth="150px" textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="info.main">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                평균 신뢰도
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 결과 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            거래 신호 내역
          </Typography>
          
          {filteredResults.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                자동 거래 결과가 없습니다.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>시간</StyledTableCell>
                    <StyledTableCell>마켓</StyledTableCell>
                    <StyledTableCell>신호</StyledTableCell>
                    <StyledTableCell>가격</StyledTableCell>
                    <StyledTableCell>신뢰도</StyledTableCell>
                    <StyledTableCell>사유</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults.slice().reverse().map((result, index) => (
                    <TableRow key={index} hover>
                      <StyledTableCell>
                        {formatDateTime(result.timestamp)}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Chip 
                          label={result.market.replace('KRW-', '')} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </StyledTableCell>
                      <SignalCell signal={result.signal}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {getSignalIcon(result.signal)}
                          <Chip
                            label={result.signal === 'buy' ? '매수' : result.signal === 'sell' ? '매도' : '보유'}
                            color={getSignalColor(result.signal) as any}
                            size="small"
                            variant="filled"
                          />
                        </Box>
                      </SignalCell>
                      <StyledTableCell>
                        {formatPrice(result.price)}원
                      </StyledTableCell>
                      <ConfidenceCell confidence={result.confidence}>
                        {(result.confidence * 100).toFixed(1)}%
                      </ConfidenceCell>
                      <StyledTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {result.reason}
                        </Typography>
                      </StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoTradingResults; 