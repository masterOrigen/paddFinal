import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import { supabase } from '../../config/supabase';
import UserDataPopup from '../UserDataPopup';
import {
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  FormControl,
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
  const [cerrarMesDialogOpen, setCerrarMesDialogOpen] = useState(false);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [cierreAnios, setCierreAnios] = useState([]);
  const [cierreMeses, setCierreMeses] = useState([]);
  const [cierreAnioSeleccionado, setCierreAnioSeleccionado] = useState('');
  const [cierreMesesSeleccionados, setCierreMesesSeleccionados] = useState([]);
  const [cierreMesesCerradosOriginal, setCierreMesesCerradosOriginal] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
  });
  const menuRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = Boolean(
    user?.Perfiles?.Codigo?.toString().toLowerCase().includes('admin') ||
      user?.Perfiles?.NombrePerfil?.toString().toLowerCase().includes('administr')
  );

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

  const cargarMesesCerradosPorAnio = async (anioId) => {
    if (!anioId) return;
    const { data, error } = await supabase
      .from('meses_cerrados')
      .select('anio, mes')
      .eq('anio', anioId);

    if (error) throw error;
    const monthIds = (data || []).map(r => r.mes);
    setCierreMesesCerradosOriginal(monthIds);
    setCierreMesesSeleccionados(monthIds);
  };

  const abrirCerrarMesDialog = async () => {
    try {
      setCierreLoading(true);
      setCerrarMesDialogOpen(true);

      const [aniosResult, mesesResult] = await Promise.all([
        supabase.from('Anios').select('*').order('years'),
        supabase.from('Meses').select('*').order('Id')
      ]);

      if (aniosResult.error) throw aniosResult.error;
      if (mesesResult.error) throw mesesResult.error;

      const anios = aniosResult.data || [];
      const meses = mesesResult.data || [];
      setCierreAnios(anios);
      setCierreMeses(meses);

      const currentYear = new Date().getFullYear();
      const yearMatch = anios.find(a => Number(a.years) === Number(currentYear));
      const defaultYear = yearMatch?.id || anios[anios.length - 1]?.id || '';

      setCierreAnioSeleccionado(defaultYear);
      if (defaultYear) {
        await cargarMesesCerradosPorAnio(defaultYear);
      } else {
        setCierreMesesCerradosOriginal([]);
        setCierreMesesSeleccionados([]);
      }
    } catch (error) {
      console.error('Error al cargar cierre de mes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los años/meses para Cerrar Mes'
      });
      setCerrarMesDialogOpen(false);
    } finally {
      setCierreLoading(false);
    }
  };

  useEffect(() => {
    if (!cerrarMesDialogOpen) return;
    if (!cierreAnioSeleccionado) return;
    cargarMesesCerradosPorAnio(cierreAnioSeleccionado).catch((error) => {
      console.error('Error al cargar meses cerrados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los meses cerrados'
      });
    });
  }, [cerrarMesDialogOpen, cierreAnioSeleccionado]);

  const guardarCierreMeses = async () => {
    try {
      if (!cierreAnioSeleccionado) {
        Swal.fire({
          icon: 'warning',
          title: 'Año requerido',
          text: 'Seleccione un año'
        });
        return;
      }

      setCierreLoading(true);

      const originales = new Set(cierreMesesCerradosOriginal || []);
      const seleccionados = new Set(cierreMesesSeleccionados || []);

      const toClose = [...seleccionados].filter(m => !originales.has(m));
      const toOpen = [...originales].filter(m => !seleccionados.has(m));

      if (toClose.length > 0) {
        const payload = toClose.map(mesId => ({
          anio: cierreAnioSeleccionado,
          mes: mesId
        }));

        const { error } = await supabase
          .from('meses_cerrados')
          .upsert(payload, { onConflict: 'anio,mes' });

        if (error) throw error;
      }

      if (toOpen.length > 0) {
        const { error } = await supabase
          .from('meses_cerrados')
          .delete()
          .eq('anio', cierreAnioSeleccionado)
          .in('mes', toOpen);

        if (error) throw error;
      }

      setCierreMesesCerradosOriginal([...seleccionados]);
      window.dispatchEvent(new Event('meses-cerrados-changed'));

      Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'El cierre de mes fue guardado correctamente',
        timer: 1400,
        showConfirmButton: false
      });

      setCerrarMesDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar cierre de mes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el cierre de mes'
      });
    } finally {
      setCierreLoading(false);
    }
  };

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
        {isAdmin && (
          <Button
            variant="outlined"
            size="small"
            onClick={abrirCerrarMesDialog}
            sx={{ mr: 2, textTransform: 'none' }}
          >
            Cerrar Mes
          </Button>
        )}
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

      <Dialog open={cerrarMesDialogOpen} onClose={() => setCerrarMesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cerrar Mes</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Año</InputLabel>
                <Select
                  value={cierreAnioSeleccionado}
                  label="Año"
                  onChange={(e) => setCierreAnioSeleccionado(e.target.value)}
                  disabled={cierreLoading}
                >
                  {cierreAnios.map((anio) => (
                    <MenuItem key={anio.id} value={anio.id}>
                      {anio.years}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Meses a cerrar</InputLabel>
                <Select
                  multiple
                  value={cierreMesesSeleccionados}
                  onChange={(e) => {
                    const { value } = e.target;
                    setCierreMesesSeleccionados(
                      typeof value === 'string' ? value.split(',').map(v => Number(v)) : value
                    );
                  }}
                  input={<OutlinedInput label="Meses a cerrar" />}
                  renderValue={(selected) => {
                    const selectedIds = new Set(selected);
                    return cierreMeses
                      .filter(m => selectedIds.has(m.Id))
                      .map(m => m.Nombre)
                      .join(', ');
                  }}
                  disabled={cierreLoading || !cierreAnioSeleccionado}
                >
                  {cierreMeses.map((mes) => (
                    <MenuItem key={mes.Id} value={mes.Id}>
                      <Checkbox checked={cierreMesesSeleccionados.indexOf(mes.Id) > -1} />
                      <ListItemText primary={mes.Nombre} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Los meses seleccionados quedarán bloqueados para Planificación (solo lectura). Solo Administración podrá editar.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarMesDialogOpen(false)} disabled={cierreLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarCierreMeses} disabled={cierreLoading || !cierreAnioSeleccionado}>
            {cierreLoading ? <Typography variant="body2">Guardando...</Typography> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

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
