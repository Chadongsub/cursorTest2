import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

export default function Topbar() {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          업비트 대시보드
        </Typography>
      </Toolbar>
    </AppBar>
  );
} 