import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import { Layout } from './components/Layout/Layout';
import UpbitMarketComponent from './components/UpbitMarket/UpbitMarketComponent';
import UpbitChart from './components/UpbitChart/UpbitChart';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<UpbitMarketComponent />} />
            <Route path="/chart" element={<UpbitChart />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App; 