import React from 'react';
import { Box, Toolbar, Container, Typography, Grid, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import InterestWidget from '../components/widgets/InterestWidget';
import InterestMarkets from '../components/InterestMarkets/InterestMarkets';

export default function InterestPage() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Topbar />
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            관심종목
          </Typography>
          <Grid container spacing={3}>
            {/* @ts-ignore */}
            <Grid item xs={12} md={4} lg={3}>
              <InterestWidget />
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} md={8} lg={9}>
              <Paper sx={{ p: 2, height: '600px' }}>
                <InterestMarkets />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
} 