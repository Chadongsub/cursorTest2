import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Toolbar,
  Divider,
  Typography,
  Box,
  Collapse
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const drawerWidth = 240;

const mainMenu = [
  { text: '대시보드', path: '/' },
  { text: '마켓현황', path: '/market' },
  { text: '관심종목', path: '/interest' },
];

const subMenu = [
  { text: '업비트 설정', path: '/upbit-settings' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(() => {
    const currentPath = location.pathname;
    const menuItem = mainMenu.find(item => item.path === currentPath);
    return menuItem ? menuItem.text : '대시보드';
  });
  const [open, setOpen] = useState(true);

  const handleMenuClick = (text: string, path: string) => {
    setSelected(text);
    navigate(path);
  };

  const handleCollapse = () => {
    setOpen(prev => !prev);
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
                  selected={selected === item.text}
                  onClick={() => handleMenuClick(item.text, item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    color: 'text.primary',
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      color: 'primary.main',
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText primary={item.text} />
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
              onClick={() => handleMenuClick(item.text, item.path)}
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
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
    </Drawer>
  );
} 