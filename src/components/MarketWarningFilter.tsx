import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { MarketWarningType } from '../services/upbit';

interface MarketWarningFilterProps {
  selectedWarnings: MarketWarningType[];
  onWarningChange: (warnings: MarketWarningType[]) => void;
  showWarningOnly: boolean;
  onShowWarningOnlyChange: (show: boolean) => void;
}

const warningTypeLabels: Record<MarketWarningType, string> = {
  PRICE_FLUCTUATIONS: '가격 급등락',
  TRADING_VOLUME_SOARING: '거래량 급등',
  DEPOSIT_AMOUNT_SOARING: '입금량 급등',
  GLOBAL_PRICE_DIFFERENCES: '가격 차이',
  CONCENTRATION_OF_SMALL_ACCOUNTS: '소수 계정 집중'
};

const warningTypeDescriptions: Record<MarketWarningType, string> = {
  PRICE_FLUCTUATIONS: '가격 급등락 경보가 발령된 종목',
  TRADING_VOLUME_SOARING: '거래량 급등 경보가 발령된 종목',
  DEPOSIT_AMOUNT_SOARING: '입금량 급등 경보가 발령된 종목',
  GLOBAL_PRICE_DIFFERENCES: '가격 차이 경보가 발령된 종목',
  CONCENTRATION_OF_SMALL_ACCOUNTS: '소수 계정 집중 경보가 발령된 종목'
};

const MarketWarningFilter: React.FC<MarketWarningFilterProps> = ({
  selectedWarnings,
  onWarningChange,
  showWarningOnly,
  onShowWarningOnlyChange
}) => {
  const handleWarningToggle = (warning: MarketWarningType) => {
    const newWarnings = selectedWarnings.includes(warning)
      ? selectedWarnings.filter(w => w !== warning)
      : [...selectedWarnings, warning];
    onWarningChange(newWarnings);
  };

  const handleClearAll = () => {
    onWarningChange([]);
    onShowWarningOnlyChange(false);
  };

  const handleShowWarningOnlyToggle = () => {
    onShowWarningOnlyChange(!showWarningOnly);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterListIcon color="primary" />
        <Typography variant="h6">시장경보 필터</Typography>
        <Tooltip title="필터 초기화">
          <IconButton 
            size="small" 
            onClick={handleClearAll}
            disabled={selectedWarnings.length === 0 && !showWarningOnly}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {Object.entries(warningTypeLabels).map(([warning, label]) => (
          <Tooltip key={warning} title={warningTypeDescriptions[warning as MarketWarningType]}>
            <Chip
              icon={<WarningIcon />}
              label={label}
              color={selectedWarnings.includes(warning as MarketWarningType) ? 'warning' : 'default'}
              variant={selectedWarnings.includes(warning as MarketWarningType) ? 'filled' : 'outlined'}
              onClick={() => handleWarningToggle(warning as MarketWarningType)}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<WarningIcon />}
          label="주의종목만 보기"
          color={showWarningOnly ? 'error' : 'default'}
          variant={showWarningOnly ? 'filled' : 'outlined'}
          onClick={handleShowWarningOnlyToggle}
          sx={{ cursor: 'pointer' }}
        />
        {selectedWarnings.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            선택된 경보: {selectedWarnings.length}개
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MarketWarningFilter; 