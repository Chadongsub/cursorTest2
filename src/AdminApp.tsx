import React from 'react';
import { Admin, Resource } from 'react-admin';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { upbitDataProvider } from './providers/upbitDataProvider';
import MarketList from './components/AdminMarketList/AdminMarketList';
import TickerList from './components/AdminTickerList/AdminTickerList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AdminApp = () => (
  <ThemeProvider theme={theme}>
    <Admin dataProvider={upbitDataProvider} title="업비트 관리자">
      <Resource name="markets" list={MarketList} />
      <Resource name="tickers" list={TickerList} />
    </Admin>
  </ThemeProvider>
);

export default AdminApp; 