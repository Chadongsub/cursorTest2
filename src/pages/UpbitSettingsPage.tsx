import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Switch, FormControlLabel, TextField, Button } from '@mui/material';

const LOCAL_KEY = 'upbitSettings';

export default function UpbitSettingsPage() {
  const [useSocket, setUseSocket] = useState(true);
  const [apiInterval, setApiInterval] = useState(2000);

  useEffect(() => {
    // 기존 설정 불러오기
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setUseSocket(parsed.useSocket ?? true);
      setApiInterval(parsed.apiInterval ?? 2000);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ useSocket, apiInterval }));
    alert('설정이 저장되었습니다!');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
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
    </Container>
  );
} 