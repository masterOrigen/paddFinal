import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import './ReporteOrdenDeCompra.css';
import { Pagination } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ReporteOrdenDeCompra = () => {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: '',
    campana: '',
    estado: '',
    fechaInicio: null,
    fechaFin: null
  });
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [filteredCampanas, setFilteredCampanas] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
  }, []);

  useEffect(() => {
    if (filtros.cliente) {
      const campanasDelCliente = campanas.filter(
        campana => campana.id_Cliente === filtros.cliente
      );
      setFilteredCampanas(campanasDelCliente);
      
      // Si la campaña seleccionada no pertenece al cliente actual, reset
      if (filtros.campana && !campanasDelCliente.some(c => c.id_campania === filtros.campana)) {
        setFiltros(prev => ({ ...prev, campana: '' }));
      }
    } else {
      setFilteredCampanas([]);
    }
  }, [filtros.cliente, campanas]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente')
        .order('nombreCliente');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampanas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Campania')
        .select('id_campania, NombreCampania, Presupuesto, id_Cliente')
        .order('NombreCampania');

      if (error) throw error;
      setCampanas(data || []);
    } catch (error) {
      console.error('Error al cargar campañas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const buscarOrdenes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('OrdenesDePublicidad')
        .select(`
          id_ordenes_de_comprar,
          fechaCreacion,
          created_at,
          numero_correlativo,
          estado,
          copia,
          usuario_registro,
          alternativas_plan_orden,
          OrdenesUsuarios!left (id_orden_usuario, fecha_asignacion, estado,
            Usuarios (id_usuario, Nombre, Email, id_grupo,
              Grupos (id_grupo, nombre_grupo)
            )
          ),
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto,Presupuesto,
            Clientes (id_cliente, nombreCliente, RUT, razonSocial),
            Productos!id_Producto (id, NombreDelProducto)
          ),
          Contratos (id, NombreContrato, num_contrato, id_FormadePago, IdProveedor,
            FormaDePago (id, NombreFormadePago),
            Proveedores (id_proveedor, nombreProveedor, rutProveedor)
          ),
          Soportes (id_soporte, nombreIdentficiador),
          plan (id, nombre_plan, anio, mes,
            Anios!anio (id, years),
            Meses (Id, Nombre)
          )
        `);

      // Aplicar filtros
      if (filtros.cliente) {
        query = query.eq('Campania.id_Cliente', filtros.cliente);
      }
      
      if (filtros.campana) {
        query = query.eq('Campania.id_campania', filtros.campana);
      }

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      // Aplicar filtro de fecha inicio
      if (filtros.fechaInicio) {
        const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
        query = query.gte('fechaCreacion', fechaInicioFormateada);
        console.log("Filtrando desde:", fechaInicioFormateada);
      }

      // Aplicar filtro de fecha fin
      if (filtros.fechaFin) {
        const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
        query = query.lte('fechaCreacion', fechaFinFormateada);
        console.log("Filtrando hasta:", fechaFinFormateada);
      }

      const { data, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      setOrdenes(data || []);
    } catch (error) {
      console.error('Error al buscar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: '',
      campana: '',
      estado: '',
      fechaInicio: null,
      fechaFin: null
    });
  };

  const calcularTotalOrden = (alternativas) => {
    return alternativas.reduce((total, alt) => total + (alt.valor_total || 0), 0);
  };

  const exportarExcel = () => {
    const dataToExport = ordenes.map(orden => mapearDatosOrden(orden));

    // Crear y descargar el archivo Excel
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte_ordenes.xlsx');
  };

  const mapearDatosOrden = (orden) => ({
    'Razón Social CLIENTE': orden.Campania?.Clientes?.razonSocial || '',
    'Cliente': orden.Campania?.Clientes?.nombreCliente || '',
    'AÑO': orden.plan?.Anios?.years || '',
    'Mes': orden.plan?.Meses?.Nombre || '',
    'N° de Ctto.': orden.Contratos?.num_contrato || '',
    'N° de Orden': orden.numero_correlativo || '',
    'Versión': orden.copia || '',
    'Medio': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'Razón Soc.Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'RUT Prov.': orden.Contratos?.Proveedores?.rutProveedor || '',
    'Soporte': orden.Soportes?.nombreIdentficiador || '',
    'Campaña': orden.Campania?.NombreCampania || '',
    'OC Cliente': orden.numero_correlativo || '',
    'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
    'Age.Crea': orden.usuario_registro?.nombre || '',
    'Inversion neta': orden.Campania?.Presupuesto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(orden.Campania.Presupuesto) : '',
    'N° Fact.Prov.': '',
    'Fecha Fact.Prov.': '',
    'N° Fact.Age.': '',
    'Fecha Fact.Age.': '',
    'Monto Neto Fact.': '',
    'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
    'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
    'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
    'Estado': orden.estado || ''
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const mostrarEstado = (estado) => {
    if (!estado || estado === '') {
      return 'ACTIVA';
    } else if (estado === 'anulada') {
      return 'ANULADA';
    } else if (estado === 'activa') {
      return 'ACTIVA';
    } else if(estado === null) {
      return 'ACTIVA';
    }
  };

  const paginatedOrdenes = ordenes.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Reporte de Órdenes
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Cliente</InputLabel>
              <Select
                value={filtros.cliente}
                label="Cliente"
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombreCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Campaña</InputLabel>
              <Select
                value={filtros.campana}
                label="Campaña"
                onChange={(e) => handleFiltroChange('campana', e.target.value)}
                disabled={!filtros.cliente}
              >
                <MenuItem value="">Todas</MenuItem>
                {filteredCampanas.map((campana) => (
                  <MenuItem key={campana.id_campania} value={campana.id_campania}>
                    {campana.NombreCampania}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                label="Estado"
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="activa">Activa</MenuItem>
                <MenuItem value="anulada">Anulada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={filtros.fechaInicio}
                onChange={(newValue) => handleFiltroChange('fechaInicio', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      '& .MuiInputBase-input': {
                        textAlign: 'left'
                      }
                    }
                  }
                }}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={filtros.fechaFin}
                onChange={(newValue) => handleFiltroChange('fechaFin', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      '& .MuiInputBase-input': {
                        textAlign: 'left'
                      }
                    }
                  }
                }}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={buscarOrdenes}
              disabled={loading}
              sx={{ mr: 1, height: 40 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={limpiarFiltros}
              sx={{ height: 40 }}
              fullWidth
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          {ordenes.length > 0 && (
            <Button variant="contained" color="success" onClick={exportarExcel}>
              Exportar a Excel
            </Button>
          )}
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resultados
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : ordenes.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>RAZÓN SOCIAL</TableCell>
                    <TableCell>CLIENTE</TableCell>
                    <TableCell>AÑO</TableCell>
                    <TableCell>MES</TableCell>
                    <TableCell>N° DE CTTO.</TableCell>
                    <TableCell>N° DE ORDEN</TableCell>
                    <TableCell>VERSIÓN</TableCell>
                    <TableCell>MEDIO</TableCell>
                    <TableCell>RAZÓN SOC. PROVEEDOR</TableCell>
                    <TableCell>PROVEEDOR</TableCell>
                    <TableCell>RUT PROV.</TableCell>
                    <TableCell>SOPORTE</TableCell>
                    <TableCell>CAMPAÑA</TableCell>
                    <TableCell>OC CLIENTE</TableCell>
                    <TableCell>PRODUCTO</TableCell>
                    <TableCell>AGE. CREA</TableCell>
                    <TableCell>INVERSIÓN NETA</TableCell>
                    <TableCell>N° FACT. PROV.</TableCell>
                    <TableCell>FECHA FACT. PROV.</TableCell>
                    <TableCell>N° FACT. AGE.</TableCell>
                    <TableCell>FECHA FACT. AGE.</TableCell>
                    <TableCell>MONTO NETO FACT.</TableCell>
                    <TableCell>TIPO CTTO.</TableCell>
                    <TableCell>USUARIO</TableCell>
                    <TableCell>GRUPO</TableCell>
                    <TableCell>ESTADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden) => (
                    <TableRow key={orden.id_ordenes_de_comprar}>
                      <TableCell>{orden.Campania?.Clientes?.razonSocial || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.Clientes?.nombreCliente || 'NA'}</TableCell>
                      <TableCell>{orden.plan?.Anios?.years || 'NA'}</TableCell>
                      <TableCell>{orden.plan?.Meses?.Nombre || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.num_contrato || 'NA'}</TableCell>
                      <TableCell>{orden.numero_correlativo || 'NA'}</TableCell>
                      <TableCell>{orden.copia || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.rutProveedor || 'NA'}</TableCell>
                      <TableCell>{orden.Soportes?.nombreIdentficiador || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.NombreCampania || 'NA'}</TableCell>
                      <TableCell>{orden.numero_correlativo || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.Productos?.NombreDelProducto || 'NA'}</TableCell>
                      <TableCell>{orden.usuario_registro?.nombre || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.Presupuesto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(orden.Campania.Presupuesto) : 'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.NombreContrato || 'NA'}</TableCell>
                      <TableCell>{orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || 'NA'}</TableCell>
                      <TableCell>{orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || 'NA'}</TableCell>
                      <TableCell>{mostrarEstado(orden.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(ordenes.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No se encontraron órdenes con los filtros seleccionados
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ReporteOrdenDeCompra;