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
  Divider
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { Pagination } from '@mui/material';

const ReporteInversionPorCliente = () => {
  const [loading, setLoading] = useState(false);
  const [inversiones, setInversiones] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: null,
    fechaFin: null,
    cliente: '',
    anio: ''
  });
  const [clientes, setClientes] = useState([]);
  const [anios, setAnios] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    fetchClientes();
    fetchAnios();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente')
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

  const buscarInversiones = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('OrdenesDePublicidad')
        .select(`
          id_ordenes_de_comprar,
          fechaCreacion,
          alternativas_plan_orden,
          Campania!inner (
            id_campania,
            NombreCampania,
            Presupuesto,
            Clientes!inner (
              id_cliente,
              nombreCliente,
              RUT
            ),
            Productos (
              id,
              NombreDelProducto
            )
          ),
          plan (
            id,
            nombre_plan,
            Anios!anio (
              id,
              years
            ),
            Meses (
              Id,
              Nombre
            )
          )
        `);

      if (filtros.fechaInicio) {
        query = query.gte('fechaCreacion', filtros.fechaInicio.toISOString());
      }
      
      if (filtros.fechaFin) {
        query = query.lte('fechaCreacion', filtros.fechaFin.toISOString());
      }
      
      if (filtros.cliente) {
        query = query.eq('Campania.Clientes.id_cliente', filtros.cliente);
      }

      if (filtros.anio) {
        query = query.eq('plan.anio', filtros.anio);
      }

      const { data, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;

      // Procesar y agrupar los datos por cliente
      const inversionesPorCliente = data.reduce((acc, orden) => {
        const clienteId = orden.Campania?.Clientes?.id_cliente;
        const clienteNombre = orden.Campania?.Clientes?.nombreCliente;
        const mes = orden.plan?.Meses?.Nombre;
        const presupuesto = orden.Campania?.Presupuesto || 0;
        const alternativas = orden.alternativas_plan_orden || [];
        const inversionTotal = alternativas.reduce((total, alt) => total + (alt.valor_total || 0), 0);

        if (!acc[clienteId]) {
          acc[clienteId] = {
            clienteNombre,
            RUT: orden.Campania?.Clientes?.RUT,
            inversionTotal: 0,
            presupuestoTotal: 0,
            inversionesPorMes: {},
            campanas: new Set()
          };
        }

        acc[clienteId].inversionTotal += inversionTotal;
        acc[clienteId].presupuestoTotal += presupuesto;
        acc[clienteId].campanas.add(orden.Campania?.NombreCampania);

        if (mes) {
          if (!acc[clienteId].inversionesPorMes[mes]) {
            acc[clienteId].inversionesPorMes[mes] = 0;
          }
          acc[clienteId].inversionesPorMes[mes] += inversionTotal;
        }

        return acc;
      }, {});

      const inversionesFormateadas = Object.entries(inversionesPorCliente).map(([id, data]) => ({
        id_cliente: id,
        nombreCliente: data.clienteNombre,
        RUT: data.RUT,
        inversionTotal: data.inversionTotal,
        presupuestoTotal: data.presupuestoTotal,
        cantidadCampanas: data.campanas.size,
        inversionesPorMes: data.inversionesPorMes
      }));

      setInversiones(inversionesFormateadas);
    } catch (error) {
      console.error('Error al buscar inversiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: null,
      fechaFin: null,
      cliente: '',
      anio: ''
    });
  };

  const exportarExcel = () => {
    const dataToExport = inversiones.map(inversion => ({
      'Cliente': inversion.nombreCliente,
      'RUT': inversion.RUT,
      'Inversión Total': new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(inversion.inversionTotal),
      'Presupuesto Total': new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(inversion.presupuestoTotal),
      'Cantidad de Campañas': inversion.cantidadCampanas,
      ...Object.entries(inversion.inversionesPorMes).reduce((acc, [mes, valor]) => ({
        ...acc,
        [`Inversión ${mes}`]: new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(valor)
      }), {})
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inversión por Cliente');
    XLSX.writeFile(wb, `Reporte_Inversion_Por_Cliente_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedInversiones = inversiones.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Reporte de Inversión por Cliente
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={3}>
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
          
          <Grid item xs={12} sm={3}>
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
          
          <Grid item xs={12} sm={2}>
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

          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                value={filtros.anio}
                label="Año"
                onChange={(e) => handleFiltroChange('anio', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {anios.map((anio) => (
                  <MenuItem key={anio.id} value={anio.id}>
                    {anio.years}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={buscarInversiones}
              disabled={loading}
              sx={{ width: 180, height: 40 }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
          {inversiones.length > 0 && (
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
        ) : inversiones.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>RUT</TableCell>
                    <TableCell>Inversión Total</TableCell>
                    <TableCell>Presupuesto Total</TableCell>
                    <TableCell>Cantidad de Campañas</TableCell>
                    {Object.keys(inversiones[0].inversionesPorMes).map(mes => (
                      <TableCell key={mes}>{`Inversión ${mes}`}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInversiones.map((inversion) => (
                    <TableRow key={inversion.id_cliente}>
                      <TableCell>{inversion.nombreCliente}</TableCell>
                      <TableCell>{inversion.RUT}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(inversion.inversionTotal)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(inversion.presupuestoTotal)}
                      </TableCell>
                      <TableCell>{inversion.cantidadCampanas}</TableCell>
                      {Object.entries(inversion.inversionesPorMes).map(([mes, valor]) => (
                        <TableCell key={mes}>
                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(valor)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(inversiones.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No se encontraron inversiones con los filtros seleccionados
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ReporteInversionPorCliente;