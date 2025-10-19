import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  Avatar,
  Chip
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
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon
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
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
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
      // Establecer la URL del avatar si existe
      if (usuario.Avatar) {
        setAvatarUrl(usuario.Avatar);
      }
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

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, selecciona un archivo de imagen válido'
      });
      return;
    }

    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La imagen no puede ser mayor a 5MB'
      });
      return;
    }

    setUploadingAvatar(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id_usuario) throw new Error('No se encontró el usuario');

      // Generar un nombre de archivo único
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id_usuario}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Intentar subir usando el cliente de Supabase con el contexto de autenticación actual
      const { data, error } = await supabase.storage
        .from('avatar')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true  // Permitir sobrescribir si ya existe
        });

      if (error) {
        console.error('Error al subir imagen:', error);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('No se pudo obtener la URL de la imagen');

      // Actualizar la URL del avatar en el estado
      setAvatarUrl(urlData.publicUrl);

      Swal.fire({
        icon: 'success',
        title: 'Imagen subida',
        text: 'La imagen de perfil se ha subido correctamente',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      
      // Mostrar un mensaje más detallado sobre el problema
      let errorMessage = error.message || 'Error desconocido';
      
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Error de permisos. Debes configurar las políticas RLS en Supabase Storage para permitir la subida de archivos de avatar.';
      }
      
      // Si el error es de autenticación, mostrar instrucciones adicionales
      if (error.message?.includes('JWT') || error.message?.includes('authentication')) {
        errorMessage = 'Error de autenticación. Por favor, recarga la página e intenta nuevamente.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo subir la imagen de perfil: ${errorMessage}`
      });
    } finally {
      setUploadingAvatar(false);
    }
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

      // Si se subió una nueva imagen de avatar, actualizar la URL
      if (avatarUrl && avatarUrl !== usuario.Avatar) {
        updateData.Avatar = avatarUrl;
      }

      const { error } = await supabase
        .from('Usuarios')
        .update(updateData)
        .eq('id_usuario', user.id_usuario);

      if (error) throw error;

      // Actualizar los datos del usuario en localStorage
      const updatedUser = { ...user, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

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
            {/* Sección de Avatar */}
            <Grid item xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection="column" sx={{ mb: 2 }}>
              <Box position="relative">
                <Avatar
                  src={avatarUrl}
                  alt={`${usuario.Nombre} ${usuario.Apellido}`}
                  sx={{ width: 100, height: 100, cursor: isEditing ? 'pointer' : 'default' }}
                  onClick={handleAvatarClick}
                >
                  {!avatarUrl && <i className="fas fa-user" style={{ fontSize: '40px' }}></i>}
                </Avatar>
                {isEditing && (
                  <Box
                    position="absolute"
                    bottom={0}
                    right={0}
                    sx={{
                      backgroundColor: 'primary.main',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                    onClick={handleAvatarClick}
                  >
                    {uploadingAvatar ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CloudUploadIcon sx={{ color: 'white', fontSize: 20 }} />
                    )}
                  </Box>
                )}
              </Box>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
              {isEditing && (
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
                  Haz clic en el avatar para cambiar la imagen
                </Typography>
              )}
              {avatarUrl && (
                <Chip
                  size="small"
                  label="Avatar actualizado"
                  color="success"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
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
