import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
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
  Autocomplete,
  Chip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '@mui/material';

const OrdenesNoEmitidas = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesNoEmitidas, setOrdenesNoEmitidas] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: { id_cliente: 'all', nombreCliente: 'Todas las Órdenes', razonSocial: 'Todas las órdenes no emitidas' },
    anio: '',
    mes: ''
  });
  const [clientes, setClientes] = useState([]);
  const [anios, setAnios] = useState([]);
  const [meses, setMeses] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25);

  useEffect(() => {
    fetchClientes();
    fetchAnios();
    fetchMeses();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente, razonSocial')
        .order('nombreCliente');

      if (error) throw error;

      // Agregar opción "Todas las Órdenes" al inicio de la lista
      const clientesConTodos = [
        { id_cliente: 'all', nombreCliente: 'Todas las Órdenes', razonSocial: 'Todas las órdenes no emitidas' },
        ...(data || [])
      ];

      setClientes(clientesConTodos);
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

  const fetchMeses = async () => {
    try {
      const { data, error } = await supabase
        .from('Meses')
        .select('Id, Nombre')
        .order('Id');

      if (error) throw error;
      setMeses(data || []);
    } catch (error) {
      console.error('Error al cargar meses:', error);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const buscarOrdenesNoEmitidas = async () => {
    try {
      setLoading(true);

      // Validación: si no es "Todas las Órdenes", entonces cliente y año son requeridos
      if (filtros.cliente && filtros.cliente.id_cliente !== 'all') {
        if (!filtros.anio) {
          Swal.fire({
            icon: 'warning',
            title: 'Faltan datos',
            text: 'Por favor seleccione año para un cliente específico',
            confirmButtonColor: '#1976d2'
          });
          return;
        }
      }

      // Buscar órdenes que estén anuladas o que hayan sido reemplazadas
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
          orden_remplaza,
          alternativas_plan_orden,
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto, Presupuesto,
            Clientes (id_cliente, nombreCliente, RUT, razonSocial),
            Productos!id_Producto (id, NombreDelProducto)
          ),
          Contratos (id, NombreContrato, num_contrato, IdProveedor,
            Proveedores (id_proveedor, nombreProveedor, rutProveedor, razonSocial)
          ),
          Soportes (id_soporte, nombreIdentficiador, id_medios,
            Medios!left (id, NombredelMedio)
          ),
          plan!inner (id, nombre_plan, anio, mes,
            Anios!anio (id, years),
            Meses (Id, Nombre)
          )
        `);

      // Aplicar filtros
      // Solo filtrar por cliente si no es "Todas las Órdenes"
      if (filtros.cliente && filtros.cliente.id_cliente !== 'all') {
        query = query.eq('Campania.id_Cliente', filtros.cliente.id_cliente);
      }

      // Solo filtrar por año si está seleccionado
      if (filtros.anio) {
        query = query.eq('plan.anio', filtros.anio);
      }

      // Aplicar filtro de mes solo si está seleccionado
      if (filtros.mes) {
        query = query.eq('plan.mes', filtros.mes);
      }

      // Filtrar órdenes no emitidas (anuladas o reemplazadas)
      query = query.or('estado.eq.anulada,orden_remplaza.not.is.null');

      const { data: ordenesData, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;

      // Procesar las órdenes para determinar su estado y motivo
      const ordenesProcesadas = await Promise.all(
        ordenesData?.map(async (orden) => {
          let motivoNoEmision = '';
          let tarifaBrutaTotal = 0;

          // Determinar el motivo por el que no fue emitida
          if (orden.estado === 'anulada') {
            motivoNoEmision = 'Anulada';
          } else if (orden.orden_remplaza) {
            motivoNoEmision = 'Reemplazada por orden #' + orden.numero_correlativo;
            // Actualizar el estado para que muestre "Reemplazada"
            orden.estado = 'reemplazada';
          }

          // Obtener alternativas para calcular tarifa bruta
          if (orden.alternativas_plan_orden) {
            let idsAlternativas = [];

            try {
              if (Array.isArray(orden.alternativas_plan_orden)) {
                idsAlternativas = orden.alternativas_plan_orden;
              } else if (typeof orden.alternativas_plan_orden === 'string') {
                const parsed = JSON.parse(orden.alternativas_plan_orden);
                idsAlternativas = Array.isArray(parsed) ? parsed : [];
              }
            } catch (e) {
              console.error('Error parseando alternativas_plan_orden:', e);
            }

            if (idsAlternativas.length > 0) {
              const { data: alternativas } = await supabase
                .from('alternativa')
                .select('total_bruto')
                .in('id', idsAlternativas);

              if (alternativas && alternativas.length > 0) {
                tarifaBrutaTotal = alternativas.reduce((total, alt) => total + (alt.total_bruto || 0), 0);
              }
            }
          }

          return {
            ...orden,
            motivoNoEmision,
            tarifaBrutaTotal
          };
        }) || []
      );

      setOrdenesNoEmitidas(ordenesProcesadas);
    } catch (error) {
      console.error('Error al buscar órdenes no emitidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: { id_cliente: 'all', nombreCliente: 'Todas las Órdenes', razonSocial: 'Todas las órdenes no emitidas' },
      anio: '',
      mes: ''
    });
    setOrdenesNoEmitidas([]);
  };

  const exportarExcel = () => {
    const dataToExport = ordenesNoEmitidas.map(orden => ({
      'Cliente': orden.Campania?.Clientes?.nombreCliente || '',
      'RUT Cliente': orden.Campania?.Clientes?.RUT || '',
      'Razón Social': orden.Campania?.Clientes?.razonSocial || '',
      'Mes': orden.plan?.Meses?.Id || '',
      'Año': orden.plan?.Anios?.years || '',
      'N° de Ctto.': orden.Contratos?.NombreContrato || '',
      'N° de Orden': orden.numero_correlativo || '',
      'Versión': orden.copia || '',
      'Medio': orden.Soportes?.Medios?.NombredelMedio || orden.Soportes?.id_medios || '',
      'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
      'RUT Proveedor': orden.Contratos?.Proveedores?.rutProveedor || '',
      'Soporte': orden.Soportes?.nombreIdentficiador || '',
      'Campaña': orden.Campania?.NombreCampania || '',
      'Plan de Medios': orden.plan?.nombre_plan || '',
      'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
      'Fecha Creación': orden.fechaCreacion ? format(new Date(orden.fechaCreacion), 'dd/MM/yyyy') : '',
      'Motivo No Emisión': orden.motivoNoEmision || '',
      'Inversión Bruta': formatCurrency(orden.tarifaBrutaTotal || 0),
      'Estado': orden.estado || '',
      'Usuario Crea': orden.usuario_registro?.nombre || '',
      'Grupo Usuario': orden.usuario_registro?.grupo || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Órdenes No Emitidas');

    const nombreCliente = filtros.cliente?.nombreCliente === 'Todas las Órdenes' ? 'TodasLasOrdenes' : filtros.cliente?.nombreCliente || 'SinCliente';
    const nombreArchivo = `Ordenes_No_Emitidas_${nombreCliente}_${filtros.anio}_${filtros.mes}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedOrdenes = ordenesNoEmitidas.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Órdenes No Emitidas
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              size="small"
              options={clientes}
              getOptionLabel={(option) => {
                if (option.id_cliente === 'all') {
                  return 'Todas las Órdenes';
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
              value={filtros.cliente}
              onChange={(event, newValue) => {
                handleFiltroChange('cliente', newValue);
              }}
              isOptionEqualToValue={(option, value) => option?.id_cliente === value?.id_cliente}
              clearText="Limpiar"
              noOptionsText="No hay clientes"
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;

                const inputLower = inputValue.toLowerCase();
                return options.filter(option => {
                  if (option.id_cliente === 'all') {
                    return 'todas las órdenes'.includes(inputLower);
                  }
                  return option.nombreCliente.toLowerCase().includes(inputLower) ||
                    option.razonSocial.toLowerCase().includes(inputLower);
                });
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
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
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select
                value={filtros.mes}
                label="Mes"
                onChange={(e) => handleFiltroChange('mes', e.target.value)}
              >
                {meses.map((mes) => (
                  <MenuItem key={mes.Id} value={mes.Id}>
                    {mes.Nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={buscarOrdenesNoEmitidas}
              disabled={loading}
              sx={{ height: 40 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={2}>
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
          {ordenesNoEmitidas.length > 0 && (
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
        ) : ordenesNoEmitidas.length > 0 ? (
          <>
            <TableContainer sx={{ maxHeight: '70vh', overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Cliente</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>N° Orden</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Versión</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Campaña</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Proveedor</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Fecha Creación</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Motivo No Emisión</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="right">Tarifa Bruta</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Usuario Crea</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden) => (
                    <TableRow key={orden.id_ordenes_de_comprar}>
                      <TableCell>
                        {orden.Campania?.Clientes?.nombreCliente || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {orden.numero_correlativo || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {orden.copia || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {orden.Campania?.NombreCampania || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {orden.Campania?.Productos?.NombreDelProducto || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {orden.Contratos?.Proveedores?.nombreProveedor || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {orden.fechaCreacion ? format(new Date(orden.fechaCreacion), 'dd/MM/yyyy') : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {orden.motivoNoEmision}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(orden.tarifaBrutaTotal || 0)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={orden.orden_remplaza ? 'Reemplazada' : (orden.estado === 'anulada' ? 'Anulada' : 'ACTIVA')}
                          color={orden.orden_remplaza ? 'warning' : (orden.estado === 'anulada' ? 'error' : 'default')}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: '24px' }}
                        />
                      </TableCell>
                      <TableCell>
                        {orden.usuario_registro?.nombre || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="#666">
                Total de órdenes no emitidas: {ordenesNoEmitidas.length}
              </Typography>
              <Pagination
                count={Math.ceil(ordenesNoEmitidas.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No se encontraron órdenes no emitidas con los filtros seleccionados
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default OrdenesNoEmitidas;