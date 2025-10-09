import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  VpnKey as VpnKeyIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { supabase } from '../config/supabase';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const UserDataPopup = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    Nombre: '',
    Apellido: '',
    Email: '',
    Password: ''
  });

  useEffect(() => {
    if (open) {
      fetchUsuario();
    }
  }, [open]);

  useEffect(() => {
    if (usuario) {
      setFormData({
        Nombre: usuario.Nombre || '',
        Apellido: usuario.Apellido || '',
        Email: usuario.Email || '',
        Password: usuario.Password || ''
      });
    }
  }, [usuario]);

  const fetchUsuario = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id_usuario) throw new Error('No se encontró el usuario');

      const { data, error } = await supabase
        .from('Usuarios')
        .select('*, Perfiles(NombrePerfil), Grupos(nombre_grupo)')
        .eq('id_usuario', user.id_usuario)
        .single();

      if (error) throw error;
      setUsuario(data);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id_usuario) throw new Error('No se encontró el usuario');

      const updateData = {
        Nombre: formData.Nombre,
        Apellido: formData.Apellido,
        Email: formData.Email,
        fechadeultimamodificacion: new Date().toISOString()
      };

      if (formData.Password) {
        updateData.Password = formData.Password;
      }

      const { error } = await supabase
        .from('Usuarios')
        .update(updateData)
        .eq('id_usuario', user.id_usuario);

      if (error) throw error;

      await fetchUsuario(); // Recargar los datos
      setIsEditing(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Datos actualizados correctamente',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        onClose(); // Cerrar el popup después de que se cierre el SweetAlert
        navigate('/dashboard'); // Redirigir a dashboard
      });
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron actualizar los datos',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Mis Datos
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : usuario ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="Apellido"
                value={formData.Apellido}
                onChange={handleChange}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.Password}
                onChange={handleChange}
                InputProps={{
                  readOnly: !isEditing,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Perfil"
                value={usuario.Perfiles?.NombrePerfil || ''}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grupo"
                value={usuario.Grupos?.nombre_grupo || ''}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Typography color="error">No se pudieron cargar los datos del usuario</Typography>
        )}
      </DialogContent>
      <DialogActions>
        {!loading && usuario && (
          isEditing ? (
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              Guardar
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
          )
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDataPopup;
