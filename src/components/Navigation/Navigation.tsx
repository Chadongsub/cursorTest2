import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

const NavContainer = styled.nav`
  background: #2c3e50;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  height: 60px;
`;

const NavItem = styled.li`
  margin-right: 30px;
`;

const NavLink = styled(Link)<{ active: boolean }>`
  color: ${props => props.active ? '#3498db' : '#ecf0f1'};
  text-decoration: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  padding: 10px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? 'rgba(52, 152, 219, 0.1)' : 'rgba(236, 240, 241, 0.1)'};
    color: ${props => props.active ? '#3498db' : '#ffffff'};
  }
`;

const ExternalLink = styled.a<{ active: boolean }>`
  color: ${props => props.active ? '#3498db' : '#ecf0f1'};
  text-decoration: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  padding: 10px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? 'rgba(52, 152, 219, 0.1)' : 'rgba(236, 240, 241, 0.1)'};
    color: ${props => props.active ? '#3498db' : '#ffffff'};
  }
`;

const Logo = styled.div`
  color: #ecf0f1;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
`;

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <NavContainer>
      <NavList>
        <Logo>업비트 대시보드</Logo>
        <NavItem>
          <NavLink to="/" active={location.pathname === '/'}>
            마켓 현황
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to="/chart" active={location.pathname === '/chart'}>
            차트
          </NavLink>
        </NavItem>
        <NavItem>
          <ExternalLink href="/admin" active={location.pathname.startsWith('/admin')}>
            관리자
          </ExternalLink>
        </NavItem>
      </NavList>
    </NavContainer>
  );
};

export default Navigation; 