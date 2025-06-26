import React from 'react';
import { Box, Toolbar, Container, Typography, Grid, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import UpbitMarketComponent from '../components/UpbitMarket/UpbitMarketComponent';

export default function MarketPage() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Topbar />
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            마켓현황
          </Typography>
          <Grid container spacing={3}>
            <Grid sx={{ width: '100%' }}>
              <Paper sx={{ p: 2 }}>
                <UpbitMarketComponent />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
} 