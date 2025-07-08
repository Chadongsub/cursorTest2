import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  AutoAwesome as AutoTradingIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { mockTradingService, AutoTradingConfig, AutoTradingResult } from '../../services/mockTradingService';
import { upbitApi } from '../../services/upbit';

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

interface AlgorithmTabsProps {
  onConfigChange?: (config: AutoTradingConfig) => void;
}

const AlgorithmTabs: React.FC<AlgorithmTabsProps> = ({ onConfigChange }) => {
  const [activeAlgorithm, setActiveAlgorithm] = useState<'ma_rsi' | 'bollinger' | 'stochastic'>('ma_rsi');
  const [config, setConfig] = useState<AutoTradingConfig>({
    enabled: false,
    algorithm: 'ma_rsi',
    markets: ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'],
    investmentAmount: 100000,
    maxPositions: 5,
    stopLoss: 5,
    takeProfit: 10
  });
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [marketDialog, setMarketDialog] = useState({
    open: false,
    selectedMarkets: [] as string[]
  });
  const [results, setResults] = useState<AutoTradingResult[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadConfig();
    loadAvailableMarkets();
    loadResults();
  }, [activeAlgorithm]);

  const loadConfig = () => {
    const savedConfig = mockTradingService.getAutoTradingConfig();
    setConfig(savedConfig);
  };

  const loadAvailableMarkets = async () => {
    try {
      const markets = await upbitApi.getMarkets();
      const krwMarkets = markets
        .filter(market => market.market.startsWith('KRW-'))
        .map(market => market.market);
      setAvailableMarkets(krwMarkets);
    } catch (error) {
      console.error('마켓 목록 로드 실패:', error);
    }
  };

  const loadResults = () => {
    const autoResults = mockTradingService.getAutoTradingResults();
    // 현재 선택된 알고리즘의 결과만 필터링
    const filteredResults = autoResults.filter(result => {
      // 결과에 알고리즘 정보가 없으므로 시간순으로 최근 결과만 표시
      return true;
    });
    setResults(filteredResults);
  };

  const handleConfigChange = (updates: Partial<AutoTradingConfig>) => {
    const newConfig = { ...config, ...updates, algorithm: activeAlgorithm };
    setConfig(newConfig);
    mockTradingService.updateAutoTradingConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleMarketSelect = () => {
    setMarketDialog({
      open: true,
      selectedMarkets: [...config.markets]
    });
  };

  const handleMarketConfirm = () => {
    handleConfigChange({ markets: marketDialog.selectedMarkets });
    setMarketDialog({ ...marketDialog, open: false });
  };

  const handleMarketToggle = (market: string) => {
    const selected = marketDialog.selectedMarkets.includes(market);
    const newSelected = selected
      ? marketDialog.selectedMarkets.filter(m => m !== market)
      : [...marketDialog.selectedMarkets, market];
    
    setMarketDialog({
      ...marketDialog,
      selectedMarkets: newSelected
    });
  };

  const handleSelectAll = () => {
    setMarketDialog({
      ...marketDialog,
      selectedMarkets: [...availableMarkets]
    });
  };

  const handleDeselectAll = () => {
    setMarketDialog({
      ...marketDialog,
      selectedMarkets: []
    });
  };

  const handleAlgorithmChange = (event: React.SyntheticEvent, newValue: number) => {
    const algorithms: ('ma_rsi' | 'bollinger' | 'stochastic')[] = ['ma_rsi', 'bollinger', 'stochastic'];
    setActiveAlgorithm(algorithms[newValue]);
  };

  const getAlgorithmName = (algorithm: string) => {
    const names: { [key: string]: string } = {
      'ma_rsi': '이동평균 + RSI',
      'bollinger': '볼린저 밴드',
      'stochastic': '스토캐스틱'
    };
    return names[algorithm] || algorithm;
  };

  const getAlgorithmDescription = (algorithm: string) => {
    const descriptions: { [key: string]: string } = {
      'ma_rsi': '단기/장기 이동평균 크로스오버와 RSI 과매수/과매도 신호를 결합한 알고리즘',
      'bollinger': '볼린저 밴드의 상단/하단 터치 시 매수/매도 신호를 생성하는 알고리즘',
      'stochastic': '스토캐스틱 %K 값이 20 이하/80 이상일 때 매수/매도 신호를 생성하는 알고리즘'
    };
    return descriptions[algorithm] || '';
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

  const getStats = () => {
    const totalSignals = results.length;
    const buySignals = results.filter(r => r.signal === 'buy').length;
    const sellSignals = results.filter(r => r.signal === 'sell').length;
    const avgConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
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
      {/* 알고리즘 탭 네비게이션 */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={['ma_rsi', 'bollinger', 'stochastic'].indexOf(activeAlgorithm)} 
              onChange={handleAlgorithmChange} 
              variant="fullWidth"
            >
              <Tab 
                icon={<AutoTradingIcon />} 
                label="이동평균 + RSI" 
                iconPosition="start"
              />
              <Tab 
                icon={<AutoTradingIcon />} 
                label="볼린저 밴드" 
                iconPosition="start"
              />
              <Tab 
                icon={<AutoTradingIcon />} 
                label="스토캐스틱" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* 알고리즘 설명 */}
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>
              {getAlgorithmName(activeAlgorithm)}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {getAlgorithmDescription(activeAlgorithm)}
            </Typography>
          </Box>

          {/* 설정 탭 */}
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                알고리즘 설정
              </Typography>
              <FormControlLabel
                control={
                  <Button
                    variant={config.enabled ? "contained" : "outlined"}
                    color={config.enabled ? "success" : "primary"}
                    size="small"
                    onClick={() => handleConfigChange({ enabled: !config.enabled })}
                  >
                    {config.enabled ? '활성화됨' : '비활성화됨'}
                  </Button>
                }
                label=""
              />
            </Box>

            {config.enabled && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {getAlgorithmName(activeAlgorithm)} 알고리즘이 활성화되었습니다. 설정된 조건에 따라 자동으로 거래가 실행됩니다.
              </Alert>
            )}

            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex="1" minWidth="300px">
                <TextField
                  fullWidth
                  margin="normal"
                  label="투자 금액 (원)"
                  type="number"
                  value={config.investmentAmount}
                  onChange={(e) => handleConfigChange({ investmentAmount: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 1000, step: 1000 }}
                />
              </Box>

              <Box flex="1" minWidth="300px">
                <TextField
                  fullWidth
                  margin="normal"
                  label="최대 포지션 수"
                  type="number"
                  value={config.maxPositions}
                  onChange={(e) => handleConfigChange({ maxPositions: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Box>

              <Box flex="1" minWidth="300px">
                <TextField
                  fullWidth
                  margin="normal"
                  label="손절 비율 (%)"
                  type="number"
                  value={config.stopLoss}
                  onChange={(e) => handleConfigChange({ stopLoss: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 50, step: 0.1 }}
                />
              </Box>

              <Box flex="1" minWidth="300px">
                <TextField
                  fullWidth
                  margin="normal"
                  label="익절 비율 (%)"
                  type="number"
                  value={config.takeProfit}
                  onChange={(e) => handleConfigChange({ takeProfit: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Box>

              <Box width="100%">
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                    거래 마켓 ({config.markets.length}개 선택)
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {config.markets.map(market => (
                      <Chip
                        key={market}
                        label={market.replace('KRW-', '')}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={handleMarketSelect}
                    size="small"
                  >
                    마켓 선택
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 결과 탭 */}
          <Box sx={{ p: 3, pt: 0 }}>
            <Divider sx={{ mb: 3 }} />
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                거래 신호 결과
              </Typography>
              <Tooltip title="새로고침">
                <IconButton onClick={loadResults} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* 통계 */}
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
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

            {/* 결과 테이블 */}
            {results.length === 0 ? (
              <Alert severity="info">
                {getAlgorithmName(activeAlgorithm)} 알고리즘의 거래 신호 결과가 없습니다.
              </Alert>
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
                    {results.slice().reverse().slice(0, 20).map((result, index) => (
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
          </Box>
        </CardContent>
      </Card>

      {/* 마켓 선택 다이얼로그 */}
      <Dialog 
        open={marketDialog.open} 
        onClose={() => setMarketDialog({ ...marketDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>거래 마켓 선택</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {getAlgorithmName(activeAlgorithm)} 알고리즘에 사용할 마켓을 선택하세요.
          </Typography>
          
          {/* 전체선택/전체취소 버튼 */}
          <Box display="flex" gap={1} mb={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSelectAll}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              전체선택
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDeselectAll}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              전체취소
            </Button>
            <Box flex="1" />
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              {marketDialog.selectedMarkets.length} / {availableMarkets.length} 선택됨
            </Typography>
          </Box>

          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {availableMarkets.map(market => {
                const isSelected = marketDialog.selectedMarkets.includes(market);
                return (
                  <Box key={market} flex="1" minWidth="120px">
                    <Chip
                      label={market.replace('KRW-', '')}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                      onClick={() => handleMarketToggle(market)}
                      sx={{ width: '100%', mb: 1 }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarketDialog({ ...marketDialog, open: false })}>
            취소
          </Button>
          <Button onClick={handleMarketConfirm} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlgorithmTabs; 