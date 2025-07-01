import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Divider,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

interface MarketSelectorProps {
  availableMarkets: string[];
  selectedMarkets: string[];
  onMarketsChange: (markets: string[]) => void;
}

interface MarketCategory {
  name: string;
  description: string;
  markets: string[];
  icon: React.ReactNode;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({
  availableMarkets,
  selectedMarkets,
  onMarketsChange
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // 시가총액 기준 분류 (실제로는 API에서 가져와야 함)
  const marketCategories: MarketCategory[] = [
    {
      name: '대형주',
      description: '시가총액 상위 10개',
      markets: ['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOGE', 'KRW-MATIC', 'KRW-DOT', 'KRW-LTC', 'KRW-BCH', 'KRW-LINK'],
      icon: <Star color="primary" />
    },
    {
      name: '중형주',
      description: '시가총액 11-30위',
      markets: ['KRW-UNI', 'KRW-ATOM', 'KRW-SOL', 'KRW-AVAX', 'KRW-TRX', 'KRW-NEAR', 'KRW-ALGO', 'KRW-VET', 'KRW-FLOW', 'KRW-AAVE'],
      icon: <TrendingUp color="secondary" />
    },
    {
      name: '소형주',
      description: '시가총액 31위 이후',
      markets: ['KRW-ICP', 'KRW-FIL', 'KRW-APT', 'KRW-OP', 'KRW-ARB', 'KRW-MKR', 'KRW-SNX', 'KRW-COMP', 'KRW-CRV', 'KRW-YFI'],
      icon: <TrendingDown color="warning" />
    }
  ];

  const handleCategorySelect = (category: MarketCategory, select: boolean) => {
    if (select) {
      // 카테고리 전체 선택 (중복 제거)
      const allMarkets = [...selectedMarkets, ...category.markets];
      const newMarkets = allMarkets.filter((market, index) => allMarkets.indexOf(market) === index);
      onMarketsChange(newMarkets);
    } else {
      // 카테고리 전체 해제
      const newMarkets = selectedMarkets.filter(market => !category.markets.includes(market));
      onMarketsChange(newMarkets);
    }
  };

  const handleMarketToggle = (market: string) => {
    const newMarkets = selectedMarkets.includes(market)
      ? selectedMarkets.filter(m => m !== market)
      : [...selectedMarkets, market];
    onMarketsChange(newMarkets);
  };

  const handleSelectAll = () => {
    onMarketsChange([...availableMarkets]);
  };

  const handleClearAll = () => {
    onMarketsChange([]);
  };

  const getMarketDisplayName = (market: string) => {
    return market.replace('KRW-', '');
  };

  const isCategorySelected = (category: MarketCategory) => {
    return category.markets.every(market => selectedMarkets.includes(market));
  };

  const isCategoryPartiallySelected = (category: MarketCategory) => {
    const selectedCount = category.markets.filter(market => selectedMarkets.includes(market)).length;
    return selectedCount > 0 && selectedCount < category.markets.length;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            종목 선택 전략
          </Typography>
          <Box display="flex" gap={1}>
            <Button size="small" onClick={handleSelectAll}>
              전체 선택
            </Button>
            <Button size="small" onClick={handleClearAll}>
              전체 해제
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            현재 <strong>{selectedMarkets.length}개</strong> 종목이 선택되어 있습니다.
          </Typography>
        </Alert>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="시가총액별" />
          <Tab label="전체 목록" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {marketCategories.map((category, index) => (
              <Box key={category.name} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {category.icon}
                  <Typography variant="subtitle1" fontWeight="medium">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({category.description})
                  </Typography>
                  <Checkbox
                    checked={isCategorySelected(category)}
                    indeterminate={isCategoryPartiallySelected(category)}
                    onChange={(e) => handleCategorySelect(category, e.target.checked)}
                    size="small"
                  />
                </Box>
                
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {category.markets.map(market => (
                    <Chip
                      key={market}
                      label={getMarketDisplayName(market)}
                      variant={selectedMarkets.includes(market) ? "filled" : "outlined"}
                      color={selectedMarkets.includes(market) ? "primary" : "default"}
                      size="small"
                      onClick={() => handleMarketToggle(market)}
                      icon={selectedMarkets.includes(market) ? <Visibility /> : <VisibilityOff />}
                    />
                  ))}
                </Box>
                
                {index < marketCategories.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <List dense>
              {availableMarkets.map(market => (
                <ListItem key={market} dense>
                  <Checkbox
                    checked={selectedMarkets.includes(market)}
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
        )}

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" fontWeight="medium" mb={1}>
            선택된 종목
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedMarkets.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                선택된 종목이 없습니다.
              </Typography>
            ) : (
              selectedMarkets.map(market => (
                <Chip
                  key={market}
                  label={getMarketDisplayName(market)}
                  onDelete={() => handleMarketToggle(market)}
                  color="primary"
                  size="small"
                />
              ))
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MarketSelector; 