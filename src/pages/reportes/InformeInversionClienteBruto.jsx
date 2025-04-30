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
import { Pagination } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const InformeInversionClienteBruto = () => {
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

      if (filtros.cliente) {
        query = query.eq('Campania.id_Cliente', filtros.cliente);
      }
      
      if (filtros.campana) {
        query = query.eq('Campania.id_campania', filtros.campana);
      }

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.fechaInicio) {
        const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
        query = query.gte('fechaCreacion', fechaInicioFormateada);
      }

      if (filtros.fechaFin) {
        const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
        query = query.lte('fechaCreacion', fechaFinFormateada);
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

  const exportarExcel = () => {
    const dataToExport = ordenes.map(orden => mapearDatosOrden(orden));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe Inversión Cliente Bruto');
    XLSX.writeFile(wb, 'informe_inversion_cliente_bruto.xlsx');
  };

  const mapearDatosOrden = (orden) => ({
    'Razón Social Cliente': orden.Campania?.Clientes?.razonSocial || '',
    'AÑO': orden.plan?.Anios?.years || '',
    'Mes': orden.plan?.Meses?.Nombre || '',
    'N° de Ctto.': orden.Contratos?.num_contrato || '',
    'N° de Orden': orden.numero_correlativo || '',
    'Versión': orden.copia || '',
    'Medio': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'Razón Soc.Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
    'RUT Prov.': orden.Contratos?.Proveedores?.rutProveedor || '',
    'Soporte': orden.Soportes?.nombreIdentficiador || '',
    'Campaña': orden.Campania?.NombreCampania || '',
    'OC Cliente': orden.numero_correlativo || '',
    'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
    'Age.Crea': orden.usuario_registro?.nombre || '',
    'Inv.Bruta': orden.Campania?.Presupuesto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(orden.Campania.Presupuesto) : '',
    'N° Fact.Prov.': '',
    'Fecha Fact.Prov.': '',
    'N° Fact.Age.': '',
    'Fecha Fact.Age.': '',
    'Monto Neto Ft': '',
    'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
    'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
    'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || ''
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Informe de Inversión Cliente Bruto
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={filtros.cliente}
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                displayEmpty
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                }}
              >
                <MenuItem value="" disabled>Cliente</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombreCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={filtros.campana}
                onChange={(e) => handleFiltroChange('campana', e.target.value)}
                displayEmpty
                disabled={!filtros.cliente}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                }}
              >
                <MenuItem value="" disabled>Campaña</MenuItem>
                {filteredCampanas.map((campana) => (
                  <MenuItem key={campana.id_campania} value={campana.id_campania}>
                    {campana.NombreCampania}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                value={filtros.fechaInicio}
                onChange={(newValue) => handleFiltroChange('fechaInicio', newValue)}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { minWidth: 350 },
                    placeholder: "Fecha Inicio",
                    InputLabelProps: { shrink: false }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                value={filtros.fechaFin}
                onChange={(newValue) => handleFiltroChange('fechaFin', newValue)}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { minWidth: 350 },
                    placeholder: "Fecha Fin",
                    InputLabelProps: { shrink: false }
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" onClick={buscarOrdenes} disabled={loading}>
            Buscar
          </Button>
          <Button variant="outlined" onClick={limpiarFiltros} disabled={loading}>
            Limpiar Filtros
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={exportarExcel}
            disabled={loading || ordenes.length === 0}
          >
            Exportar a Excel
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Razón Social Cliente</TableCell>
                    <TableCell>AÑO</TableCell>
                    <TableCell>Mes</TableCell>
                    <TableCell>N° de Ctto.</TableCell>
                    <TableCell>N° de Orden</TableCell>
                    <TableCell>Versión</TableCell>
                    <TableCell>Medio</TableCell>
                    <TableCell>Razón Soc.Proveedor</TableCell>
                    <TableCell>RUT Prov.</TableCell>
                    <TableCell>Soporte</TableCell>
                    <TableCell>Campaña</TableCell>
                    <TableCell>OC Cliente</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Age.Crea</TableCell>
                    <TableCell>Inv.Bruta</TableCell>
                    <TableCell>N° Fact.Prov.</TableCell>
                    <TableCell>Fecha Fact.Prov.</TableCell>
                    <TableCell>N° Fact.Age.</TableCell>
                    <TableCell>Fecha Fact.Age.</TableCell>
                    <TableCell>Monto Neto Ft</TableCell>
                    <TableCell>Tipo Ctto.</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Grupo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenes
                    .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                    .map((orden) => (
                      <TableRow key={orden.id_ordenes_de_comprar}>
                        <TableCell>{orden.Campania?.Clientes?.razonSocial}</TableCell>
                        <TableCell>{orden.plan?.Anios?.years}</TableCell>
                        <TableCell>{orden.plan?.Meses?.Nombre}</TableCell>
                        <TableCell>{orden.Contratos?.num_contrato}</TableCell>
                        <TableCell>{orden.numero_correlativo}</TableCell>
                        <TableCell>{orden.copia}</TableCell>
                        <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor}</TableCell>
                        <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor}</TableCell>
                        <TableCell>{orden.Contratos?.Proveedores?.rutProveedor}</TableCell>
                        <TableCell>{orden.Soportes?.nombreIdentficiador}</TableCell>
                        <TableCell>{orden.Campania?.NombreCampania}</TableCell>
                        <TableCell>{orden.numero_correlativo}</TableCell>
                        <TableCell>{orden.Campania?.Productos?.NombreDelProducto}</TableCell>
                        <TableCell>{orden.usuario_registro?.nombre}</TableCell>
                        <TableCell>
                          {orden.Campania?.Presupuesto
                            ? new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: 'CLP',
                                minimumFractionDigits: 0
                              }).format(orden.Campania.Presupuesto)
                            : ''}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell>{orden.Contratos?.NombreContrato}</TableCell>
                        <TableCell>
                          {orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre ||
                            orden.usuario_registro?.nombre}
                        </TableCell>
                        <TableCell>
                          {orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo ||
                            orden.usuario_registro?.grupo}
                        </TableCell>
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
        )}
      </Paper>
    </Container>
  );
};

export default InformeInversionClienteBruto; 