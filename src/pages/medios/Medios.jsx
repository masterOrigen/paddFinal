import React, { useState, useEffect } from 'react';
import { Container, Paper, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, InputAdornment, Checkbox, FormControlLabel, Switch } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import CodeIcon from '@mui/icons-material/Code';
import TimerIcon from '@mui/icons-material/Timer';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CategoryIcon from '@mui/icons-material/Category';
import { supabase } from '../../config/supabase';
import './Medios.css';
import Swal from 'sweetalert2';
import { Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function Medios() {
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  // Estado inicial para un nuevo medio
  const initialFormState = {
    NombredelMedio: '',
    codigo: '',
    Estado: true,
    duracion: false,
    codigo_megatime: false,
    color: false,
    calidad: false,
    cooperado: false,
    rubro: false
  };

  const [medioForm, setMedioForm] = useState(initialFormState);

  // Columnas para el DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'NombredelMedio', headerName: 'Nombre del Medio', width: 200 },
   
    { field: 'codigo', headerName: 'Código', width: 130 },
    { field: 'duracion', headerName: 'Duración', width: 100,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'codigo_megatime', headerName: 'Código Megatime', width: 150,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'color', headerName: 'Color', width: 100,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'calidad', headerName: 'Calidad', width: 100,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'cooperado', headerName: 'Cooperado', width: 120,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'rubro', headerName: 'Rubro', width: 100,
      renderCell: (params) => (
        <span>{params.value ? 'Sí' : 'No'}</span>
      )
    },
    { field: 'Estado', headerName: 'Estado', width: 100, 
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleEstadoChange(params.row.id, e.target.checked)}
          size="small"
          color="primary"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#6777ef',
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#6777ef',
            },
          }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  // Cargar medios
  useEffect(() => {
    fetchMedios();
  }, []);

  const fetchMedios = async () => {
    try {
      const { data, error } = await supabase
        .from('Medios')
        .select('*');

      if (error) throw error;

      setMedios(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar medios:', error);
      setLoading(false);
    }
  };

  // Manejadores de eventos
  const handleOpenDialog = () => {
    setMedioForm(initialFormState);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setMedioForm(initialFormState);
  };

  const handleEdit = (medio) => {
    setMedioForm({
      id: medio.id,
      NombredelMedio: medio.NombredelMedio || '',
      codigo: medio.codigo || '',
      Estado: medio.Estado || false,
      duracion: medio.duracion || false,
      codigo_megatime: medio.codigo_megatime || false,
      color: medio.color || false,
      calidad: medio.calidad || false,
      cooperado: medio.cooperado || false,
      rubro: medio.rubro || false
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      // Mostrar confirmación antes de eliminar
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from('Medios')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Mostrar mensaje de éxito
        await Swal.fire(
          '¡Eliminado!',
          'El medio ha sido eliminado.',
          'success'
        );

        fetchMedios();
      }
    } catch (error) {
      console.error('Error al eliminar medio:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el medio'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let operation;
      
      if (medioForm.id) {
        // Actualización de un medio existente
        operation = supabase
          .from('Medios')
          .update({
            NombredelMedio: medioForm.NombredelMedio,
            codigo: medioForm.codigo,
            Estado: medioForm.Estado,
            duracion: medioForm.duracion,
            codigo_megatime: medioForm.codigo_megatime,
            color: medioForm.color,
            calidad: medioForm.calidad,
            cooperado: medioForm.cooperado,
            rubro: medioForm.rubro
          })
          .eq('id', medioForm.id);
      } else {
        // Inserción de un nuevo medio
        operation = supabase
          .from('Medios')
          .insert([{
            NombredelMedio: medioForm.NombredelMedio,
            codigo: medioForm.codigo || null,
            Estado: medioForm.Estado,
            duracion: medioForm.duracion,
            codigo_megatime: medioForm.codigo_megatime,
            color: medioForm.color,
            calidad: medioForm.calidad,
            cooperado: medioForm.cooperado,
            rubro: medioForm.rubro
          }]);
      }
      
      const { error } = await operation;

      if (error) throw error;

      // Actualizar la lista de medios
      await fetchMedios();
      
      // Cerrar el diálogo y limpiar el formulario
      setOpenDialog(false);
      setMedioForm(initialFormState);

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: medioForm.id ? 'Medio Actualizado' : 'Medio Agregado',
        text: medioForm.id 
          ? 'El medio ha sido actualizado exitosamente' 
          : 'El medio ha sido agregado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al guardar medio:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el medio'
      });
    }
  };

  const handleEstadoChange = async (id, newValue) => {
    try {
      const { error } = await supabase
        .from('Medios')
        .update({ Estado: newValue })
        .eq('id', id);

      if (error) throw error;

      // Actualizar el estado local
      setMedios(medios.map(medio => 
        medio.id === id ? { ...medio, Estado: newValue } : medio
      ));

      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: 'Estado Actualizado',
        text: `El estado ha sido ${newValue ? 'activado' : 'desactivado'} exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado'
      });
    }
  };

  // Filtrado de medios
  const filteredMedios = medios.filter(medio =>
    medio.NombredelMedio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medio.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      {/* Breadcrumb */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ 
          my: 2,
          '& .MuiBreadcrumbs-separator': {
            mx: 1
          },
          '& .MuiLink-root': {
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }
        }}
      >
        <Link component={RouterLink} to="/dashboard">
          Home
        </Link>
        <Typography color="text.primary">Medios</Typography>
      </Breadcrumbs>

      <div className="header-container">
      
        <div className="search-container">
          <TextField
            placeholder="Buscar..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </div>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Agregar Medio
        </Button>
      </div>

      <Paper elevation={3} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredMedios}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={loading}
          localeText={{
            noRowsLabel: 'No hay datos para mostrar',
            footerRowSelected: count => `${count} fila${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`,
            footerTotalRows: 'Filas totales:',
            footerTotalVisibleRows: (visibleCount, totalCount) => `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
            footerPaginationRowsPerPage: 'Filas por página:',
            columnMenuLabel: 'Menú',
            columnMenuShowColumns: 'Mostrar columnas',
            columnMenuFilter: 'Filtrar',
            columnMenuHideColumn: 'Ocultar',
            columnMenuUnsort: 'Desordenar',
            columnMenuSortAsc: 'Ordenar ASC',
            columnMenuSortDesc: 'Ordenar DESC',
            columnHeaderSortIconLabel: 'Ordenar',
            MuiTablePagination: {
              labelRowsPerPage: 'Filas por página:',
              labelDisplayedRows: ({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`,
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            },
          }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{medioForm.id ? 'Editar Medio' : 'Agregar Medio'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Medio"
            value={medioForm.NombredelMedio}
            onChange={(e) => setMedioForm({ ...medioForm, NombredelMedio: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NewspaperIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Código"
            value={medioForm.codigo}
            onChange={(e) => setMedioForm({ ...medioForm, codigo: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CodeIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={medioForm.Estado}
                onChange={(e) => setMedioForm({ ...medioForm, Estado: e.target.checked })}
                color="primary"
              />
            }
            label="Estado Activo"
            sx={{ marginTop: 2, marginBottom: 1 }}
          />

          {/* Campos booleanos */}
          <div className="checkbox-group">
            <FormControl component="fieldset" margin="normal">
              <div className="checkbox-container">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.duracion}
                      onChange={(e) => setMedioForm({ ...medioForm, duracion: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Duración"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.calidad}
                      onChange={(e) => setMedioForm({ ...medioForm, calidad: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Calidad"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.codigo_megatime}
                      onChange={(e) => setMedioForm({ ...medioForm, codigo_megatime: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Código Megatime"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.cooperado}
                      onChange={(e) => setMedioForm({ ...medioForm, cooperado: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Cooperado"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.color}
                      onChange={(e) => setMedioForm({ ...medioForm, color: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Color"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medioForm.rubro}
                      onChange={(e) => setMedioForm({ ...medioForm, rubro: e.target.checked })}
                      size="small"
                    />
                  }
                  label="Rubro"
                />
              </div>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} color="primary">
            {medioForm.id ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
