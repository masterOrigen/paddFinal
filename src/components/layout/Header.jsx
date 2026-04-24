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
  Box,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  const [mesesBloqueadosDialogOpen, setMesesBloqueadosDialogOpen] = useState(false);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [mesesBloqueadosLoading, setMesesBloqueadosLoading] = useState(false);
  const [cierreMeses, setCierreMeses] = useState([]);
  const [cierreAnioId, setCierreAnioId] = useState(null);
  const [cierreAnioYears, setCierreAnioYears] = useState(null);
  const [cierreMesesSeleccionados, setCierreMesesSeleccionados] = useState([]);
  const [cierreMesesCerradosOriginal, setCierreMesesCerradosOriginal] = useState([]);
  const [mesesBloqueadosRows, setMesesBloqueadosRows] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
  });
  const menuRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const perfilNombre = Array.isArray(user?.Perfiles)
    ? user?.Perfiles?.[0]?.NombrePerfil
    : user?.Perfiles?.NombrePerfil;
  const perfilCodigo = Array.isArray(user?.Perfiles)
    ? user?.Perfiles?.[0]?.Codigo
    : user?.Perfiles?.Codigo;
  const isAdmin = /admin/i.test(String(perfilCodigo ?? '')) || /admin/i.test(String(perfilNombre ?? ''));

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
      setCierreMeses(meses);

      const currentYear = new Date().getFullYear();
      const yearMatch = anios.find(a => Number(a.years) === Number(currentYear));
      if (!yearMatch?.id) {
        Swal.fire({
          icon: 'error',
          title: 'Año no configurado',
          text: `No existe el año ${currentYear} en la tabla Anios`
        });
        setCerrarMesDialogOpen(false);
        return;
      }

      setCierreAnioId(yearMatch.id);
      setCierreAnioYears(yearMatch.years);
      await cargarMesesCerradosPorAnio(yearMatch.id);
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

  const abrirMesesBloqueadosDialog = async () => {
    try {
      setMesesBloqueadosLoading(true);
      setMesesBloqueadosDialogOpen(true);

      const [cerradosResult, aniosResult, mesesResult] = await Promise.all([
        supabase.from('meses_cerrados').select('anio, mes'),
        supabase.from('Anios').select('id, years'),
        supabase.from('Meses').select('Id, Nombre')
      ]);

      if (cerradosResult.error) throw cerradosResult.error;
      if (aniosResult.error) throw aniosResult.error;
      if (mesesResult.error) throw mesesResult.error;

      const aniosMap = new Map((aniosResult.data || []).map(a => [a.id, a.years]));
      const mesesMap = new Map((mesesResult.data || []).map(m => [m.Id, m.Nombre]));

      const rows = (cerradosResult.data || [])
        .map(r => ({
          anioId: r.anio,
          anioYears: aniosMap.get(r.anio) ?? r.anio,
          mesId: r.mes,
          mesNombre: mesesMap.get(r.mes) ?? r.mes
        }))
        .sort((a, b) => {
          const ay = Number(a.anioYears);
          const by = Number(b.anioYears);
          if (!Number.isNaN(ay) && !Number.isNaN(by) && ay !== by) return ay - by;
          if (a.anioYears !== b.anioYears) return String(a.anioYears).localeCompare(String(b.anioYears));
          return Number(a.mesId) - Number(b.mesId);
        });

      setMesesBloqueadosRows(rows);
    } catch (error) {
      console.error('Error al cargar meses bloqueados:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los meses bloqueados'
      });
      setMesesBloqueadosDialogOpen(false);
      setMesesBloqueadosRows([]);
    } finally {
      setMesesBloqueadosLoading(false);
    }
  };

  const guardarCierreMeses = async () => {
    try {
      if (!cierreAnioId) {
        Swal.fire({
          icon: 'warning',
          title: 'Año requerido',
          text: 'No se pudo determinar el año actual'
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
          anio: cierreAnioId,
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
          .eq('anio', cierreAnioId)
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
            sx={{ mr: 1, textTransform: 'none' }}
          >
            Cerrar Mes
          </Button>
        )}
        {user && (
          <Button
            variant="outlined"
            size="small"
            onClick={abrirMesesBloqueadosDialog}
            sx={{ mr: 2, textTransform: 'none' }}
          >
            Meses bloqueados
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
              <Typography variant="body2" color="text.secondary">
                Año: {cierreAnioYears ?? new Date().getFullYear()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel
                  id="cierre-meses-label"
                  shrink
                  sx={{ backgroundColor: '#fff', px: 0.5 }}
                >
                  Meses a cerrar
                </InputLabel>
                <Select
                  multiple
                  labelId="cierre-meses-label"
                  label="Meses a cerrar"
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
                  disabled={cierreLoading || !cierreAnioId}
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1.2
                    }
                  }}
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
            <Grid item xs={12}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Registro de meses cerrados
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', overflowX: 'hidden' }}>
                  <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Año</TableCell>
                        <TableCell>Mes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cierreMesesCerradosOriginal.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                            Sin meses cerrados para este año
                          </TableCell>
                        </TableRow>
                      ) : (
                        cierreMeses
                          .filter(m => cierreMesesCerradosOriginal.includes(m.Id))
                          .map((mes) => (
                            <TableRow key={mes.Id}>
                              <TableCell>{cierreAnioYears ?? new Date().getFullYear()}</TableCell>
                              <TableCell>{mes.Nombre}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarMesDialogOpen(false)} disabled={cierreLoading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardarCierreMeses} disabled={cierreLoading || !cierreAnioId}>
            {cierreLoading ? <Typography variant="body2">Guardando...</Typography> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={mesesBloqueadosDialogOpen}
        onClose={() => setMesesBloqueadosDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Meses bloqueados</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', overflowX: 'hidden' }}>
            <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Año</TableCell>
                  <TableCell>Mes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mesesBloqueadosLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : mesesBloqueadosRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} sx={{ color: 'text.secondary' }}>
                      No hay meses bloqueados
                    </TableCell>
                  </TableRow>
                ) : (
                  mesesBloqueadosRows.map((row) => (
                    <TableRow key={`${row.anioId}-${row.mesId}`}>
                      <TableCell>{row.anioYears}</TableCell>
                      <TableCell>{row.mesNombre}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMesesBloqueadosDialogOpen(false)}>Cerrar</Button>
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
