import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Switch, FormControlLabel, TextField, Button } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';
import Toast from '../components/Toast/Toast';
import { loadUpbitSettings, saveUpbitSettings } from '../utils/upbitSettings';

export default function UpbitSettingsPage() {
  const [useSocket, setUseSocket] = useState(true);
  const [apiInterval, setApiInterval] = useState(2000);
  const [loading, setLoading] = useState(true);
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
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await loadUpbitSettings();
        setUseSocket(settings.useSocket);
        setApiInterval(settings.apiInterval);
      } catch (error) {
        console.error('설정 로드 실패:', error);
        showToast('설정을 불러오는 중 오류가 발생했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
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

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveUpbitSettings({ useSocket, apiInterval });
      showToast('설정이 저장되었습니다!', 'success');
    } catch (error) {
      showToast('설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Paper sx={{ p: 4, maxWidth: 'sm', mx: 'auto' }}>
          <Typography>설정을 불러오는 중...</Typography>
        </Paper>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={handleCloseToast}
      />
      <Paper sx={{ p: 4, maxWidth: 'sm', mx: 'auto' }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: '1.75rem',
            fontWeight: 700,
            mb: 2
          }}
        >
          업비트 설정
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontSize: '1rem',
            fontWeight: 400,
            mb: 3
          }}
        >
          업비트 API 및 WebSocket 연결 설정을 관리합니다.
        </Typography>
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
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Paper>
    </PageLayout>
  );
} 