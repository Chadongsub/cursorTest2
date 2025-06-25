import React from 'react';
import { Box, Toolbar, Container, Typography, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Topbar />
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Upbit Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              왼쪽 메뉴에서 원하는 기능을 선택하세요.
            </Typography>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
} 