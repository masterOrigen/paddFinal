import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import {
  Container,
  Typography,
  Paper,
  Grid,
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
  TextField,
  Autocomplete
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { Pagination } from '@mui/material';

const ReporteInversionCliente = () => {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: null,
    anio: '',
    fechaInicio: null,
    fechaFin: null
  });
  const [clientes, setClientes] = useState([]);
  const [anios, setAnios] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25); // Más filas por página para este reporte

  useEffect(() => {
    fetchClientes();
    fetchAnios();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente, razonSocial')
        .order('nombreCliente');

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchAnios = async () => {
    try {
      const { data, error } = await supabase
        .from('Anios')
        .select('id, years')
        .order('years', { ascending: false });

      if (error) throw error;
      setAnios(data || []);
    } catch (error) {
      console.error('Error al cargar años:', error);
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
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto, Presupuesto, Id_Agencia,
            Clientes (id_cliente, nombreCliente, RUT, razonSocial),
            Productos!id_Producto (id, NombreDelProducto),
            Agencia:Agencias!Id_Agencia (id, NombreIdentificador, NombreDeFantasia, RazonSocial)
          ),
          Contratos (id, NombreContrato, num_contrato, id_FormadePago, IdProveedor, IdMedios,
            FormaDePago (id, NombreFormadePago),
            Proveedores (id_proveedor, nombreProveedor, rutProveedor, razonSocial),
            Medios (id, NombredelMedio)
          ),
          Soportes (id_soporte, nombreIdentficiador, id_proveedor,
            Proveedores!id_proveedor (nombreProveedor, rutProveedor, razonSocial)
          ),
          plan!inner (id, nombre_plan, anio, mes,
            Anios!anio (id, years),
            Meses (Id, Nombre)
          )
        `);

      if (filtros.cliente) {
        query = query.eq('Campania.id_Cliente', filtros.cliente.id_cliente);
      }

      if (filtros.anio) {
        query = query.eq('plan.anio', filtros.anio);
      }

      // Filtro por rango de fechas - usando IDs de mes y año
      if (filtros.fechaInicio && filtros.fechaFin) {
        const fechaInicio = new Date(filtros.fechaInicio);
        const fechaFin = new Date(filtros.fechaFin);
        
        // Si es el mismo mes y año, obtener los IDs y filtrar
        if (fechaInicio.getMonth() === fechaFin.getMonth() &&
            fechaInicio.getFullYear() === fechaFin.getFullYear()) {
          
          // Obtener el nombre del mes en español y asegurar mayúscula inicial
          let nombreMes = fechaInicio.toLocaleDateString('es-ES', { month: 'long' });
          // Asegurar que la primera letra sea mayúscula
          nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
          const anio = fechaInicio.getFullYear();
          
          console.log('Filtrando por mes:', nombreMes, 'año:', anio); // Debug
          
          // Buscar el ID del mes y año
          const { data: mesData } = await supabase
            .from('Meses')
            .select('Id')
            .eq('Nombre', nombreMes)
            .single();
            
          const { data: anioData } = await supabase
            .from('Anios')
            .select('id')
            .eq('years', anio)
            .single();
          
          console.log('ID mes encontrado:', mesData?.Id, 'ID año encontrado:', anioData?.id); // Debug
          
          // Si encontramos los IDs, aplicar el filtro
          if (mesData && anioData) {
            query = query.eq('plan.mes', mesData.Id).eq('plan.anio', anioData.id);
          }
        } else {
          // Para rangos de múltiples meses, usar fecha de creación como fallback
          if (filtros.fechaInicio) {
            const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
            query = query.gte('fechaCreacion', fechaInicioFormateada);
          }

          if (filtros.fechaFin) {
            const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
            query = query.lte('fechaCreacion', fechaFinFormateada);
          }
        }
      } else {
        // Si solo hay una de las fechas, usar fecha de creación
        if (filtros.fechaInicio) {
          const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
          query = query.gte('fechaCreacion', fechaInicioFormateada);
        }

        if (filtros.fechaFin) {
          const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
          query = query.lte('fechaCreacion', fechaFinFormateada);
        }
      }

      const { data: ordenesData, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      setOrdenes(ordenesData || []);
    } catch (error) {
      console.error('Error al buscar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: null,
      anio: anios.length > 0 ? anios[0].id : '',
      fechaInicio: null,
      fechaFin: null
    });
    setOrdenes([]);
  };

  const exportarExcel = () => {
    const dataToExport = ordenes.map(orden => ({
      'Razon Social': orden.Campania?.Clientes?.razonSocial || '',
      'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
      'AÑO': orden.plan?.Anios?.years || '',
      'Mes': orden.plan?.Meses?.Nombre || '',
      'N° de Ctto.': orden.Contratos?.NombreContrato || '',
      'N° de Orden': orden.numero_correlativo || '',
      'Version': orden.copia || '',
      'Medio': orden.Contratos?.Medios?.NombredelMedio || '',
      'Razon Soc.Proveedor': orden.Contratos?.Proveedores?.razonSocial || orden.Soportes?.Proveedores?.razonSocial || '',
      'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || orden.Soportes?.Proveedores?.nombreProveedor || '',
      'RUT Prov.': orden.Contratos?.Proveedores?.rutProveedor || orden.Soportes?.Proveedores?.rutProveedor || '',
      'Soporte': orden.Soportes?.nombreIdentficiador || '',
      'Campaña': orden.Campania?.NombreCampania || '',
      'OC Cliente': orden.numero_correlativo || '',
      'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
      'Age.Crea': orden.Campania?.Agencia?.RazonSocial || orden.Campania?.Agencia?.NombreDeFantasia || 'ORIGEN COMUNICACIONES',
      'Inv.Bruta': orden.Campania?.Presupuesto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(orden.Campania.Presupuesto) : '',
      'N° Fact.Prov.': '', // Este campo podría requerir una tabla adicional de facturas
      'Fecha Fact.Prov.': '', // Este campo podría requerir una tabla adicional de facturas
      'N° Fact.Age.': '', // Este campo podría requerir una tabla adicional de facturas
      'Fecha Fact.Age.': '', // Este campo podría requerir una tabla adicional de facturas
      'Monto Neto Fact.': '', // Este campo podría requerir una tabla adicional de facturas
      'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
      'Usuario Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Inversión Cliente');
    XLSX.writeFile(wb, `Reporte_Inversion_Cliente_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedOrdenes = ordenes.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Reporte Inversión Cliente
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>
        
        <Grid container spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
          <Grid item xs={12} sm={2}>
            <Autocomplete
              size="small"
              options={[{ id_cliente: '', nombreCliente: 'Todos', razonSocial: 'Todos los clientes' }, ...clientes]}
              getOptionLabel={(option) => {
                if (option.id_cliente === '') {
                  return 'Todos';
                }
                return `${option.nombreCliente} - ${option.razonSocial}`;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              )}
              value={filtros.cliente || { id_cliente: '', nombreCliente: 'Todos', razonSocial: 'Todos los clientes' }}
              onChange={(event, newValue) => {
                handleFiltroChange('cliente', newValue);
              }}
              isOptionEqualToValue={(option, value) => {
                if (option?.id_cliente === '' && value?.id_cliente === '') return true;
                return option?.id_cliente === value?.id_cliente;
              }}
              clearText="Limpiar"
              noOptionsText="No hay clientes"
            />
          </Grid>
          
          <Grid item xs={12} sm={1.8}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                value={filtros.anio}
                label="Año"
                onChange={(e) => handleFiltroChange('anio', e.target.value)}
              >
                {anios.map((anio) => (
                  <MenuItem key={anio.id} value={anio.id}>
                    {anio.years}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha inicio"
                value={filtros.fechaInicio}
                onChange={(newValue) => handleFiltroChange('fechaInicio', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    variant: 'outlined'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha fin"
                value={filtros.fechaFin}
                onChange={(newValue) => handleFiltroChange('fechaFin', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    variant: 'outlined'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <Button
              variant="contained"
              onClick={buscarOrdenes}
              disabled={loading}
              sx={{ height: 40 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={1.5}>
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
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
            <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Razon Social</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>CLIENTE</TableCell>
                    <TableCell sx={{ minWidth: 60 }}>AÑO</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Mes</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>N° de Ctto.</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>N° de Orden</TableCell>
                    <TableCell sx={{ minWidth: 60 }}>Version</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Medio</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Razon Soc.Proveedor</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Proveedor</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>RUT Prov.</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Soporte</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Campaña</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>OC Cliente</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Age.Crea</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Inv.Bruta</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>N° Fact.Prov.</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Fecha Fact.Prov.</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>N° Fact.Age.</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Fecha Fact.Age.</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Monto Neto Fact.</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Tipo Ctto.</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Usuario Grupo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden) => (
                    <TableRow key={orden.id_ordenes_de_comprar}>
                      <TableCell>{orden.Campania?.Clientes?.razonSocial || 'N/A'}</TableCell>
                      <TableCell>{orden.Campania?.Clientes?.nombreCliente || 'N/A'}</TableCell>
                      <TableCell>{orden.plan?.Anios?.years || 'N/A'}</TableCell>
                      <TableCell>{orden.plan?.Meses?.Nombre || 'N/A'}</TableCell>
                      <TableCell>{orden.Contratos?.NombreContrato || 'N/A'}</TableCell>
                      <TableCell>{orden.numero_correlativo || 'N/A'}</TableCell>
                      <TableCell>{orden.copia || 'N/A'}</TableCell>
                      <TableCell>{orden.Contratos?.Medios?.NombredelMedio || 'N/A'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.razonSocial || orden.Soportes?.Proveedores?.razonSocial || 'N/A'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor || orden.Soportes?.Proveedores?.nombreProveedor || 'N/A'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.rutProveedor || orden.Soportes?.Proveedores?.rutProveedor || 'N/A'}</TableCell>
                      <TableCell>{orden.Soportes?.nombreIdentficiador || 'N/A'}</TableCell>
                      <TableCell>{orden.Campania?.NombreCampania || 'N/A'}</TableCell>
                      <TableCell>{orden.numero_correlativo || 'N/A'}</TableCell>
                      <TableCell>{orden.Campania?.Productos?.NombreDelProducto || 'N/A'}</TableCell>
                      <TableCell>{orden.Campania?.Agencia?.RazonSocial || orden.Campania?.Agencia?.NombreDeFantasia || 'ORIGEN COMUNICACIONES'}</TableCell>
                      <TableCell>
                        {orden.Campania?.Presupuesto
                          ? new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: 'CLP',
                              minimumFractionDigits: 0
                            }).format(orden.Campania.Presupuesto)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>{orden.Contratos?.NombreContrato || 'N/A'}</TableCell>
                      <TableCell>{orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || 'N/A'}</TableCell>
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

export default ReporteInversionCliente;