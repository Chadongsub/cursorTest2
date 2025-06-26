import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';
import PageLayout from '../components/Layout/PageLayout';
import InterestWidget from '../components/widgets/InterestWidget';
import InterestMarkets from '../components/InterestMarkets/InterestMarkets';

export default function InterestPage() {
  return (
    <PageLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        관심종목
      </Typography>
      
      <Grid container spacing={3}>
        <Grid sx={{ width: '100%' }}>
          <Paper sx={{ p: 2 }}>
            <InterestMarkets />
          </Paper>
        </Grid>
      </Grid>
    </PageLayout>
  );
} 