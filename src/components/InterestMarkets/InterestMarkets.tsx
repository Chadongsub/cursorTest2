import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Alert,
  Skeleton,
  Tooltip,
  Button,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  WifiTethering as WifiTetheringIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { upbitWebSocket, type UpbitTicker } from '../../services/upbitWebSocket';
import { upbitApi, type MarketWarningType } from '../../services/upbit';
import { interestService, type InterestMarket } from '../../services/interestService';
import { getUpbitSettings } from '../../utils/upbitSettings';
import Toast from '../Toast/Toast';

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDragging' && prop !== 'change'
})<{ change: string; isDragging: boolean }>(({ theme, change, isDragging }) => ({
  height: '240px',
  transition: 'all 0.3s ease',
  borderLeft: `4px solid ${
    change === 'RISE' ? theme.palette.success.main :
    change === 'FALL' ? theme.palette.error.main :
    theme.palette.grey[400]
  }`,
  opacity: isDragging ? 0.5 : 1,
  transform: isDragging ? 'scale(0.95)' : 'scale(1)',
  cursor: isDragging ? 'grabbing' : 'grab',
  '&:hover': {
    transform: isDragging ? 'scale(0.95)' : 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '& .MuiCardContent-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
}));

const PriceTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'change'
})<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.primary,
  fontWeight: 'bold',
}));

const ChangeTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'change'
})<{ change: string }>(({ theme, change }) => ({
  color: change === 'RISE' ? theme.palette.success.main :
         change === 'FALL' ? theme.palette.error.main :
         theme.palette.text.secondary,
}));

interface InterestMarketsProps {
  selectedWarnings?: MarketWarningType[];
  showWarningOnly?: boolean;
}

