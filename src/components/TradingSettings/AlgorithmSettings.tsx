import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import { TradingConfig } from '../../services/tradingAlgorithm';

interface AlgorithmSettingsProps {
  open: boolean;
  onClose: () => void;
  config: TradingConfig;
  onConfigChange: (config: TradingConfig) => void;
  algorithmType: 'ma_rsi' | 'bollinger' | 'stochastic';
}

const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  open,
  onClose,
  config,
  onConfigChange,
  algorithmType
}) => {
  const [localConfig, setLocalConfig] = useState<TradingConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onClose();
  };

  const getAlgorithmTitle = () => {
    switch (algorithmType) {
      case 'ma_rsi':
        return '이동평균 + RSI 설정';
      case 'bollinger':
        return '볼린저 밴드 설정';
      case 'stochastic':
        return '스토캐스틱 설정';
      default:
        return '알고리즘 설정';
    }
  };

  const getAlgorithmDescription = () => {
    switch (algorithmType) {
      case 'ma_rsi':
        return '이동평균 크로스오버와 RSI 과매수/과매도 조합';
      case 'bollinger':
        return '볼린저 밴드 상단/하단 터치 기반 평균회귀';
      case 'stochastic':
        return '스토캐스틱 과매수/과매도 및 %K/%D 크로스오버';
      default:
        return '';
    }
  };

  const renderMARsiSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        이동평균 설정
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="단기 이동평균"
          type="number"
          value={localConfig.shortPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            shortPeriod: parseInt(e.target.value) || 5
          })}
          inputProps={{ min: 1, max: 50 }}
          fullWidth
        />
        <TextField
          label="장기 이동평균"
          type="number"
          value={localConfig.longPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            longPeriod: parseInt(e.target.value) || 20
          })}
          inputProps={{ min: 5, max: 200 }}
          fullWidth
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        RSI 설정
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="RSI 기간"
          type="number"
          value={localConfig.rsiPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            rsiPeriod: parseInt(e.target.value) || 14
          })}
          inputProps={{ min: 5, max: 50 }}
          fullWidth
        />
        <TextField
          label="과매수 기준"
          type="number"
          value={localConfig.rsiOverbought}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            rsiOverbought: parseInt(e.target.value) || 70
          })}
          inputProps={{ min: 50, max: 100 }}
          fullWidth
        />
        <TextField
          label="과매도 기준"
          type="number"
          value={localConfig.rsiOversold}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            rsiOversold: parseInt(e.target.value) || 30
          })}
          inputProps={{ min: 0, max: 50 }}
          fullWidth
        />
      </Box>
    </Box>
  );

  const renderBollingerSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        볼린저 밴드 설정
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="밴드 기간"
          type="number"
          value={localConfig.bollingerPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            bollingerPeriod: parseInt(e.target.value) || 20
          })}
          inputProps={{ min: 5, max: 100 }}
          fullWidth
        />
        <TextField
          label="표준편차"
          type="number"
          value={localConfig.bollingerStdDev}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            bollingerStdDev: parseFloat(e.target.value) || 2
          })}
          inputProps={{ min: 0.5, max: 5, step: 0.1 }}
          fullWidth
        />
      </Box>
    </Box>
  );

  const renderStochasticSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        스토캐스틱 설정
      </Typography>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="%K 기간"
          type="number"
          value={localConfig.stochasticKPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            stochasticKPeriod: parseInt(e.target.value) || 14
          })}
          inputProps={{ min: 5, max: 50 }}
          fullWidth
        />
        <TextField
          label="%D 기간"
          type="number"
          value={localConfig.stochasticDPeriod}
          onChange={(e) => setLocalConfig({
            ...localConfig,
            stochasticDPeriod: parseInt(e.target.value) || 3
          })}
          inputProps={{ min: 1, max: 20 }}
          fullWidth
        />
      </Box>
    </Box>
  );

  const renderCommonSettings = () => (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        공통 설정
      </Typography>
      <Box mb={3}>
        <Typography gutterBottom>
          최소 신뢰도: {(localConfig.minConfidence * 100).toFixed(0)}%
        </Typography>
        <Slider
          value={localConfig.minConfidence}
          onChange={(_, value) => setLocalConfig({
            ...localConfig,
            minConfidence: value as number
          })}
          min={0.1}
          max={1}
          step={0.1}
          marks={[
            { value: 0.1, label: '10%' },
            { value: 0.5, label: '50%' },
            { value: 1, label: '100%' }
          ]}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );

  const renderAlgorithmSpecificSettings = () => {
    switch (algorithmType) {
      case 'ma_rsi':
        return renderMARsiSettings();
      case 'bollinger':
        return renderBollingerSettings();
      case 'stochastic':
        return renderStochasticSettings();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {getAlgorithmTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {getAlgorithmDescription()}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {renderAlgorithmSpecificSettings()}
          {renderCommonSettings()}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel} color="inherit">
          취소
        </Button>
        <Button onClick={handleSave} variant="contained">
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlgorithmSettings; 