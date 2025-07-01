import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Toolbar,
  Divider,
  Typography,
  Box,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const mainMenu = [
  { text: '대시보드', icon: <DashboardIcon />, path: '/' },
  { text: '마켓현황', icon: <TrendingUpIcon />, path: '/market' },
  { text: '관심종목', icon: <FavoriteIcon />, path: '/interest' },
];

const subMenu = [
  { text: '업비트 설정', icon: <SettingsIcon />, path: '/upbit-settings' },
  { text: '트레이딩 알고리즘', icon: <PsychologyIcon />, path: '/trading' }
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selected, setSelected] = useState(() => {
    const currentPath = location.pathname;
    const menuItem = mainMenu.find(item => item.path === currentPath);
    const subMenuItem = subMenu.find(item => item.path === currentPath);
    const selectedItem = menuItem || subMenuItem;
    return selectedItem ? selectedItem.text : '대시보드';
  });
  const [open, setOpen] = useState(true);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleCollapse = () => {
    setOpen(prev => !prev);
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: isMobile ? 0 : 8 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" noWrap component="div">
            Upbit Dashboard
          </Typography>
        </Box>
        <Divider />
        <List>
          <ListItemButton onClick={handleCollapse} sx={{ borderRadius: 2 }}>
            <ListItemText primary="기본정보" />
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {mainMenu.map((item) => (
                <ListItem disablePadding key={item.text}>
                  <ListItemButton
                    key={item.path}
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          fontSize: '0.875rem',
                          fontWeight: 500
                        } 
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
          <Divider sx={{ my: 2 }} />
          {subMenu.map((item) => (
            <ListItem disablePadding key={item.text}>
              <ListItemButton
                selected={selected === item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  color: 'text.primary',
                  pl: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    color: 'primary.main',
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
      </Box>
    </Drawer>
  );
};

export default Sidebar; 