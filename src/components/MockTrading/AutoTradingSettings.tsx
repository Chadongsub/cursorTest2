import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { mockTradingService, AutoTradingConfig } from '../../services/mockTradingService';
import { upbitApi } from '../../services/upbit';

interface AutoTradingSettingsProps {
  onConfigChange?: (config: AutoTradingConfig) => void;
}

const AutoTradingSettings: React.FC<AutoTradingSettingsProps> = ({ onConfigChange }) => {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
    loadAvailableMarkets();
  }, []);

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

  const handleConfigChange = (updates: Partial<AutoTradingConfig>) => {
    const newConfig = { ...config, ...updates };
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

  const getAlgorithmName = (algorithm: string) => {
    const names: { [key: string]: string } = {
      'ma_rsi': '이동평균 + RSI',
      'bollinger': '볼린저 밴드',
      'stochastic': '스토캐스틱'
    };
    return names[algorithm] || algorithm;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            자동 거래 설정
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={config.enabled}
                onChange={(e) => handleConfigChange({ enabled: e.target.checked })}
                color="primary"
              />
            }
            label={config.enabled ? '자동 거래 활성화' : '자동 거래 비활성화'}
          />
        </Box>

        {config.enabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            자동 거래가 활성화되었습니다. 설정된 알고리즘에 따라 자동으로 거래가 실행됩니다.
          </Alert>
        )}

        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box flex="1" minWidth="300px">
            <FormControl fullWidth margin="normal">
              <InputLabel>알고리즘</InputLabel>
              <Select
                value={config.algorithm}
                onChange={(e) => handleConfigChange({ algorithm: e.target.value as any })}
                label="알고리즘"
              >
                <MenuItem value="ma_rsi">이동평균 + RSI</MenuItem>
                <MenuItem value="bollinger">볼린저 밴드</MenuItem>
                <MenuItem value="stochastic">스토캐스틱</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
              자동 거래에 사용할 마켓을 선택하세요.
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
      </CardContent>
    </Card>
  );
};

export default AutoTradingSettings; 