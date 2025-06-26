import React from 'react';
import { Typography, Paper } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';

export default function Dashboard() {
  return (
    <PageLayout>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: '2rem',
            fontWeight: 700,
            mb: 3
          }}
        >
          업비트 마켓 대시보드
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1rem',
            fontWeight: 400,
            mb: 4
          }}
        >
          실시간 업비트 마켓 정보와 관심 종목을 한눈에 확인하세요
        </Typography>
      </Paper>
    </PageLayout>
  );
} 