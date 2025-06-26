import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

export default function Topbar() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'text.primary'
          }}
        >
          업비트 마켓 대시보드
        </Typography>
      </Toolbar>
    </AppBar>
  );
} 