import { Snackbar, Alert, AlertColor } from '@mui/material';
import { useState } from 'react';

export const useSnackbar = () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('error');

    const showSnackbar = (message: string, severity: AlertColor) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleClose = () => {
        setSnackbarOpen(false);
    };

    return { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose };
};

interface CustomSnackbarProps {
    open: boolean;
    message: string;
    severity: AlertColor;
    onClose: () => void;
    direction?: 'left' | 'right' | 'center';
}

export const CustomSnackbar = ({ open, message, severity, onClose, direction = 'left' }: CustomSnackbarProps) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: direction as 'left' | 'right' | 'center'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};