import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  TrendingUp,
  TrendingDown,
  Settings
} from '@mui/icons-material';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import TradingSignals from '../../components/TradingSignals/TradingSignals';
import AlgorithmSettings from '../../components/TradingSettings/AlgorithmSettings';
import { TradingAlgorithm, TradingSignal, TradingConfig } from '../../services/tradingAlgorithm';
import { upbitWebSocket } from '../../services/upbitWebSocket';

const BollingerPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<TradingAlgorithm | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markets, setMarkets] = useState<string[]>(['KRW-BTC', 'KRW-ETH', 'KRW-XRP']);
  const [config, setConfig] = useState<TradingConfig>({
    algorithmType: 'bollinger',
    shortPeriod: 5,
    longPeriod: 20,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    stochasticKPeriod: 14,
    stochasticDPeriod: 3,
    minConfidence: 0.3
  });

  // 알고리즘 초기화
  useEffect(() => {
    const newAlgorithm = new TradingAlgorithm(config);
    setAlgorithm(newAlgorithm);
  }, [config]);

  // 실시간 데이터 처리
  useEffect(() => {
    if (!algorithm || !isRunning) return;

    const handleTicker = (data: any) => {
      if (data.type === 'ticker' && data.trade_price) {
        algorithm.addPriceData(data.code, data.trade_price, Date.now());
        
        const newSignal = algorithm.generateSignal(data.code);
        if (newSignal) {
          setSignals(prev => {
            const combined = [...prev, newSignal];
            return combined.slice(-100);
          });
        }
      }
    };

    if (isRunning) {
      upbitWebSocket.subscribeToMarkets(markets);
      upbitWebSocket.onTickerUpdate = handleTicker;
    }

    return () => {
      if (isRunning) {
        upbitWebSocket.unsubscribeFromMarkets(markets);
        upbitWebSocket.onTickerUpdate = undefined;
      }
    };
  }, [algorithm, isRunning, markets]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleRefresh = useCallback(() => {
    if (algorithm) {
      const newSignals = algorithm.generateAllSignals(markets);
      setSignals(newSignals);
    }
  }, [algorithm, markets]);

  const handleSettingsChange = useCallback((newConfig: TradingConfig) => {
    setConfig(newConfig);
    const newAlgorithm = new TradingAlgorithm(newConfig);
    setAlgorithm(newAlgorithm);
  }, []);

  const getStatusColor = () => {
    return isRunning ? 'success' : 'error';
  };

  const getStatusText = () => {
    return isRunning ? '실행 중' : '중지됨';
  };

  const getSignalSummary = () => {
    const buySignals = signals.filter(s => s.signal === 'buy').length;
    const sellSignals = signals.filter(s => s.signal === 'sell').length;
    const totalSignals = signals.length;
    
    return { buySignals, sellSignals, totalSignals };
  };

  const summary = getSignalSummary();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Typography variant="h4" component="h1" fontWeight="bold" mb={3}>
            볼린저 밴드 알고리즘
          </Typography>

          {/* 알고리즘 설명 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" mb={2}>
                알고리즘 설명
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                볼린저 밴드의 상단/하단 터치를 이용한 평균회귀 전략입니다.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip label="평균회귀" color="primary" variant="outlined" />
                <Chip label="변동성 활용" color="secondary" variant="outlined" />
                <Chip label="밴드 터치" color="success" variant="outlined" />
                <Chip label="표준편차" color="warning" variant="outlined" />
              </Box>
            </CardContent>
          </Card>

          {/* 상태 및 컨트롤 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" fontWeight="medium">
                    알고리즘 상태
                  </Typography>
                  <Chip
                    icon={isRunning ? <TrendingUp /> : <TrendingDown />}
                    label={getStatusText()}
                    color={getStatusColor() as any}
                    variant="outlined"
                  />
                  {isRunning && <CircularProgress size={20} />}
                </Box>
                
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={handleStart}
                    disabled={isRunning}
                  >
                    시작
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleStop}
                    disabled={!isRunning}
                  >
                    중지
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                  >
                    새로고침
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    onClick={() => setSettingsOpen(true)}
                  >
                    설정
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 신호 요약 */}
              <Box display="flex" justifyContent="space-between">
                <Box textAlign="center" flex={1}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {summary.buySignals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    매수 신호
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {summary.sellSignals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    매도 신호
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {summary.totalSignals}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 신호
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {markets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    모니터링 마켓
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 현재 설정 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" mb={2}>
                현재 설정
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2" color="text.secondary">밴드 기간</Typography>
                  <Typography variant="h6">{config.bollingerPeriod}일</Typography>
                </Box>
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2" color="text.secondary">표준편차</Typography>
                  <Typography variant="h6">{config.bollingerStdDev}</Typography>
                </Box>
                <Box flex={1} minWidth={200}>
                  <Typography variant="body2" color="text.secondary">최소 신뢰도</Typography>
                  <Typography variant="h6">{(config.minConfidence * 100).toFixed(0)}%</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 알림 */}
          {!isRunning && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                알고리즘이 중지되어 있습니다. 시작 버튼을 눌러 실시간 신호 생성을 시작하세요.
              </Typography>
            </Alert>
          )}

          {signals.length === 0 && isRunning && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                아직 신호가 생성되지 않았습니다. 충분한 가격 데이터가 수집되면 신호가 표시됩니다.
              </Typography>
            </Alert>
          )}

          {/* 트레이딩 신호 */}
          <TradingSignals
            signals={signals}
            onRefresh={handleRefresh}
            onSettings={() => setSettingsOpen(true)}
          />
        </Box>
      </Box>

      {/* 설정 다이얼로그 */}
      <AlgorithmSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onConfigChange={handleSettingsChange}
        algorithmType="bollinger"
      />
    </Box>
  );
};

export default BollingerPage; 