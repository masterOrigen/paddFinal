import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Button,
  TextField,
  InputAdornment,
  Link,
  Breadcrumbs,
  Typography,
  Switch,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { supabase } from '../../config/supabase';
import { executeWithRetry } from '../../utils/supabaseHelpers';
import './Soportes.css';

const Soportes = () => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(5);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, startDate, endDate, rows]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: soportesData, error: soportesError } = await executeWithRetry(() =>
        supabase
          .from('Soportes')
          .select(`
            id_soporte,
            nombreIdentficiador,
            bonificacion_ano,
            escala,
            estado,
            created_at,
            proveedor_soporte!inner (
              id_proveedor,
              Proveedores!inner (
                nombreProveedor
              )
            ),
            soporte_medios (
              id_medio,
              Medios (
                NombredelMedio
              )
            )
          `)
      );

      if (soportesError) throw soportesError;

      const soporteIds = (soportesData || []).map(soporte => soporte.id_soporte);

      let programasMap = {};

      if (soporteIds.length > 0) {
        const { data: programasData, error: programasError } = await executeWithRetry(() =>
          supabase
            .from('Programas')
            .select('soporte_id, descripcion')
            .in('soporte_id', soporteIds)
            .eq('estado', true)
        );

        if (programasError) throw programasError;

        programasMap = (programasData || []).reduce((acc, programa) => {
          if (!acc[programa.soporte_id]) {
            acc[programa.soporte_id] = [];
          }
          acc[programa.soporte_id].push(programa);
          return acc;
        }, {});
      }

      const soportesConProgramas = (soportesData || []).map(soporte => ({
        ...soporte,
        programas: programasMap[soporte.id_soporte] || []
      }));

      const formattedRows = soportesConProgramas.map(soporte => ({
        id: soporte.id_soporte,
        nombreIdentficiador: soporte.nombreIdentficiador,
        bonificacion_ano: soporte.bonificacion_ano,
        escala: soporte.escala,
        estado: soporte.estado,
        nombreProveedor: soporte.proveedor_soporte[0]?.Proveedores?.nombreProveedor || 'Sin Proveedor',
        id_proveedor: soporte.proveedor_soporte[0]?.id_proveedor,
        medios: soporte.soporte_medios?.map(sm => sm.Medios?.NombredelMedio).filter(Boolean).join(', ') || 'Sin medios',
        programas: soporte.programas?.map(p => p.descripcion).filter(Boolean).join(', ') || 'Sin programas',
        fechaCreacion: new Date(soporte.created_at).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        created_at: soporte.created_at
      }));

      setRows(formattedRows);
      setFilteredRows(formattedRows);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...rows];

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        row.nombreIdentficiador?.toLowerCase().includes(searchTermLower) ||
        row.nombreProveedor?.toLowerCase().includes(searchTermLower)
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(row => {
        const rowDate = new Date(row.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return rowDate >= start && rowDate <= end;
      });
    }

    setFilteredRows(filtered);
  };

  const handleExportToExcel = () => {
    const exportData = filteredRows.map(row => ({
      'Fecha Creación': row.fechaCreacion,
      'Identificador': row.nombreIdentficiador,
      'Programas': row.programas,
      'Proveedor': row.nombreProveedor,
      'Bonificación Año': row.bonificacion_ano,
      'Escala': row.escala,
      'Medios': row.medios,
      'Estado': row.estado ? 'Activo' : 'Inactivo'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Soportes');

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 15 }, // Fecha
      { wch: 20 }, // Identificador
      { wch: 30 }, // Programas
      { wch: 30 }, // Proveedor
      { wch: 15 }, // Bonificación
      { wch: 15 }, // Escala
      { wch: 20 }, // Medios
      { wch: 10 }  // Estado
    ];
    ws['!cols'] = colWidths;

    const fileName = searchTerm || startDate || endDate ?
      'Soportes_Filtrados.xlsx' :
      'Todos_Los_Soportes.xlsx';

    XLSX.writeFile(wb, fileName);
  };

  const handleEstadoChange = async (event, id) => {
    try {
      const newEstado = event.target.checked;
      const { error } = await supabase
        .from('Soportes')
        .update({ estado: newEstado })
        .eq('id_soporte', id);

      if (error) throw error;

      setRows(rows.map(row =>
        row.id === id ? { ...row, estado: newEstado } : row
      ));
      setFilteredRows(filteredRows.map(row =>
        row.id === id ? { ...row, estado: newEstado } : row
      ));

      await Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El soporte ha sido ${newEstado ? 'activado' : 'desactivado'}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating estado:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del soporte'
      });
    }
  };

  const columns = [
    {
      field: 'nombreIdentficiador',
      headerName: 'Identificador',
      width: 150,
      headerClassName: 'data-grid-header',
      flex: 1
    },
    {
      field: 'fechaCreacion',
      headerName: 'Fecha Creación',
      width: 120,
      headerClassName: 'data-grid-header'
    },
    {
      field: 'nombreProveedor',
      headerName: 'Proveedor',
      width: 200,
      headerClassName: 'data-grid-header',
      flex: 1
    },
    {
      field: 'medios',
      headerName: 'Medios',
      width: 200,
      headerClassName: 'data-grid-header',
      flex: 1.5
    },
    {
      field: 'bonificacion_ano',
      headerName: 'Bonificación Año',
      width: 150,
      headerClassName: 'data-grid-header'
    },
    {
      field: 'escala',
      headerName: 'Escala',
      width: 120,
      headerClassName: 'data-grid-header'
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 80,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleEstadoChange(e, params.row.id)}
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
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <div className="action-buttons">
          <IconButton
            size="small"
            className="view-button"
            onClick={() => navigate(`/proveedores/view/${params.row.id_proveedor}`)}
          >
            <i className="fas fa-eye"></i>
          </IconButton>
        </div>
      )
    }
  ];

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSave = async () => {
    try {
      // Aquí va la lógica para guardar el soporte
    } catch (error) {
      console.error('Error saving soporte:', error);
    }
  };

  return (
    <div className="soportes-container">
      <div className="header">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          className="breadcrumb"
        >
          <Link component={RouterLink} to="/dashboard">
            Home
          </Link>
          <Typography color="text.primary">Soportes</Typography>
        </Breadcrumbs>

        <div className="header-content">
          <Typography variant="h5" component="h1">
            Listado de Soportes
          </Typography>

        </div>

        <Grid container spacing={3} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar soporte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#6777ef' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#666' }
              }}
              InputProps={{
                sx: {
                  paddingLeft: '12px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="date"
              variant="outlined"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#666' }
              }}
              InputProps={{
                sx: {
                  paddingLeft: '12px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6777ef',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6777ef',
                  },
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={handleExportToExcel}
              startIcon={<FileDownloadIcon />}
              fullWidth
              sx={{
                backgroundColor: '#206e43',
                color: '#fff',
                height: '40px',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#185735',
                },
              }}
            >
              Exportar Soportes
            </Button>
          </Grid>
        </Grid>

      </div>

      <div className="data-grid-container">
        <DataGrid
          getRowId={(row) => row.id}
          rows={filteredRows}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[5, 10, 25]}
          disableSelectionOnClick
          loading={loading}
          autoHeight
          localeText={{
            noRowsLabel: 'No hay datos para mostrar',
            footerRowSelected: count => `${count} fila${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`,
            footerTotalRows: 'Filas totales:',
            footerTotalVisibleRows: (visibleCount, totalCount) =>
              `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
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
          pageSizeOptions={[5, 10, 25]}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        />
      </div>

      {/* Modal de Nuevo/Editar Soporte */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Editar Soporte' : 'Nuevo Soporte'}
        </DialogTitle>
        <DialogContent>
          {/* ... tu contenido del modal ... */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Soportes;
