import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import { supabase } from '../../config/supabase';
import UserDataPopup from '../UserDataPopup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Swal from 'sweetalert2';
import './Header.css';

const Header = ({ setIsAuthenticated }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [userDataOpen, setUserDataOpen] = useState(false);
  const [mensajeDialogOpen, setMensajeDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
  });
  const menuRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  useClickOutside(menuRef, () => {
    if (showMenu) setShowMenu(false);
  });

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('auth-change'));
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleProfileClick = () => {
    setShowMenu(false);
    setUserDataOpen(true);
  };

  const handleMensajesClick = () => {
    setShowMenu(false);
    navigate('/mensajes');
  };

  const handleNuevoMensajeClick = () => {
    setShowMenu(false);
    setFormData({
      titulo: '',
      mensaje: '',
    });
    setMensajeDialogOpen(true);
  };

  const handleMensajeDialogClose = () => {
    setMensajeDialogOpen(false);
    setFormData({
      titulo: '',
      mensaje: '',
    });
  };

  const handleMensajeSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!currentUser || !currentUser.id_usuario) {
        throw new Error('No hay usuario conectado');
      }

      // Obtener el último ID
      const { data: lastMessage, error: fetchError } = await supabase
        .from('aviso')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextId = lastMessage && lastMessage.length > 0 ? lastMessage[0].id + 1 : 1;

      const { error } = await supabase
        .from('aviso')
        .insert([
          {
            id: nextId,
            titulo: formData.titulo,
            mensaje: formData.mensaje,
            id_usuario: currentUser.id_usuario,
            created_at: new Date().toISOString()
          },
        ]);

      if (error) throw error;
      
      Swal.fire({
        icon: 'success',
        title: 'Mensaje creado correctamente',
        showConfirmButton: false,
        timer: 1500
      });

      handleMensajeDialogClose();
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message === 'No hay usuario conectado'
          ? 'Debe iniciar sesión para crear mensajes'
          : 'Hubo un error al procesar el mensaje',
      });
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <img 
          src="https://www.origenmedios.cl/wp-content/uploads/2023/10/logo-origen-2023-sm2.png" 
          alt="Origen" 
          className="header-logo"
        />
        <h1>ADMINISTRACIÓN</h1>
      </div>
      <div className="header-right">
        <span>Bienvenid@ - {user ? `${user.Nombre} ${user.Apellido}` : 'Usuario'}</span>
        <div className="user-menu-container" ref={menuRef}>
          <div 
            className="user-avatar"
            onClick={() => setShowMenu(!showMenu)}
          >
            {user?.Avatar ? (
              <img 
                src={user.Avatar} 
                alt={`${user.Nombre} ${user.Apellido}` || 'Usuario'}
                className="user-avatar-image"
              />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
          </div>
          {showMenu && (
            <div className="user-menu">
              <div className="menu-item" onClick={handleProfileClick}>
                <i className="fas fa-user"></i>
                <span>Mi Perfil</span>
              </div>
              <div className="menu-item" onClick={handleNuevoMensajeClick}>
                <i className="fas fa-envelope"></i>
                <span>Publicar Mensajes</span>
              </div>
              <div className="menu-item" onClick={handleMensajesClick}>
                <i className="fas fa-comments"></i>
                <span>Muro de Mensajes</span>
              </div>
              <div className="menu-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span style={{ color: '#EF4D36' }}>Salir de Padd</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup de Datos del Usuario */}
      <UserDataPopup open={userDataOpen} onClose={() => setUserDataOpen(false)} />

      {/* Dialog para Nuevo Mensaje */}
      <Dialog open={mensajeDialogOpen} onClose={handleMensajeDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Nuevo Mensaje
        </DialogTitle>
        <form onSubmit={handleMensajeSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Título
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ingrese el título del mensaje"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Mensaje
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={formData.mensaje}
                  onChange={(content) => setFormData({ ...formData, mensaje: content })}
                  modules={modules}
                  formats={formats}
                  style={{
                    height: '300px',
                    marginBottom: '50px'
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleMensajeDialogClose}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Crear
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </header>
  );
};

export default Header;
