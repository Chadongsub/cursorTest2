import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import PageLayout from '../components/Layout/PageLayout';
import MockTradingDashboard from '../components/MockTrading/MockTradingDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mock-trading-tabpanel-${index}`}
      aria-labelledby={`mock-trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MockTradingPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PageLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          모의투자
        </Typography>
        <Typography variant="body1" color="text.secondary">
          실제 돈 없이 암호화폐 거래를 연습해보세요. 1000만원의 가상 자금으로 시작합니다.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>주의사항:</strong> 이는 모의투자 시스템입니다. 실제 거래가 이루어지지 않으며, 
          모든 거래는 가상의 환경에서만 실행됩니다. 실제 투자 결정을 내리기 전에 충분한 
          학습과 연구를 진행하시기 바랍니다.
        </Typography>
      </Alert>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="모의투자 탭"
            >
              <Tab 
                icon={<AccountBalanceIcon />} 
                label="계정 대시보드" 
                iconPosition="start"
              />
              <Tab 
                icon={<HistoryIcon />} 
                label="거래 내역" 
                iconPosition="start"
              />
              <Tab 
                icon={<AssessmentIcon />} 
                label="성과 분석" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <MockTradingDashboard refreshKey={refreshKey} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                거래 내역 기능은 준비 중입니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                곧 상세한 거래 내역과 필터링 기능을 제공할 예정입니다.
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                성과 분석 기능은 준비 중입니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                곧 차트와 상세한 성과 분석 기능을 제공할 예정입니다.
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default MockTradingPage; 