import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';

const drawerWidth = 240;

const mainMenu = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: '마켓현황', icon: <TrendingUpIcon />, path: '/market' },
  { text: '관심종목', icon: <FavoriteIcon />, path: '/interest' },
];

const subMenu = [
  { text: '설정', icon: <SettingsIcon />, path: '/settings' },
  { text: '정보', icon: <InfoIcon />, path: '/info' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(() => {
    const currentPath = location.pathname;
    const menuItem = [...mainMenu, ...subMenu].find(item => item.path === currentPath);
    return menuItem ? menuItem.text : 'Dashboard';
  });

  const handleMenuClick = (text: string, path: string) => {
    setSelected(text);
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: 0 }}>
          Upbit Dashboard
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {mainMenu.map((item) => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton
              selected={selected === item.text}
              onClick={() => handleMenuClick(item.text, item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                color: 'text.primary',
                '& .MuiListItemIcon-root': {
                  color: 'text.secondary',
                },
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        {subMenu.map((item) => (
          <ListItem disablePadding key={item.text}>
            <ListItemButton
              selected={selected === item.text}
              onClick={() => handleMenuClick(item.text, item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                color: 'text.secondary',
                '& .MuiListItemIcon-root': {
                  color: 'text.disabled',
                },
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
} 