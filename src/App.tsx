import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MarketPage from './pages/MarketPage';
import InterestPage from './pages/InterestPage';
import UpbitSettingsPage from './pages/UpbitSettingsPage';
import CurrentPricePage from './pages/CurrentPricePage';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f4f6f8' },
  },
  shape: { borderRadius: 12 },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/interest" element={<InterestPage />} />
          <Route path="/upbit-settings" element={<UpbitSettingsPage />} />
          <Route path="/current-price/:market" element={<CurrentPricePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 