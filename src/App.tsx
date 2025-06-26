import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/market",
    element: <MarketPage />,
  },
  {
    path: "/interest",
    element: <InterestPage />,
  },
  {
    path: "/upbit-settings",
    element: <UpbitSettingsPage />,
  },
  {
    path: "/current-price/:market",
    element: <CurrentPricePage />,
  },
], {
  future: {
    v7_startTransition: true,
  } as any,
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App; 