import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Button, 
  Container,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormControlLabel,
  Switch,
  InputAdornment,
  Breadcrumbs,
  Link,
  Box,
  Paper,
  CircularProgress
} from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { supabase } from '../../config/supabase';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import './Proveedores.css';

const Proveedores = () => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regiones, setRegiones] = useState({});
  const [todasLasComunas, setTodasLasComunas] = useState([]);
  const [comunasFiltradas, setComunasFiltradas] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [newProveedor, setNewProveedor] = useState({
    nombreProveedor: '',
    razonSocial: '',
    nombreFantasia: '',
    rutProveedor: '',
    giroProveedor: '',
    nombreRepresentante: '',
    rutRepresentante: '',
    direccionFacturacion: '',
    id_region: '',
    id_comuna: '',
    telCelular: '',
    telFijo: '',
    email: '',
    estado: true,
    nombreIdentificador: '',
    bonificacion_ano: '',
    escala_rango: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validarRut = (rut) => {
    if (!rut) return false;
    
    // Limpiar el RUT de puntos y guión
    let valor = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Aislar Cuerpo y Dígito Verificador
    let cuerpo = valor.slice(0, -1);
    let dv = valor.slice(-1).toUpperCase();
    
    // Si no cumple con el mínimo de dígitos, es inválido
    if (cuerpo.length < 7) return false;
    
    // Calcular Dígito Verificador esperado
    let suma = 0;
    let multiplo = 2;
    
    // Para cada dígito del Cuerpo
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += Number(cuerpo[i]) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }
    
    // Calcular Dígito Verificador
    let dvEsperado = 11 - (suma % 11);
    
    // Casos Especiales
    if (dvEsperado === 11) dvEsperado = '0';
    if (dvEsperado === 10) dvEsperado = 'K';
    else dvEsperado = String(dvEsperado);
    
    // Validar que el Dígito Verificador ingresado sea igual al esperado
    return dv === dvEsperado;
  };

  const validarEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
  };

  const validarTelefonoCelular = (telefono) => {
    const re = /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/;
    return re.test(telefono);
  };

  const validarTelefonoFijo = (telefono) => {
    const re = /^(\+?56)?(\s?)([2-9]\d{7,8})$/;
    return re.test(telefono);
  };

  const validarFormulario = (proveedorData) => {
    const newErrors = {};

    // Validar RUT Proveedor
    if (!validarRut(proveedorData.rutProveedor)) {
      newErrors.rutProveedor = 'RUT inválido';
    }

    // Validar RUT Representante
    if (!validarRut(proveedorData.rutRepresentante)) {
      newErrors.rutRepresentante = 'RUT inválido';
    }

    // Validar Email
    if (!validarEmail(proveedorData.email)) {
      newErrors.email = 'Correo electrónico inválido';
    }

    // Validar teléfonos
    const celularValido = !proveedorData.telCelular || validarTelefonoCelular(proveedorData.telCelular);
    const fijoValido = !proveedorData.telFijo || validarTelefonoFijo(proveedorData.telFijo);

    if (proveedorData.telCelular && !celularValido) {
      newErrors.telCelular = 'Formato inválido para celular chileno';
    }

    if (proveedorData.telFijo && !fijoValido) {
      newErrors.telFijo = 'Formato inválido para teléfono fijo chileno';
    }

    // Validar que al menos un teléfono esté presente y sea válido
    if (!proveedorData.telCelular && !proveedorData.telFijo) {
      newErrors.telefono = 'Se requiere al menos un teléfono';
    } else if (proveedorData.telCelular && !celularValido && proveedorData.telFijo && !fijoValido) {
      newErrors.telefono = 'Al menos un teléfono debe tener formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, startDate, endDate, rows]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener proveedores y contar sus soportes
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('Proveedores')
        .select(`
          *,
          proveedor_soporte:proveedor_soporte(count)
        `);

      if (proveedoresError) throw proveedoresError;

      const { data: regionesData } = await supabase
        .from('Region')
        .select('*');

      const { data: comunasData } = await supabase
        .from('Comunas')
        .select('*');

      // Convertir regiones a objeto para fácil acceso
      const regionesObj = regionesData.reduce((acc, region) => {
        acc[region.id] = region.nombreRegion;
        return acc;
      }, {});

      setRegiones(regionesObj);
      setTodasLasComunas(comunasData);

      // Inicialmente mostramos todas las comunas
      const comunasObj = comunasData.reduce((acc, comuna) => {
        acc[comuna.id_comuna] = comuna.nombreComuna;
        return acc;
      }, {});
      setComunasFiltradas(comunasObj);

      const formattedRows = proveedoresData.map(proveedor => {
        const fecha = new Date(proveedor.created_at);
        return {
          ...proveedor,
          id: proveedor.id_proveedor,
          region: regionesObj[proveedor.id_region] || '',
          comuna: comunasData.find(c => c.id_comuna === proveedor.id_comuna)?.nombreComuna || '',
          fecha_formateada: fecha.toLocaleString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          num_soportes: proveedor.proveedor_soporte?.[0]?.count || 0
        };
      });

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
        row.nombreProveedor?.toLowerCase().includes(searchTermLower) ||
        row.nombreIdentificador?.toLowerCase().includes(searchTermLower) ||
        row.rutProveedor?.toLowerCase().includes(searchTermLower)
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
      'Identificador': row.nombreIdentificador,
      'Proveedor': row.nombreProveedor,
      'Nombre Fantasía': row.nombreFantasia,
      'RUT': row.rutProveedor,
      'Giro': row.giroProveedor,
      'Representante': row.nombreRepresentante,
      'RUT Representante': row.rutRepresentante,
      'Razón Social': row.razonSocial,
      'Dirección': row.direccionFacturacion,
      'Región': row.region,
      'Comuna': row.comuna,
      'Teléfono Celular': row.telCelular,
      'Teléfono Fijo': row.telFijo,
      'Email': row.email,
      'Estado': row.estado ? 'Activo' : 'Inactivo',
      'Fecha Creación': row.fecha_formateada,
      'N° Soportes': row.num_soportes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    XLSX.writeFile(wb, 'Proveedores.xlsx');
  };

  const handleEstadoChange = async (event, id) => {
    try {
      const newEstado = event.target.checked;
      const { error } = await supabase
        .from('Proveedores')
        .update({ estado: newEstado })
        .eq('id_proveedor', id);

      if (error) throw error;

      // Actualizar el estado en la interfaz
      setRows(rows.map(row =>
        row.id === id ? { ...row, estado: newEstado } : row
      ));
      setFilteredRows(filteredRows.map(row =>
        row.id === id ? { ...row, estado: newEstado } : row
      ));

      await Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El proveedor ha sido ${newEstado ? 'activado' : 'desactivado'}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating estado:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del proveedor'
      });
    }
  };

  const columns = [
    {
      field: 'nombreIdentificador',
      headerName: 'Nombre',
      width: 150,
      flex: 1
    },
    { 
      field: 'razonSocial', 
      headerName: 'Razón Social', 
      width: 150,
      flex: 1
    },
    { 
      field: 'rutProveedor', 
      headerName: 'RUT', 
      width: 120
    },
    { 
      field: 'region', 
      headerName: 'Región', 
      width: 130,
      flex: 1
    },
    { 
      field: 'comuna', 
      headerName: 'Comuna', 
      width: 130
    },
    {
      field: 'fecha_formateada',
      headerName: 'Fecha Creación',
      width: 160,
      renderCell: (params) => {
        return params.value;
      }
    },
    {
      field: 'num_soportes',
      headerName: 'N° Soportes',
      width: 100,
      type: 'number',
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={params.value}
          onChange={(e) => handleEstadoChange(e, params.row.id_proveedor)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 140,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <div className="action-buttons">
          <IconButton 
            size="small" 
            className="view-button"
            onClick={() => navigate(`/proveedores/view/${params.row.id}`)}
          >
            <i className="fas fa-eye"></i>
          </IconButton>
          <IconButton 
            size="small" 
            className="edit-button"
            onClick={() => handleEdit(params.row)}
          >
            <i className="fas fa-edit"></i>
          </IconButton>
          <IconButton
            size="small"
            className="delete-button"
            onClick={() => handleDelete(params.row.id)}
          >
            <i className="fas fa-trash-alt"></i>
          </IconButton>
        </div>
      )
    }
  ];

  const handleEdit = (row) => {
    setSelectedProveedor(row);
    setNewProveedor({
      nombreProveedor: row.nombreProveedor,
      razonSocial: row.razonSocial,
      nombreFantasia: row.nombreFantasia,
      rutProveedor: row.rutProveedor,
      giroProveedor: row.giroProveedor,
      nombreRepresentante: row.nombreRepresentante,
      rutRepresentante: row.rutRepresentante,
      direccionFacturacion: row.direccionFacturacion,
      id_region: row.id_region,
      id_comuna: row.id_comuna,
      telCelular: row.telCelular,
      telFijo: row.telFijo,
      email: row.email,
      estado: row.estado,
      nombreIdentificador: row.nombreIdentificador,
      bonificacion_ano: row.bonificacion_ano,
      escala_rango: row.escala_rango
    });
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('Proveedores')
            .delete()
            .eq('id_proveedor', id);
          
          if (error) throw error;
          
          setRows(rows.filter(row => row.id !== id));
          setFilteredRows(filteredRows.filter(row => row.id !== id));
          
          Swal.fire(
            'Eliminado',
            'El proveedor ha sido eliminado.',
            'success'
          );
        } catch (error) {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el proveedor'
          });
        }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'id_region') {
      // Cuando se selecciona una región, filtramos las comunas
      const comunasFiltradas = todasLasComunas
        .filter(comuna => comuna.id_region === parseInt(value))
        .reduce((acc, comuna) => {
          acc[comuna.id_comuna] = comuna.nombreComuna;
          return acc;
        }, {});
      
      setComunasFiltradas(comunasFiltradas);
      
      // Actualizar el estado correcto según si estamos editando o creando
      if (selectedProveedor) {
        setSelectedProveedor(prev => ({
          ...prev,
          [name]: value,
          id_comuna: ''
        }));
      } else {
        setNewProveedor(prev => ({
          ...prev,
          [name]: value,
          id_comuna: ''
        }));
      }
    } else {
      // Para otros campos, actualizar el estado correcto
      if (selectedProveedor) {
        setSelectedProveedor(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        setNewProveedor(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      const proveedorData = selectedProveedor ? selectedProveedor : newProveedor;
      
      // Validar antes de guardar
      if (!validarFormulario(proveedorData)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Por favor, corrija los errores antes de guardar'
        });
        return;
      }

      setIsSaving(true);
      
      // Extraer solo los campos que necesitamos para la base de datos
      const dataToSave = {
        nombreProveedor: proveedorData.nombreProveedor,
        razonSocial: proveedorData.razonSocial,
        nombreFantasia: proveedorData.nombreFantasia,
        rutProveedor: proveedorData.rutProveedor,
        giroProveedor: proveedorData.giroProveedor,
        nombreRepresentante: proveedorData.nombreRepresentante,
        rutRepresentante: proveedorData.rutRepresentante,
        direccionFacturacion: proveedorData.direccionFacturacion,
        id_region: proveedorData.id_region,
        id_comuna: proveedorData.id_comuna,
        telCelular: proveedorData.telCelular,
        telFijo: proveedorData.telFijo,
        email: proveedorData.email,
        estado: proveedorData.estado,
        nombreIdentificador: proveedorData.nombreIdentificador,
        bonificacion_ano: proveedorData.bonificacion_ano,
        escala_rango: proveedorData.escala_rango
      };

      if (selectedProveedor) {
        const { error } = await supabase
          .from('Proveedores')
          .update(dataToSave)
          .eq('id_proveedor', selectedProveedor.id_proveedor);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('Proveedores')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await fetchData();
      setOpenModal(false);
      setSelectedProveedor(null);
      setNewProveedor({
        nombreProveedor: '',
        razonSocial: '',
        nombreFantasia: '',
        rutProveedor: '',
        giroProveedor: '',
        nombreRepresentante: '',
        rutRepresentante: '',
        direccionFacturacion: '',
        id_region: '',
        id_comuna: '',
        telCelular: '',
        telFijo: '',
        email: '',
        estado: true,
        nombreIdentificador: '',
        bonificacion_ano: '',
        escala_rango: ''
      });

      Swal.fire({
        icon: 'success',
        title: 'Proveedor guardado',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el proveedor'
      });
    } finally {
      setIsSaving(false); // Finalizar el estado de carga independientemente del resultado
    }
  };

  return (
    <div className="proveedores-container">
      <div className="header">
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          className="breadcrumb"
        >
          <Link component={RouterLink} to="/dashboard">
            Home
          </Link>
          <Typography color="text.primary">Proveedores</Typography>
        </Breadcrumbs>

        <div className="header-content">
          <Typography variant="h5" component="h1">
            Listado de Proveedores
          </Typography>
          <Button
            variant="contained"
            className="btn-agregar"
            onClick={() => {
              setSelectedProveedor(null);
              setNewProveedor({
                nombreProveedor: '',
                razonSocial: '',
                nombreFantasia: '',
                rutProveedor: '',
                giroProveedor: '',
                nombreRepresentante: '',
                rutRepresentante: '',
                direccionFacturacion: '',
                id_region: '',
                id_comuna: '',
                telCelular: '',
                telFijo: '',
                email: '',
                estado: true,
                nombreIdentificador: '',
                bonificacion_ano: '',
                escala_rango: ''
              });
              setOpenModal(true);
            }}
          >
            Agregar Proveedor
          </Button>
        </div>

        <Grid container spacing={3} style={{ marginBottom: '20px' }}>
          <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
            startAdornment: (
              <InputAdornment position="start">
              <SearchIcon sx={{ color: '#6777ef' }}/>
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
            sx={{
            backgroundColor: '#206e43',
            color: '#fff',
            height: '72%',
            width: '80%',
            '&:hover': {
              backgroundColor: '#185735',
            },
            }}
          >
            Exportar Proveedores
          </Button>
          </Grid>
        </Grid>

      </div>

      <div className="data-grid-container">
        <DataGrid
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

      {/* Modal de Nuevo/Editar Proveedor */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Proveedor"
                name="nombreProveedor"
                value={selectedProveedor?.nombreProveedor || newProveedor.nombreProveedor}
                onChange={handleInputChange}
                error={!!errors.nombreProveedor}
                helperText={errors.nombreProveedor}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Fantasía"
                name="nombreFantasia"
                value={selectedProveedor?.nombreFantasia || newProveedor.nombreFantasia}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="RUT Proveedor"
                name="rutProveedor"
                value={selectedProveedor?.rutProveedor || newProveedor.rutProveedor}
                onChange={handleInputChange}
                error={!!errors.rutProveedor}
                helperText={errors.rutProveedor}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razón Social"
                name="razonSocial"
                value={selectedProveedor?.razonSocial || newProveedor.razonSocial}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre Representante"
                name="nombreRepresentante"
                value={selectedProveedor?.nombreRepresentante || newProveedor.nombreRepresentante}
                onChange={handleInputChange}
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
                label="RUT Representante"
                name="rutRepresentante"
                value={selectedProveedor?.rutRepresentante || newProveedor.rutRepresentante}
                onChange={handleInputChange}
                error={!!errors.rutRepresentante}
                helperText={errors.rutRepresentante}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Dirección Facturación"
                name="direccionFacturacion"
                value={selectedProveedor?.direccionFacturacion || newProveedor.direccionFacturacion}
                onChange={handleInputChange}
                error={!!errors.direccionFacturacion}
                helperText={errors.direccionFacturacion}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="region-label">Región</InputLabel>
                <Select
                  labelId="region-label"
                  name="id_region"
                  value={selectedProveedor?.id_region || newProveedor.id_region}
                  onChange={handleInputChange}
                  input={
                    <OutlinedInput
                      label="Región"
                      startAdornment={
                        <InputAdornment position="start">
                          <ApartmentIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.keys(regiones).map((region, index) => (
                    <MenuItem key={index} value={region}>
                      {regiones[region]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="comuna-label">Comuna</InputLabel>
                <Select
                  labelId="comuna-label"
                  name="id_comuna"
                  value={selectedProveedor?.id_comuna || newProveedor.id_comuna}
                  onChange={handleInputChange}
                  disabled={!(selectedProveedor?.id_region || newProveedor.id_region)}
                  input={
                    <OutlinedInput
                      label="Comuna"
                      startAdornment={
                        <InputAdornment position="start">
                          <LocationOnIcon />
                        </InputAdornment>
                      }
                    />
                  }
                >
                  {Object.keys(comunasFiltradas).map((comuna, index) => (
                    <MenuItem key={index} value={comuna}>
                      {comunasFiltradas[comuna]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Celular"
                name="telCelular"
                value={selectedProveedor?.telCelular || newProveedor.telCelular}
                onChange={handleInputChange}
                error={!!errors.telCelular}
                helperText={errors.telCelular || 'Formato: +569XXXXXXXX'}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono Fijo"
                name="telFijo"
                value={selectedProveedor?.telFijo || newProveedor.telFijo}
                onChange={handleInputChange}
                error={!!errors.telFijo}
                helperText={errors.telFijo || 'Formato: +562XXXXXXX'}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {errors.telefono && (
              <Grid item xs={12}>
                <Typography color="error" variant="caption">
                  {errors.telefono}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={selectedProveedor?.email || newProveedor.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Identificador"
                name="nombreIdentificador"
                value={selectedProveedor?.nombreIdentificador || newProveedor.nombreIdentificador}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bonificación Año"
                name="bonificacion_ano"
                value={selectedProveedor?.bonificacion_ano || newProveedor.bonificacion_ano}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Escala Rango"
                name="escala_rango"
                value={selectedProveedor?.escala_rango || newProveedor.escala_rango}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedProveedor ? selectedProveedor.estado : newProveedor.estado}
                    onChange={(e) => {
                      if (selectedProveedor) {
                        setSelectedProveedor({
                          ...selectedProveedor,
                          estado: e.target.checked
                        });
                      } else {
                        setNewProveedor({
                          ...newProveedor,
                          estado: e.target.checked
                        });
                      }
                    }}
                    color="primary"
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Proveedores;