const InterestMarkets: React.FC<InterestMarketsProps> = ({ 
  selectedWarnings = [], 
  showWarningOnly = false 
}) => {
  const [interestMarkets, setInterestMarkets] = useState<InterestMarket[]>([]);
  const [tickers, setTickers] = useState<{ [key: string]: UpbitTicker }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [localSelectedWarnings, setLocalSelectedWarnings] = useState<MarketWarningType[]>(selectedWarnings);
  const [localShowWarningOnly, setLocalShowWarningOnly] = useState(showWarningOnly);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate();

  // WebSocket 티커 업데이트 핸들러
  const handleTickerUpdate = useCallback((ticker: UpbitTicker) => {
    setTickers(prev => ({ ...prev, [ticker.market]: ticker }));
    setLastUpdate(new Date());
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadInterestMarkets();
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const settings = getUpbitSettings();
    const { useSocket } = settings;

    if (useSocket) {
      // WebSocket 이벤트 핸들러 설정
      upbitWebSocket.onTickerUpdate = handleTickerUpdate;
      upbitWebSocket.onConnect = () => {
        setConnectionStatus('connected');
        showToast('실시간 데이터 연결됨', 'success');
        console.log('관심종목 WebSocket 연결됨');
      };
      upbitWebSocket.onDisconnect = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 끊김', 'warning');
        console.log('관심종목 WebSocket 연결 끊김');
      };
      upbitWebSocket.onError = () => {
        setConnectionStatus('disconnected');
        showToast('실시간 데이터 연결 오류', 'error');
        console.log('관심종목 WebSocket 오류');
      };

      // 연결 상태 주기적 확인 (5초마다)
      const connectionCheckInterval = setInterval(() => {
        const currentState = upbitWebSocket.getConnectionState();
        if (currentState === 'connected' && connectionStatus !== 'connected') {
          setConnectionStatus('connected');
        } else if (currentState === 'disconnected' && connectionStatus !== 'disconnected') {
          setConnectionStatus('disconnected');
        }
      }, 5000);

      return () => {
        clearInterval(connectionCheckInterval);
        // 컴포넌트 언마운트 시 이벤트 핸들러 제거
        upbitWebSocket.onTickerUpdate = undefined;
        upbitWebSocket.onConnect = undefined;
        upbitWebSocket.onDisconnect = undefined;
        upbitWebSocket.onError = undefined;
        upbitWebSocket.disconnect(); // 연결 해제
      };
    } else {
      // WebSocket 사용 안함일 때 연결 상태를 disconnected로 설정
      setConnectionStatus('disconnected');
      // 기존 연결이 있으면 해제
      if (upbitWebSocket.isConnected()) {
        upbitWebSocket.disconnect();
      }
    }
  }, [handleTickerUpdate]);

  const loadInterestMarkets = async () => {
    try {
      const list = await interestService.getInterestMarkets();
      setInterestMarkets(list);

      if (list.length > 0) {
        // 관심 종목들의 티커 데이터 로드
        const allMarkets = list.map(item => item.market);
        const marketCodes = allMarkets.join(',');
        const initialTickers = await upbitApi.getTicker(marketCodes);
        
        // 초기 데이터를 객체로 변환
        const tickerMap: { [key: string]: UpbitTicker } = {};
        initialTickers.forEach(ticker => {
          tickerMap[ticker.market] = {
            market: ticker.market,
            trade_date: ticker.trade_date,
            trade_time: ticker.trade_time,
            trade_price: ticker.trade_price,
            trade_volume: ticker.trade_volume,
            prev_closing_price: ticker.prev_closing_price,
            change: ticker.change as 'RISE' | 'FALL' | 'EVEN',
            change_price: ticker.change_price,
            change_rate: ticker.change_rate,
            signed_change_price: ticker.change_price,
            signed_change_rate: ticker.change_rate,
            trade_timestamp: Date.now(),
            acc_trade_volume_24h: ticker.acc_trade_volume_24h,
            acc_trade_price_24h: ticker.acc_trade_price_24h,
            acc_trade_volume: ticker.acc_trade_volume_24h,
            acc_trade_price: ticker.acc_trade_price_24h,
            acc_ask_volume: 0,
            acc_bid_volume: 0,
            highest_52_week_price: 0,
            highest_52_week_date: '',
            lowest_52_week_price: 0,
            lowest_52_week_date: '',
            market_warning: ''
          };
        });
        setTickers(tickerMap);
        setLastUpdate(new Date());

        // useSocket 설정에 따라 WebSocket 연결
        const settings = getUpbitSettings();
        if (settings.useSocket) {
          // WebSocket 연결 및 구독
          setConnectionStatus('connecting');
          
          // 기존 연결이 있으면 해제
          if (upbitWebSocket.isConnected()) {
            upbitWebSocket.disconnect();
          }
          
          upbitWebSocket.connect();
          
          // 관심 종목 마켓 구독
          const marketCodesArray = allMarkets;
          setTimeout(() => {
            console.log('관심 종목 구독 시도:', marketCodesArray);
            upbitWebSocket.subscribeToMarkets(marketCodesArray);
          }, 2000); // 연결 후 2초 뒤 구독
        } else {
          setConnectionStatus('disconnected');
        }
      } else {
        // 관심 종목이 없으면 연결 상태만 설정
        setConnectionStatus('disconnected');
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Error fetching data:', err);
    }
  };

  const handleRemoveInterest = async (marketCode: string) => {
    try {
      const success = await interestService.removeInterestMarket(marketCode);
      if (success) {
        setInterestMarkets(prev => prev.filter(m => m.market !== marketCode));
        
        // WebSocket에서 구독 해제
        upbitWebSocket.unsubscribeFromMarkets([marketCode]);
        
        console.log(`${marketCode} 관심 종목에서 삭제됨`);
      }
    } catch (error) {
      console.error('관심 종목 삭제 실패:', error);
    }
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newMarkets = [...interestMarkets];
    const draggedMarket = newMarkets[draggedIndex];
    newMarkets.splice(draggedIndex, 1);
    newMarkets.splice(dropIndex, 0, draggedMarket);
    
    setInterestMarkets(newMarkets);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getTickerByMarket = (marketCode: string) => {
    return tickers[marketCode];
  };

  // 시장경보 필터링 함수
  const filterMarketsByWarning = (marketList: InterestMarket[]) => {
    if (!localSelectedWarnings || localSelectedWarnings.length === 0) {
      return marketList;
    }

    return marketList.filter(market => {
      const ticker = tickers[market.market];
      if (!ticker || !ticker.market_warning) {
        return false;
      }

      // 선택된 경보 타입에 해당하는지 확인
      return localSelectedWarnings.includes(ticker.market_warning as MarketWarningType);
    });
  };

  // 주의종목만 보기 필터링 함수
  const filterWarningOnly = (marketList: InterestMarket[]) => {
    if (!localShowWarningOnly) {
      return marketList;
    }

    return marketList.filter(market => {
      const ticker = tickers[market.market];
      return ticker && ticker.market_warning;
    });
  };

  // 최종 필터링된 관심종목 목록
  const getFilteredInterestMarkets = () => {
    let filteredMarkets = interestMarkets;
    
    // 시장경보 필터 적용
    filteredMarkets = filterMarketsByWarning(filteredMarkets);
    
    // 주의종목만 보기 필터 적용
    filteredMarkets = filterWarningOnly(filteredMarkets);
    
    return filteredMarkets;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(2);
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
        return <WifiIcon color="success" />;
      case 'connecting':
        return <WifiTetheringIcon color="warning" />;
      case 'disconnected':
        return <WifiOffIcon color="error" />;
      default:
        return <WifiOffIcon color="error" />;
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

  const handleCurrentPriceClick = (marketCode: string) => {
    navigate(`/current-price/${marketCode}`);
  };

  const handleOrderBookClick = (marketCode: string) => {
    navigate(`/orderbook/${marketCode}`);
  };

  // 시장경보 타입에 따른 라벨 반환
  const getWarningLabel = (warningType: string) => {
    const warningLabels: Record<string, string> = {
      'PRICE_FLUCTUATIONS': '가격 급등락',
      'TRADING_VOLUME_SOARING': '거래량 급등',
      'DEPOSIT_AMOUNT_SOARING': '입금량 급등',
      'GLOBAL_PRICE_DIFFERENCES': '가격 차이',
      'CONCENTRATION_OF_SMALL_ACCOUNTS': '소수 계정 집중'
    };
    return warningLabels[warningType] || warningType;
  };

  // 시장경보 타입 옵션
  const warningTypeOptions: { value: MarketWarningType; label: string }[] = [
    { value: 'PRICE_FLUCTUATIONS', label: '가격 급등락' },
    { value: 'TRADING_VOLUME_SOARING', label: '거래량 급등' },
    { value: 'DEPOSIT_AMOUNT_SOARING', label: '입금량 급등' },
    { value: 'GLOBAL_PRICE_DIFFERENCES', label: '가격 차이' },
    { value: 'CONCENTRATION_OF_SMALL_ACCOUNTS', label: '소수 계정 집중' }
  ];

  // 시장경보 필터 변경 핸들러
  const handleWarningChange = (event: any) => {
    const value = event.target.value;
    setLocalSelectedWarnings(value);
  };

  // 주의종목만 보기 토글 핸들러
  const handleShowWarningOnlyToggle = () => {
    setLocalShowWarningOnly(!localShowWarningOnly);
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
        <Grid container spacing={2} sx={{ 
          '& .MuiGrid-item': {
            minWidth: '240px'
          }
        }}>
          {[...Array(6)].map((_, index) => (
            <Grid key={index} sx={{ width: { xs: '100%', sm: '20%', md: '20%', lg: '20%', xl: '20%' } }}>
              <Box sx={{ height: '280px', width: '100%', minWidth: '240px' }}>
                <Card sx={{ height: '100%', width: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={16} />
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="60%" height={16} />
                    <Box sx={{ mt: 'auto' }}>
                      <Skeleton variant="text" width="50%" height={12} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
      <Box>
        {/* 헤더 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              실시간 관심 종목 정보
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 시장경보 필터 */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                multiple
                value={localSelectedWarnings}
                onChange={handleWarningChange}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <FilterListIcon fontSize="small" />
                    {selected.length > 0 ? (
                      <Chip 
                        label={`${selected.length}개 선택`} 
                        size="small" 
                        color="warning"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        경보 필터
                      </Typography>
                    )}
                  </Box>
                )}
                displayEmpty
              >
                {warningTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={localSelectedWarnings.indexOf(option.value) > -1} />
                    <ListItemText primary={option.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 주의종목만 보기 토글 */}
            <Chip
              icon={<WarningIcon />}
              label="주의종목만"
              color={localShowWarningOnly ? 'error' : 'default'}
              variant={localShowWarningOnly ? 'filled' : 'outlined'}
              onClick={handleShowWarningOnlyToggle}
              sx={{ cursor: 'pointer' }}
            />

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
            <Chip
              label={`관심 종목 수: ${interestMarkets.length}개`}
              variant="outlined"
              size="small"
            />
            <Tooltip title="새로고침">
              <IconButton onClick={loadInterestMarkets} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 관심 종목 카드 그리드 */}
        <Grid container spacing={2} sx={{ 
          '& .MuiGrid-item': {
            minWidth: '240px'
          }
        }}>
          {getFilteredInterestMarkets().map((market, index) => {
            const ticker = getTickerByMarket(market.market);
            if (!ticker) return null;

            return (
              <Grid key={market.market} sx={{ width: { xs: '100%', sm: '20%', md: '20%', lg: '20%', xl: '20%' } }}>
                <Box sx={{ height: '280px', width: '100%', minWidth: '240px' }}>
                  <StyledCard 
                    change={ticker.change}
                    isDragging={draggedIndex === index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    sx={{ height: '100%', width: '100%' }}
                  >
                    <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
                      {/* 헤더 영역 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexShrink: 0 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            component="div" 
                            gutterBottom
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '1rem',
                              mb: 0.5
                            }}
                          >
                            {market.korean_name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem'
                            }}
                          >
                            {market.market}
                            {/* 시장경보 표시 */}
                            {ticker.market_warning && (
                              <Chip
                                icon={<WarningIcon />}
                                label={getWarningLabel(ticker.market_warning)}
                                color="warning"
                                size="small"
                                sx={{ mt: 0.5, fontSize: '0.6rem', height: '20px' }}
                              />
                            )}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                          <Tooltip title="드래그하여 순서 변경">
                            <IconButton size="small" sx={{ cursor: 'grab' }}>
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="관심 종목 해제">
                            <Button
                              variant="contained"
                              size="small"
                              color="secondary"
                              onClick={() => handleRemoveInterest(market.market)}
                              sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.75rem', flexShrink: 0 }}
                            >
                              해제
                            </Button>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 가격 영역 */}
                      <Box sx={{ mb: 1, flexShrink: 0 }}>
                        <PriceTypography variant="h5" change={ticker.change} sx={{ fontSize: '1.25rem' }}>
                          ₩{formatPrice(ticker.trade_price)}
                        </PriceTypography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 변동률 및 변동가격 영역 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {ticker.change === 'RISE' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : ticker.change === 'FALL' ? (
                            <TrendingDownIcon color="error" fontSize="small" />
                          ) : (
                            <RemoveIcon color="action" fontSize="small" />
                          )}
                          <ChangeTypography variant="body2" change={ticker.change} sx={{ fontSize: '0.75rem' }}>
                            {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                            {(ticker.change_rate * 100).toFixed(2)}%
                          </ChangeTypography>
                        </Box>
                        <ChangeTypography variant="body2" change={ticker.change} sx={{ fontSize: '0.75rem' }}>
                          {ticker.change === 'RISE' ? '+' : ticker.change === 'FALL' ? '-' : ''}
                          ₩{formatPrice(ticker.change_price)}
                        </ChangeTypography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 거래량 영역 */}
                      <Box sx={{ mb: 1, flexShrink: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          거래량: {formatVolume(ticker.trade_volume)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      {/* 상세 정보 버튼 영역 */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexShrink: 0 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          onClick={() => handleCurrentPriceClick(market.market)}
                          sx={{ 
                            flex: 1, 
                            fontSize: '0.7rem', 
                            py: 0.5,
                            minHeight: '28px'
                          }}
                        >
                          현재가
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          onClick={() => handleOrderBookClick(market.market)}
                          sx={{ 
                            flex: 1, 
                            fontSize: '0.7rem', 
                            py: 0.5,
                            minHeight: '28px'
                          }}
                        >
                          호가
                        </Button>
                      </Box>
                    </CardContent>
                  </StyledCard>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {interestMarkets.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              관심 종목이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              마켓 현황에서 관심 종목을 추가해보세요.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default InterestMarkets; 