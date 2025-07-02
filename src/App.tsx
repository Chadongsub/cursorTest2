import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MarketPage from './pages/MarketPage';
import InterestPage from './pages/InterestPage';
import UpbitSettingsPage from './pages/UpbitSettingsPage';
import TradingPage from './pages/TradingPage';
import CurrentPricePage from './pages/CurrentPricePage';
import OrderBookPage from './pages/OrderBookPage';
import MARsiPage from './pages/AlgorithmPages/MARsiPage';
import BollingerPage from './pages/AlgorithmPages/BollingerPage';
import StochasticPage from './pages/AlgorithmPages/StochasticPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f4f6f8' },
  },
  typography: {
    fontFamily: '"Nanum Square", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Nanum Square", "Roboto", "Helvetica", "Arial", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        label: {
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
        },
        sizeSmall: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Nanum Square", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
  },
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
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/algorithm/ma-rsi" element={<MARsiPage />} />
          <Route path="/algorithm/bollinger" element={<BollingerPage />} />
          <Route path="/algorithm/stochastic" element={<StochasticPage />} />
          <Route path="/current-price/:market" element={<CurrentPricePage />} />
          <Route path="/orderbook/:market" element={<OrderBookPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 