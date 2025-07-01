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
  TrendingDown
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TradingSignals from '../components/TradingSignals/TradingSignals';
import TradingSettings from '../components/TradingSettings/TradingSettings';
import { TradingAlgorithm, TradingSignal, TradingConfig } from '../services/tradingAlgorithm';
import { upbitWebSocket } from '../services/upbitWebSocket';

const TradingPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<TradingAlgorithm | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markets, setMarkets] = useState<string[]>(['KRW-BTC', 'KRW-ETH', 'KRW-XRP']);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [config, setConfig] = useState<TradingConfig>({
    shortPeriod: 5,
    longPeriod: 20,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    minConfidence: 0.3
  });

  // 알고리즘 초기화
  useEffect(() => {
    const newAlgorithm = new TradingAlgorithm(config);
    setAlgorithm(newAlgorithm);
  }, [config]);

  // 마켓 데이터 초기화
  useEffect(() => {
    const initMarkets = async () => {
      try {
        // 업비트에서 사용 가능한 모든 KRW 마켓 가져오기
        const marketList = [
          'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOGE', 'KRW-MATIC', 
          'KRW-DOT', 'KRW-LTC', 'KRW-BCH', 'KRW-LINK', 'KRW-UNI', 'KRW-ATOM',
          'KRW-SOL', 'KRW-AVAX', 'KRW-TRX', 'KRW-NEAR', 'KRW-ALGO', 'KRW-VET',
          'KRW-FLOW', 'KRW-AAVE', 'KRW-ICP', 'KRW-FIL', 'KRW-APT', 'KRW-OP',
          'KRW-ARB', 'KRW-MKR', 'KRW-SNX', 'KRW-COMP', 'KRW-CRV', 'KRW-YFI'
        ];
        setAvailableMarkets(marketList);
      } catch (error) {
        console.error('마켓 초기화 실패:', error);
      }
    };
    
    initMarkets();
  }, []);

  // 실시간 데이터 처리
  useEffect(() => {
    if (!algorithm || !isRunning) return;

    const handleTicker = (data: any) => {
      if (data.type === 'ticker' && data.trade_price) {
        algorithm.addPriceData(data.code, data.trade_price, Date.now());
        
        // 신호 생성
        const newSignal = algorithm.generateSignal(data.code);
        if (newSignal) {
          setSignals(prev => {
            const combined = [...prev, newSignal];
            // 최근 100개 신호만 유지
            return combined.slice(-100);
          });
        }
      }
    };

    // WebSocket 연결
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

  // 알고리즘 시작/중지
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
            트레이딩 알고리즘
          </Typography>

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
      <TradingSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onConfigChange={handleSettingsChange}
        selectedMarkets={markets}
        onMarketsChange={setMarkets}
        availableMarkets={availableMarkets}
      />
    </Box>
  );
};

export default TradingPage; 