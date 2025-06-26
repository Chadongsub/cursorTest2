import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel, TextField, Button } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';
import Toast from '../components/Toast/Toast';
import { loadUpbitSettings, saveUpbitSettings } from '../utils/upbitSettings';

export default function UpbitSettingsPage() {
  const [useSocket, setUseSocket] = useState(true);
  const [apiInterval, setApiInterval] = useState(2000);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    loadUpbitSettings().then((settings) => {
      setUseSocket(settings.useSocket);
      setApiInterval(settings.apiInterval);
    });
  }, []);

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

  const handleSave = () => {
    try {
      saveUpbitSettings({ useSocket, apiInterval });
      showToast('설정이 저장되었습니다! 페이지를 새로고침합니다.', 'success');
      // 설정 변경 후 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 2000); // 2초 후 새로고침
    } catch (error) {
      showToast('설정 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <PageLayout>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
      <Paper sx={{ p: 4, maxWidth: 'sm', mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>업비트 설정</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControlLabel
            control={<Switch checked={useSocket} onChange={e => setUseSocket(e.target.checked)} color="primary" />}
            label="실시간 소켓 통신 사용"
          />
          <TextField
            label="API 요청 주기 (ms)"
            type="number"
            value={apiInterval}
            onChange={e => setApiInterval(Number(e.target.value))}
            InputProps={{ inputProps: { min: 500, step: 100 } }}
            fullWidth
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            저장
          </Button>
        </Box>
      </Paper>
    </PageLayout>
  );
} 