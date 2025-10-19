import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Switch,
  FormControlLabel,
  Box
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Mensajes.css';

const Mensajes = () => {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState(null);
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
  });
  const [dateRange, setDateRange] = useState({
    desde: '',
    hasta: ''
  });
  const mensajesPorPagina = 6;

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

  const fetchMensajes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aviso')
        .select(`
          *,
          Usuarios_1:id_usuario(
            id_usuario,
            Nombre,
            Apellido
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMensajes(data || []);
    } catch (error) {
      console.error('Error fetching mensajes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los mensajes'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchMensajes();
  }, []);

  const handleOpenDialog = (mensaje = null) => {
    if (mensaje) {
      setFormData({
        titulo: mensaje.titulo || '',
        mensaje: mensaje.mensaje,
      });
      setSelectedMensaje(mensaje);
    } else {
      setFormData({
        titulo: '',
        mensaje: '',
      });
      setSelectedMensaje(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMensaje(null);
    setFormData({
      titulo: '',
      mensaje: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Obtener el usuario actual del localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      if (!currentUser || !currentUser.id_usuario) {
        throw new Error('No hay usuario conectado');
      }

      if (selectedMensaje) {
        const { error } = await supabase
          .from('aviso')
          .update({
            titulo: formData.titulo,
            mensaje: formData.mensaje,
            id_usuario: currentUser.id_usuario
          })
          .eq('id', selectedMensaje.id);

        if (error) throw error;
        
        Swal.fire({
          icon: 'success',
          title: 'Mensaje actualizado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
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
      }

      handleCloseDialog();
      fetchMensajes();
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

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from('aviso')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire(
          'Eliminado',
          'El mensaje ha sido eliminado',
          'success'
        );
        fetchMensajes();
      }
    } catch (error) {
      console.error('Error deleting mensaje:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el mensaje'
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredMensajes = mensajes.filter(mensaje => {
    // Filtro por texto
    const matchesSearch = mensaje.mensaje.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por fecha
    let matchesDates = true;
    const messageDate = new Date(mensaje.created_at);
    
    if (dateRange.desde) {
      const desdeDate = new Date(dateRange.desde);
      desdeDate.setHours(0, 0, 0, 0);
      matchesDates = matchesDates && messageDate >= desdeDate;
    }
    
    if (dateRange.hasta) {
      const hastaDate = new Date(dateRange.hasta);
      hastaDate.setHours(23, 59, 59, 999);
      matchesDates = matchesDates && messageDate <= hastaDate;
    }
    
    return matchesSearch && matchesDates;
  });

  const paginatedMensajes = filteredMensajes.slice(
    (page - 1) * mensajesPorPagina,
    page * mensajesPorPagina
  );

  useEffect(() => {
    fetchMensajes();
  }, []); // Solo se ejecuta al montar el componente

  // Resetear la página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateRange.desde, dateRange.hasta]);

  return (
    <Container maxWidth="xl" className="mensajes-container">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link color="inherit" href="/">
              Inicio
            </Link>
            <Typography color="textPrimary">Mensajes</Typography>
          </Breadcrumbs>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2, pl: 2 }}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E5E7EB',
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ position: 'relative' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  left: 0,
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}
              >
                Desde:
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={dateRange.desde}
                onChange={(e) => setDateRange({ ...dateRange, desde: e.target.value })}
                placeholder="dd/mm/aaaa"
                InputProps={{
                  sx: {
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    }
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ position: 'relative' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  left: 0,
                  color: '#6B7280',
                  fontSize: '0.875rem'
                }}
              >
                Hasta:
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={dateRange.hasta}
                onChange={(e) => setDateRange({ ...dateRange, hasta: e.target.value })}
                placeholder="dd/mm/aaaa"
                InputProps={{
                  sx: {
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    }
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              sx={{
                height: '36px',
                minWidth: '120px',
                backgroundColor: '#1D4ED8',
                '&:hover': {
                  backgroundColor: '#1e40af'
                },
                borderRadius: '6px',
                textTransform: 'none',
                marginTop: '4px',
                fontSize: '0.875rem',
                padding: '6px 16px'
              }}
            >
              Nuevo Mensaje
            </Button>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            {paginatedMensajes.map((mensaje) => (
              <Grid item xs={12} sm={6} md={4} key={mensaje.id}>
                <Card className="mensaje-card">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Lo escribio el {formatDate(mensaje.created_at)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {mensaje.Usuarios_1 ? `${mensaje.Usuarios_1.Nombre} ${mensaje.Usuarios_1.Apellido}` : 'Usuario no identificado'}
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {mensaje.titulo || 'Sin título'}
                    </Typography>
                    <div
                      dangerouslySetInnerHTML={{ __html: mensaje.mensaje }}
                      className="mensaje-content"
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {currentUser && mensaje.id_usuario === currentUser.id_usuario && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(mensaje)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(mensaje.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} className="pagination-container">
          <Pagination
            count={Math.ceil(filteredMensajes.length / mensajesPorPagina)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMensaje ? 'Editar Mensaje' : 'Nuevo Mensaje'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
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
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedMensaje ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Mensajes;
