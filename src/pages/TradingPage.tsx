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
import { upbitApi } from '../services/upbit';

const TradingPage: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<TradingAlgorithm | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markets, setMarkets] = useState<string[]>([
    'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOGE', 'KRW-MATIC', 
    'KRW-DOT', 'KRW-LTC', 'KRW-BCH', 'KRW-LINK', 'KRW-UNI', 'KRW-ATOM',
    'KRW-SOL', 'KRW-AVAX', 'KRW-TRX', 'KRW-NEAR', 'KRW-ALGO', 'KRW-VET',
    'KRW-FLOW', 'KRW-AAVE', 'KRW-ICP', 'KRW-FIL', 'KRW-APT', 'KRW-OP',
    'KRW-ARB', 'KRW-MKR', 'KRW-SNX', 'KRW-COMP', 'KRW-CRV', 'KRW-YFI'
  ]);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [config, setConfig] = useState<TradingConfig>({
    algorithmType: 'ma_rsi',
    shortPeriod: 5,
    longPeriod: 20,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    stochasticKPeriod: 14,
    stochasticDPeriod: 3,
    minConfidence: 0.1
  });

  // 알고리즘 초기화
  useEffect(() => {
    const newAlgorithm = new TradingAlgorithm(config);
    setAlgorithm(newAlgorithm);
  }, [config]);

  // WebSocket 연결 및 마켓 데이터 초기화
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        // WebSocket 이벤트 핸들러 설정
        upbitWebSocket.onConnect = () => {
          setConnectionStatus('connected');
          console.log('트레이딩 페이지 WebSocket 연결됨');
        };
        
        upbitWebSocket.onDisconnect = () => {
          setConnectionStatus('disconnected');
          console.log('트레이딩 페이지 WebSocket 연결 끊김');
        };
        
        upbitWebSocket.onError = () => {
          setConnectionStatus('disconnected');
          console.log('트레이딩 페이지 WebSocket 오류');
        };

        // WebSocket 연결
        setConnectionStatus('connecting');
        upbitWebSocket.connect();

        // 연결 후 기본 마켓들 구독하여 마켓 정보 수집
        setTimeout(() => {
          const defaultMarkets = [
            'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOGE', 'KRW-MATIC', 
            'KRW-DOT', 'KRW-LTC', 'KRW-BCH', 'KRW-LINK', 'KRW-UNI', 'KRW-ATOM',
            'KRW-SOL', 'KRW-AVAX', 'KRW-TRX', 'KRW-NEAR', 'KRW-ALGO', 'KRW-VET',
            'KRW-FLOW', 'KRW-AAVE', 'KRW-ICP', 'KRW-FIL', 'KRW-APT', 'KRW-OP',
            'KRW-ARB', 'KRW-MKR', 'KRW-SNX', 'KRW-COMP', 'KRW-CRV', 'KRW-YFI'
          ];
          
          upbitWebSocket.subscribeToMarkets(defaultMarkets);
          setAvailableMarkets(defaultMarkets);
        }, 2000);

      } catch (error) {
        console.error('WebSocket 초기화 실패:', error);
        setConnectionStatus('disconnected');
        
        // WebSocket 연결 실패 시 기본 마켓 리스트 사용
        const fallbackMarkets = [
          'KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOGE', 'KRW-MATIC', 
          'KRW-DOT', 'KRW-LTC', 'KRW-BCH', 'KRW-LINK', 'KRW-UNI', 'KRW-ATOM',
          'KRW-SOL', 'KRW-AVAX', 'KRW-TRX', 'KRW-NEAR', 'KRW-ALGO', 'KRW-VET',
          'KRW-FLOW', 'KRW-AAVE', 'KRW-ICP', 'KRW-FIL', 'KRW-APT', 'KRW-OP',
          'KRW-ARB', 'KRW-MKR', 'KRW-SNX', 'KRW-COMP', 'KRW-CRV', 'KRW-YFI'
        ];
        setAvailableMarkets(fallbackMarkets);
      }
    };
    
    initWebSocket();

    // 컴포넌트 언마운트 시 정리
    return () => {
      upbitWebSocket.onConnect = undefined;
      upbitWebSocket.onDisconnect = undefined;
      upbitWebSocket.onError = undefined;
    };
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
            통합 트레이딩 알고리즘
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
                  
                  {/* WebSocket 연결 상태 */}
                  <Chip
                    label={`WebSocket: ${connectionStatus === 'connected' ? '연결됨' : connectionStatus === 'connecting' ? '연결 중' : '연결 끊김'}`}
                    color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={handleStart}
                    disabled={isRunning || connectionStatus !== 'connected'}
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
                    disabled={connectionStatus !== 'connected'}
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
                <Box textAlign="center" flex={1}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {availableMarkets.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    사용 가능 마켓
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* 알림 */}
          {connectionStatus === 'disconnected' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2">
                WebSocket 연결이 끊어졌습니다. 실시간 데이터를 받을 수 없습니다.
              </Typography>
            </Alert>
          )}

          {connectionStatus === 'connecting' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                WebSocket 연결 중입니다. 잠시만 기다려주세요.
              </Typography>
            </Alert>
          )}

          {!isRunning && connectionStatus === 'connected' && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                알고리즘이 중지되어 있습니다. 시작 버튼을 눌러 실시간 신호 생성을 시작하세요.
              </Typography>
            </Alert>
          )}

          {signals.length === 0 && isRunning && connectionStatus === 'connected' && (
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