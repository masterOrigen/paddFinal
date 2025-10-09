import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const UserDataPopup = ({ open, onClose }) => {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Mis Datos</DialogTitle>
      <DialogContent dividers>
        {user ? (
          <div>
            {user.email && (
              <Typography variant="body1" gutterBottom>Email: {user.email}</Typography>
            )}
            {user.name && (
              <Typography variant="body1" gutterBottom>Nombre: {user.name}</Typography>
            )}
            {!user.email && !user.name && (
              <Typography variant="body2" color="textSecondary">
                No hay información de usuario disponible.
              </Typography>
            )}
          </div>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No hay información de usuario disponible.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDataPopup;