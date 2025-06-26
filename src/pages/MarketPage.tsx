import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';
import UpbitMarketComponent from '../components/UpbitMarket/UpbitMarketComponent';

export default function MarketPage() {
  return (
    <PageLayout>
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
    </PageLayout>
  );
} 