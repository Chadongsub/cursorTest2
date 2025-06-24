import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import Navigation from '../Navigation/Navigation';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  padding: ${theme.spacing.md};
  max-width: 1200px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: ${theme.breakpoints.mobile}) {
    padding: ${theme.spacing.sm};
  }
`;

const Footer = styled.footer`
  background-color: ${theme.colors.gray.light};
  padding: ${theme.spacing.md};
  text-align: center;
`;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Navigation />
      <Main>{children}</Main>
      <Footer>
        <p>&copy; 2024 업비트 대시보드. All rights reserved.</p>
      </Footer>
    </LayoutContainer>
  );
}; 