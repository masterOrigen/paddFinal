import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Button,
  InputAdornment,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  Home as HomeIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  VpnKey as VpnKeyIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const EditUserModal = ({ open, onClose, usuario, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    Nombre: '',
    Apellido: '',
    Email: '',
    Password: '',
    Estado: true,
    id_perfil: '',
    id_grupo: ''
  });
  const [loading, setLoading] = useState(false);
  const [perfiles, setPerfiles] = useState([]);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    if (usuario) {
      setFormData({
        Nombre: usuario.Nombre || '',
        Apellido: usuario.Apellido || '',
        Email: usuario.Email || '',
        Password: '',
        Estado: usuario.Estado,
        id_perfil: usuario.Perfiles?.id || '',
        id_grupo: usuario.Grupos?.id_grupo || ''
      });
      fetchPerfilesYGrupos();
    }
  }, [usuario]);

  const fetchPerfilesYGrupos = async () => {
    try {
      const [perfilesResponse, gruposResponse] = await Promise.all([
        supabase.from('Perfiles').select('id, NombrePerfil'),
        supabase.from('Grupos').select('id_grupo, nombre_grupo')
      ]);

      if (perfilesResponse.error) throw perfilesResponse.error;
      if (gruposResponse.error) throw gruposResponse.error;

      setPerfiles(perfilesResponse.data || []);
      setGrupos(gruposResponse.data || []);
    } catch (error) {
      console.error('Error al cargar perfiles y grupos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los perfiles y grupos',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'Estado') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = {
        Nombre: formData.Nombre,
        Apellido: formData.Apellido,
        Email: formData.Email,
        Estado: formData.Estado,
        id_perfil: formData.id_perfil,
        id_grupo: formData.id_grupo,
        fechadeultimamodificacion: new Date().toISOString()
      };

      // Solo incluir la contraseña si se ha modificado
      if (formData.Password) {
        updateData.Password = formData.Password;
      }

      const { error } = await supabase
        .from('Usuarios')
        .update(updateData)
        .eq('id_usuario', usuario.id_usuario);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Usuario actualizado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el usuario',
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Editar Usuario
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
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                required
                InputProps={{
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
                required
                InputProps={{
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
                type="email"
                value={formData.Email}
                onChange={handleChange}
                required
                InputProps={{
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
                label="Contraseña"
                name="Password"
                type="password"
                value={formData.Password}
                onChange={handleChange}
                helperText="Dejar en blanco para mantener la contraseña actual"
                InputProps={{
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
                select
                label="Perfil"
                name="id_perfil"
                value={formData.id_perfil}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              >
                {perfiles.map((perfil) => (
                  <MenuItem key={perfil.id} value={perfil.id}>
                    {perfil.NombrePerfil}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Grupo"
                name="id_grupo"
                value={formData.id_grupo}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon />
                    </InputAdornment>
                  ),
                }}
              >
                {grupos.map((grupo) => (
                  <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grupo.nombre_grupo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="Estado"
                value={formData.Estado.toString()}
                onChange={handleChange}
                required
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const AddUserModal = ({ open, onClose, onUserAdded }) => {
  const initialFormState = {
    Nombre: '',
    Apellido: '',
    Email: '',
    Password: '',
    Estado: true,
    id_perfil: '',
    id_grupo: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [perfiles, setPerfiles] = useState([]);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    if (open) {
      // Limpiar el formulario cada vez que se abre el modal
      setFormData(initialFormState);
      fetchPerfilesYGrupos();
    }
  }, [open]);

  const fetchPerfilesYGrupos = async () => {
    try {
      const [perfilesResponse, gruposResponse] = await Promise.all([
        supabase.from('Perfiles').select('id, NombrePerfil'),
        supabase.from('Grupos').select('id_grupo, nombre_grupo')
      ]);

      if (perfilesResponse.error) throw perfilesResponse.error;
      if (gruposResponse.error) throw gruposResponse.error;

      setPerfiles(perfilesResponse.data || []);
      setGrupos(gruposResponse.data || []);
    } catch (error) {
      console.error('Error al cargar perfiles y grupos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los perfiles y grupos',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'Estado') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Verificar si el email ya existe
      const { data: existingUser } = await supabase
        .from('Usuarios')
        .select('Email')
        .eq('Email', formData.Email)
        .single();

      if (existingUser) {
        throw new Error('Ya existe un usuario con este email');
      }

      // Crear objeto con los datos del nuevo usuario
      const newUser = {
        Nombre: formData.Nombre.trim(),
        Apellido: formData.Apellido.trim(),
        Email: formData.Email.trim().toLowerCase(),
        Password: formData.Password,
        Estado: formData.Estado,
        id_perfil: formData.id_perfil,
        id_grupo: formData.id_grupo,
        fechaCreacion: new Date().toISOString(),
        fechadeultimamodificacion: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('Usuarios')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Usuario creado correctamente',
        timer: 1500,
        showConfirmButton: false
      });

      onUserAdded();
      onClose();
      // Limpiar el formulario
      setFormData(initialFormState);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message === 'Ya existe un usuario con este email' 
          ? error.message 
          : 'No se pudo crear el usuario',
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Agregar Usuario
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
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="Nombre"
                value={formData.Nombre}
                onChange={handleChange}
                required
                InputProps={{
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
                required
                InputProps={{
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
                type="email"
                value={formData.Email}
                onChange={handleChange}
                required
                InputProps={{
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
                label="Contraseña"
                name="Password"
                type="password"
                value={formData.Password}
                onChange={handleChange}
                required
                InputProps={{
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
                select
                label="Perfil"
                name="id_perfil"
                value={formData.id_perfil}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              >
                {perfiles.map((perfil) => (
                  <MenuItem key={perfil.id} value={perfil.id}>
                    {perfil.NombrePerfil}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Grupo"
                name="id_grupo"
                value={formData.id_grupo}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon />
                    </InputAdornment>
                  ),
                }}
              >
                {grupos.map((grupo) => (
                  <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grupo.nombre_grupo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="Estado"
                value={formData.Estado.toString()}
                onChange={handleChange}
                required
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ListadoUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchUsuarios = async (start, limit, searchQuery = '') => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('Usuarios')
        .select('*', { count: 'exact', head: true });

      // Aplicar filtro de búsqueda si existe
      if (searchQuery) {
        query = query.or(`Nombre.ilike.%${searchQuery}%,Email.ilike.%${searchQuery}%,Apellido.ilike.%${searchQuery}%`);
      }

      const { count, error: countError } = await query;

      if (countError) {
        console.error('Error al obtener conteo:', countError);
        throw countError;
      }

      setTotalRows(count || 0);

      // Consulta para obtener los datos con el mismo filtro
      let dataQuery = supabase
        .from('Usuarios')
        .select(`
          id_usuario,
          Nombre,
          Apellido,
          Email,
          Estado,
          Avatar,
          fechaCreacion,
          fechadeultimamodificacion,
          Perfiles:id_perfil (
            id,
            NombrePerfil,
            Codigo
          ),
          Grupos:id_grupo (
            id_grupo,
            nombre_grupo
          )
        `);

      // Aplicar el mismo filtro de búsqueda a la consulta de datos
      if (searchQuery) {
        dataQuery = dataQuery.or(`Nombre.ilike.%${searchQuery}%,Email.ilike.%${searchQuery}%,Apellido.ilike.%${searchQuery}%`);
      }

      const { data, error } = await dataQuery
        .range(start, start + limit - 1)
        .order('id_usuario', { ascending: true });

      if (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reiniciar la página cuando cambia el término de búsqueda
    setPage(0);
    // Agregar un pequeño retraso para evitar demasiadas llamadas mientras el usuario escribe
    const timeoutId = setTimeout(() => {
      fetchUsuarios(0, rowsPerPage, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, rowsPerPage]);

  useEffect(() => {
    if (searchTerm === '') {
      fetchUsuarios(page * rowsPerPage, rowsPerPage, searchTerm);
    }
  }, [page]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (usuario) => {
    setSelectedUser(usuario);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    fetchUsuarios(page * rowsPerPage, rowsPerPage, searchTerm);
  };

  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  const handleDeleteClick = async (usuario) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar al usuario ${usuario.Nombre} ${usuario.Apellido}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from('Usuarios')
          .delete()
          .eq('id_usuario', usuario.id_usuario);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Usuario eliminado correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        // Actualizar la lista de usuarios
        fetchUsuarios(page * rowsPerPage, rowsPerPage, searchTerm);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el usuario',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return date;
    }
  };

  return (
    <Box 
      component="main" 
      sx={{
        flexGrow: 1,
        bgcolor: 'background.default',
        mt: '64px', // Altura del AppBar
        ml: '240px', // Ancho del Sidebar
        p: 3
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary">Usuarios</Typography>
      </Breadcrumbs>

      {/* Header con título y botones */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Listado de Usuarios
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
          sx={{ mr: 2 }}
        >
          Agregar Usuario
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FileDownloadIcon />}
          sx={{ ml: 2 }}
        >
          Exportar Usuarios
        </Button>
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Buscar por nombre, apellido o email..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {/* Tabla */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Grupo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell>Última Modificación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Cargando...</TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay usuarios registrados</TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id_usuario} hover>
                  <TableCell>{usuario.Nombre}</TableCell>
                  <TableCell>{usuario.Apellido}</TableCell>
                  <TableCell>{usuario.Email}</TableCell>
                  <TableCell>{usuario.Perfiles?.NombrePerfil || '-'}</TableCell>
                  <TableCell>{usuario.Grupos?.nombre_grupo || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.Estado ? 'Activo' : 'Inactivo'}
                      color={usuario.Estado ? 'success' : 'error'}
                      size="small"
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(usuario.fechaCreacion)}</TableCell>
                  <TableCell>{formatDate(usuario.fechadeultimamodificacion)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditClick(usuario)}>
                        <EditIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDeleteClick(usuario)}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, totalRows)} de ${totalRows}`}
        </Typography>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={() => ''}
        />
      </Box>
      {/* Modal de edición */}
      <EditUserModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        usuario={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
      {/* Modal de agregar usuario */}
      <AddUserModal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        onUserAdded={handleUserUpdated}
      />
    </Box>
  );
};

export default ListadoUsuarios;
