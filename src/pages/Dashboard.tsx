import React from 'react';
import { Typography, Paper } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';

export default function Dashboard() {
  return (
    <PageLayout>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upbit Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          왼쪽 메뉴에서 원하는 기능을 선택하세요.
        </Typography>
      </Paper>
    </PageLayout>
  );
} 