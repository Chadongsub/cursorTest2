import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ 
          width: '100%',
          fontSize: '0.875rem',
          fontWeight: 500,
          '& .MuiAlert-message': {
            fontSize: '0.875rem',
            fontWeight: 500
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast; 