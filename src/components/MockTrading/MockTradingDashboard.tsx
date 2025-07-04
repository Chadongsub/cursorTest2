import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { mockTradingService, MockAccount, MockPosition, MockOrder, MockTrade, MockTradingStats } from '../../services/mockTradingService';
import { upbitApi } from '../../services/upbit';
import { upbitWebSocket, UpbitTicker } from '../../services/upbitWebSocket';
import Toast from '../Toast/Toast';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const ProfitLossCell = styled(TableCell)<{ profit: boolean }>(({ theme, profit }) => ({
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 'bold',
  color: profit ? theme.palette.success.main : theme.palette.error.main,
}));

interface MockTradingDashboardProps {
  refreshKey?: number;
}

const MockTradingDashboard: React.FC<MockTradingDashboardProps> = ({ refreshKey = 0 }) => {
  const [account, setAccount] = useState<MockAccount | null>(null);
  const [positions, setPositions] = useState<MockPosition[]>([]);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [trades, setTrades] = useState<MockTrade[]>([]);
  const [stats, setStats] = useState<MockTradingStats | null>(null);
  const [currentPrices, setCurrentPrices] = useState<{ [market: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDialog, setOrderDialog] = useState<{
    open: boolean;
    type: 'buy' | 'sell';
    market: string;
    currentPrice: number;
  }>({
    open: false,
    type: 'buy',
    market: '',
    currentPrice: 0
  });
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    price: ''
  });
  const [balanceDialog, setBalanceDialog] = useState({
    open: false,
    newBalance: ''
  });
  const [positionDialog, setPositionDialog] = useState({
    open: false,
    market: '',
    marketName: '',
    currentQuantity: '',
    newQuantity: ''
  });
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // WebSocket 연결 및 가격 업데이트
  useEffect(() => {
    const handleTickerUpdate = (ticker: UpbitTicker) => {
      setCurrentPrices(prev => ({
        ...prev,
        [ticker.market]: ticker.trade_price
      }));
    };

    upbitWebSocket.onTickerUpdate = handleTickerUpdate;
    upbitWebSocket.connect();

    // 보유 포지션의 마켓들 구독
    if (positions.length > 0) {
      const markets = positions.map(p => p.market);
      setTimeout(() => {
        upbitWebSocket.subscribeToMarkets(markets);
      }, 1000);
    }

    return () => {
      upbitWebSocket.onTickerUpdate = undefined;
    };
  }, [positions]);

  // 포지션 가치 업데이트
  useEffect(() => {
    if (Object.keys(currentPrices).length > 0) {
      mockTradingService.updatePositionValues(currentPrices);
      loadData();
    }
  }, [currentPrices]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 계정 정보 로드
      const accountData = mockTradingService.getAccount();
      setAccount(accountData);

      // 포지션 로드
      const positionsData = mockTradingService.getPositions();
      setPositions(positionsData);

      // 주문 내역 로드
      const ordersData = mockTradingService.getOrders();
      setOrders(ordersData);

      // 거래 내역 로드
      const tradesData = mockTradingService.getTrades();
      setTrades(tradesData);

      // 통계 계산
      const statsData = mockTradingService.getTradingStats();
      setStats(statsData);

      // 현재가 로드
      if (positionsData.length > 0) {
        const markets = positionsData.map(p => p.market).join(',');
        const tickers = await upbitApi.getTicker(markets);
        const priceMap: { [market: string]: number } = {};
        tickers.forEach(ticker => {
          priceMap[ticker.market] = ticker.trade_price;
        });
        setCurrentPrices(priceMap);
      }

    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Error loading mock trading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (type: 'buy' | 'sell', market: string, currentPrice: number) => {
    setOrderDialog({
      open: true,
      type,
      market,
      currentPrice
    });
    setOrderForm({
      quantity: '',
      price: currentPrice.toString()
    });
  };

  const handleOrderSubmit = async () => {
    try {
      const quantity = parseFloat(orderForm.quantity);
      const price = parseFloat(orderForm.price);

      if (isNaN(quantity) || isNaN(price) || quantity <= 0 || price <= 0) {
        throw new Error('올바른 수량과 가격을 입력해주세요.');
      }

      if (orderDialog.type === 'buy') {
        await mockTradingService.placeBuyOrder(orderDialog.market, price, quantity);
      } else {
        await mockTradingService.placeSellOrder(orderDialog.market, price, quantity);
      }

      setOrderDialog({ ...orderDialog, open: false });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '주문 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResetAccount = () => {
    if (window.confirm('모든 모의투자 데이터를 초기화하시겠습니까?')) {
      mockTradingService.resetAccount();
      loadData();
    }
  };

  const handleBalanceEdit = () => {
    setBalanceDialog({
      open: true,
      newBalance: account?.balance.toString() || '0'
    });
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

  const handleBalanceSubmit = () => {
    try {
      const newBalance = parseFloat(balanceDialog.newBalance);
      if (isNaN(newBalance) || newBalance < 0) {
        throw new Error('올바른 금액을 입력해주세요.');
      }
      
      mockTradingService.updateBalance(newBalance);
      setBalanceDialog({ ...balanceDialog, open: false });
      loadData();
      showToast('잔고가 수정되었습니다.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '잔고 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  const handlePositionEdit = (position: MockPosition) => {
    setPositionDialog({
      open: true,
      market: position.market,
      marketName: position.market.replace('KRW-', ''),
      currentQuantity: position.quantity.toString(),
      newQuantity: position.quantity.toString()
    });
  };

  const handlePositionSubmit = () => {
    try {
      const newQuantity = parseFloat(positionDialog.newQuantity);
      if (isNaN(newQuantity) || newQuantity < 0) {
        throw new Error('올바른 수량을 입력해주세요.');
      }
      
      mockTradingService.updatePositionQuantity(positionDialog.market, newQuantity);
      setPositionDialog({ ...positionDialog, open: false });
      loadData();
      showToast('포지션이 수정되었습니다.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '포지션 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toFixed(4);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!account) {
    return <Alert severity="error">계정 정보를 불러올 수 없습니다.</Alert>;
  }

  return (
    <Box>
      {/* 계정 정보 카드 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              모의투자 계정
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="새로고침">
                <IconButton onClick={loadData} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="잔고 수정">
                <IconButton onClick={handleBalanceEdit} size="small" color="primary">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={handleResetAccount}
              >
                계정 초기화
              </Button>
            </Box>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1" minWidth="250px">
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalanceIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    KRW 잔고
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(account.balance)}원
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box flex="1" minWidth="250px">
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon color="success" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    총 자산 가치
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(account.totalValue)}원
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box flex="1" minWidth="250px">
              <Box display="flex" alignItems="center" gap={1}>
                <AssessmentIcon color="info" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    총 손익
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    color={account.totalValue >= 10000000 ? 'success.main' : 'error.main'}
                  >
                    {formatPrice(account.totalValue - 10000000)}원
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 포지션 테이블 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            보유 포지션 ({positions.length}개)
          </Typography>
          
          {positions.length === 0 ? (
            <Alert severity="info">보유한 포지션이 없습니다.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>마켓</StyledTableCell>
                    <StyledTableCell>보유 수량</StyledTableCell>
                    <StyledTableCell>평균 매수가</StyledTableCell>
                    <StyledTableCell>현재가</StyledTableCell>
                    <StyledTableCell>현재 가치</StyledTableCell>
                    <StyledTableCell>손익</StyledTableCell>
                    <StyledTableCell>손익률</StyledTableCell>
                                            <StyledTableCell>거래</StyledTableCell>
                        <StyledTableCell>수정</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position) => {
                    const currentPrice = currentPrices[position.market] || position.avgPrice;
                    const isProfit = position.profitLoss >= 0;
                    
                    return (
                      <TableRow key={position.market} hover>
                        <StyledTableCell>
                          <Chip 
                            label={position.market.replace('KRW-', '')} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </StyledTableCell>
                        <StyledTableCell>{formatQuantity(position.quantity)}</StyledTableCell>
                        <StyledTableCell>{formatPrice(position.avgPrice)}원</StyledTableCell>
                        <StyledTableCell>{formatPrice(currentPrice)}원</StyledTableCell>
                        <StyledTableCell>{formatPrice(position.currentValue)}원</StyledTableCell>
                        <ProfitLossCell profit={isProfit}>
                          {formatPrice(position.profitLoss)}원
                        </ProfitLossCell>
                        <ProfitLossCell profit={isProfit}>
                          {formatPercentage(position.profitLossRate)}
                        </ProfitLossCell>
                        <StyledTableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="매수">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOrderClick('buy', position.market, currentPrice)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="매도">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOrderClick('sell', position.market, currentPrice)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </StyledTableCell>
                        <StyledTableCell>
                          <Tooltip title="포지션 수정">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePositionEdit(position)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </StyledTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 거래 통계 */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              거래 통계
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1" minWidth="200px" textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.totalTrades}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 거래 수
                </Typography>
              </Box>
              <Box flex="1" minWidth="200px" textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.winRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  승률
                </Typography>
              </Box>
              <Box flex="1" minWidth="200px" textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatPrice(stats.totalProfit)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  총 수익
                </Typography>
              </Box>
              <Box flex="1" minWidth="200px" textAlign="center">
                <Typography 
                  variant="h4" 
                  fontWeight="bold"
                  color={stats.netProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPrice(stats.netProfit)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  순손익
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 주문 다이얼로그 */}
      <Dialog open={orderDialog.open} onClose={() => setOrderDialog({ ...orderDialog, open: false })}>
        <DialogTitle>
          {orderDialog.type === 'buy' ? '매수 주문' : '매도 주문'} - {orderDialog.market.replace('KRW-', '')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="수량"
              type="number"
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ step: 0.0001, min: 0 }}
            />
            <TextField
              label="가격 (원)"
              type="number"
              value={orderForm.price}
              onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ step: 1, min: 0 }}
            />
            {orderForm.quantity && orderForm.price && (
              <Alert severity="info" sx={{ mt: 2 }}>
                총 금액: {formatPrice(parseFloat(orderForm.quantity) * parseFloat(orderForm.price))}원
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialog({ ...orderDialog, open: false })}>
            취소
          </Button>
          <Button 
            onClick={handleOrderSubmit} 
            variant="contained"
            color={orderDialog.type === 'buy' ? 'primary' : 'error'}
          >
            {orderDialog.type === 'buy' ? '매수' : '매도'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 잔고 수정 다이얼로그 */}
      <Dialog open={balanceDialog.open} onClose={() => setBalanceDialog({ ...balanceDialog, open: false })}>
        <DialogTitle>
          잔고 수정
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="새로운 잔고 (원)"
              type="number"
              value={balanceDialog.newBalance}
              onChange={(e) => setBalanceDialog({ ...balanceDialog, newBalance: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ step: 1000, min: 0 }}
              helperText="수정할 KRW 잔고를 입력하세요."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBalanceDialog({ ...balanceDialog, open: false })}>
            취소
          </Button>
          <Button 
            onClick={handleBalanceSubmit} 
            variant="contained"
            color="primary"
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 포지션 수정 다이얼로그 */}
      <Dialog open={positionDialog.open} onClose={() => setPositionDialog({ ...positionDialog, open: false })}>
        <DialogTitle>
          포지션 수정 - {positionDialog.marketName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="현재 수량"
              type="number"
              value={positionDialog.currentQuantity}
              fullWidth
              margin="normal"
              inputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="새로운 수량"
              type="number"
              value={positionDialog.newQuantity}
              onChange={(e) => setPositionDialog({ ...positionDialog, newQuantity: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ step: 0.0001, min: 0 }}
              helperText="수정할 보유 수량을 입력하세요."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPositionDialog({ ...positionDialog, open: false })}>
            취소
          </Button>
          <Button 
            onClick={handlePositionSubmit} 
            variant="contained"
            color="primary"
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 토스트 메시지 */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
    </Box>
  );
};

export default MockTradingDashboard; 