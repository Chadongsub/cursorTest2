import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { TradingConfig } from '../../services/tradingAlgorithm';

interface TradingSettingsProps {
  open: boolean;
  onClose: () => void;
  config: TradingConfig;
  onConfigChange: (config: TradingConfig) => void;
  selectedMarkets: string[];
  onMarketsChange: (markets: string[]) => void;
  availableMarkets: string[];
}

const TradingSettings: React.FC<TradingSettingsProps> = ({
  open,
  onClose,
  config,
  onConfigChange,
  selectedMarkets,
  onMarketsChange,
  availableMarkets
}) => {
  const [localConfig, setLocalConfig] = useState<TradingConfig>(config);
  const [localMarkets, setLocalMarkets] = useState<string[]>(selectedMarkets);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLocalConfig(config);
    setLocalMarkets(selectedMarkets);
  }, [config, selectedMarkets]);

  const handleConfigChange = (key: keyof TradingConfig, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMarketToggle = (market: string) => {
    setLocalMarkets(prev => {
      if (prev.includes(market)) {
        return prev.filter(m => m !== market);
      } else {
        return [...prev, market];
      }
    });
  };

  const handleAddMarket = (market: string) => {
    if (!localMarkets.includes(market)) {
      setLocalMarkets(prev => [...prev, market]);
    }
  };

  const handleRemoveMarket = (market: string) => {
    setLocalMarkets(prev => prev.filter(m => m !== market));
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    onMarketsChange(localMarkets);
    onClose();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setLocalMarkets(selectedMarkets);
    onClose();
  };

  const handleReset = () => {
    const defaultConfig: TradingConfig = {
      shortPeriod: 5,
      longPeriod: 20,
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      minConfidence: 0.3
    };
    const defaultMarkets = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'];
    setLocalConfig(defaultConfig);
    setLocalMarkets(defaultMarkets);
  };

  const filteredMarkets = availableMarkets.filter(market => 
    market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMarketDisplayName = (market: string) => {
    return market.replace('KRW-', '');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          트레이딩 알고리즘 설정
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {/* 종목 선택 섹션 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" mb={2}>
            모니터링 종목 선택
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              현재 선택된 종목 ({localMarkets.length}개)
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {localMarkets.map(market => (
                <Chip
                  key={market}
                  label={getMarketDisplayName(market)}
                  onDelete={() => handleRemoveMarket(market)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              label="종목 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
              placeholder="BTC, ETH 등으로 검색..."
            />
          </Box>

          <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <List dense>
              {filteredMarkets.slice(0, 50).map(market => (
                <ListItem key={market} dense>
                  <Checkbox
                    checked={localMarkets.includes(market)}
                    onChange={() => handleMarketToggle(market)}
                    size="small"
                  />
                  <ListItemText 
                    primary={getMarketDisplayName(market)}
                    secondary={market}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            선택한 종목들에 대해서만 트레이딩 신호가 생성됩니다. 너무 많은 종목을 선택하면 성능에 영향을 줄 수 있습니다.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" mb={2}>
            이동평균 설정
          </Typography>
          
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="단기 이동평균"
              type="number"
              value={localConfig.shortPeriod}
              onChange={(e) => handleConfigChange('shortPeriod', Number(e.target.value))}
              inputProps={{ min: 1, max: 50 }}
              fullWidth
              size="small"
            />
            <TextField
              label="장기 이동평균"
              type="number"
              value={localConfig.longPeriod}
              onChange={(e) => handleConfigChange('longPeriod', Number(e.target.value))}
              inputProps={{ min: 5, max: 200 }}
              fullWidth
              size="small"
            />
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            단기 이동평균이 장기 이동평균을 상향/하향 돌파할 때 신호가 생성됩니다.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" mb={2}>
            RSI 설정
          </Typography>
          
          <TextField
            label="RSI 기간"
            type="number"
            value={localConfig.rsiPeriod}
            onChange={(e) => handleConfigChange('rsiPeriod', Number(e.target.value))}
            inputProps={{ min: 5, max: 50 }}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="과매수 기준"
              type="number"
              value={localConfig.rsiOverbought}
              onChange={(e) => handleConfigChange('rsiOverbought', Number(e.target.value))}
              inputProps={{ min: 60, max: 90 }}
              fullWidth
              size="small"
            />
            <TextField
              label="과매도 기준"
              type="number"
              value={localConfig.rsiOversold}
              onChange={(e) => handleConfigChange('rsiOversold', Number(e.target.value))}
              inputProps={{ min: 10, max: 40 }}
              fullWidth
              size="small"
            />
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            RSI가 과매수/과매도 구간에 도달하면 매도/매수 신호가 생성됩니다.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" mb={2}>
            신호 필터링
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              최소 신뢰도: {(localConfig.minConfidence * 100).toFixed(0)}%
            </Typography>
            <Slider
              value={localConfig.minConfidence}
              onChange={(_, value) => handleConfigChange('minConfidence', value as number)}
              min={0.1}
              max={0.9}
              step={0.1}
              marks={[
                { value: 0.1, label: '10%' },
                { value: 0.5, label: '50%' },
                { value: 0.9, label: '90%' }
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Alert severity="warning">
            신뢰도가 낮은 신호는 필터링되어 표시되지 않습니다.
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="고급 설정 표시"
          />
          
          {showAdvanced && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                고급 설정은 추후 추가될 예정입니다.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleReset} color="secondary">
          기본값으로 초기화
        </Button>
        <Box flex={1} />
        <Button onClick={handleCancel}>
          취소
        </Button>
        <Button onClick={handleSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradingSettings; 