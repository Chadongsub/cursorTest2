import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function ExploreDataWidget() {
  return (
    <Card
      variant="outlined"
      sx={{
        background: '#f7f9fb',
        borderRadius: 3,
        boxShadow: 0,
        border: '1px solid #e3e8ef',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrendingUpIcon sx={{ fontSize: 28, color: '#222' }} />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
            Explore your data
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Uncover performance and visitor insights with our data wizardry.
        </Typography>
        <Button
          variant="contained"
          sx={{
            background: 'linear-gradient(90deg, #222 60%, #222 100%)',
            color: '#fff',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold',
            px: 2.5,
            py: 1,
            boxShadow: 'none',
            '&:hover': { background: '#111' },
          }}
          endIcon={<span style={{ fontSize: 18 }}>{'>'}</span>}
        >
          Get insights
        </Button>
      </CardContent>
    </Card>
  );
} 