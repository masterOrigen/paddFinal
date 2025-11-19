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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { Pagination } from '@mui/material';

const InformeInversion = () => {
  const [loading, setLoading] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: null,
    fechaFin: null,
    cliente: '',
    medio: '',
    proveedor: '',
    soporte: ''
  });
  const [clientes, setClientes] = useState([]);
  const [medios, setMedios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [soportes, setSoportes] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    fetchClientes();
    fetchMedios();
    fetchProveedores();
    fetchSoportes();
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

  const fetchMedios = async () => {
    try {
      const { data, error } = await supabase
        .from('Medios')
        .select('id, NombredelMedio')
        .order('NombredelMedio');

      if (error) throw error;
      setMedios(data || []);
    } catch (error) {
      console.error('Error al cargar medios:', error);
    }
  };

  const fetchProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from('Proveedores')
        .select('id_proveedor, nombreProveedor')
        .order('nombreProveedor');

      if (error) throw error;
      setProveedores(data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const fetchSoportes = async () => {
    try {
      const { data, error } = await supabase
        .from('Soportes')
        .select('id_soporte, nombreIdentficiador')
        .order('nombreIdentficiador');

      if (error) throw error;
      setSoportes(data || []);
    } catch (error) {
      console.error('Error al cargar soportes:', error);
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
          numero_correlativo,
          estado,
          usuario_registro,
          alternativas_plan_orden,
          OrdenesUsuarios (id_orden_usuario, fecha_asignacion, estado,
            Usuarios (id_usuario, Nombre, Email, id_grupo,
              Grupos (id_grupo, nombre_grupo)
            )
          ),
          Campania (
            id_campania,
            NombreCampania,
            Clientes (id_cliente, nombreCliente),
            Productos (id, NombreDelProducto)
          ),
          Contratos (
            id,
            NombreContrato,
            num_contrato,
            Proveedores (id_proveedor, nombreProveedor),
            Medios (id, NombredelMedio)
          ),
          Soportes (id_soporte, nombreIdentficiador),
          plan (
            id,
            nombre_plan,
            Meses (Id, Nombre)
          ),
          campania_temas:Campania (campania_temas(id_temas, Temas(id_tema, NombreTema, Duracion)))
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
      
      if (filtros.medio) {
        query = query.eq('Contratos.Medios.id', filtros.medio);
      }

      if (filtros.proveedor) {
        query = query.eq('Contratos.Proveedores.id_proveedor', filtros.proveedor);
      }

      if (filtros.soporte) {
        query = query.eq('id_soporte', filtros.soporte);
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
      fechaInicio: null,
      fechaFin: null,
      cliente: '',
      medio: '',
      proveedor: '',
      soporte: ''
    });
  };

  const exportarExcel = () => {
    const dataToExport = ordenes.map(orden => ({
      'CLIENTE': orden.Campania?.Clientes?.nombreCliente || 'NA',
      'Mes': orden.plan?.Meses?.Nombre || 'NA',
      'N° de Ctto.': orden.Contratos?.num_contrato || 'NA',
      'N° de Orden': orden.numero_correlativo || 'NA',
      'Version': orden.copia || 'NA',
      'Medio': orden.Contratos?.Medios?.NombredelMedio || 'NA',
      'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || 'NA',
      'Soporte': orden.Soportes?.nombreIdentficiador || 'NA',
      'Campana': orden.Campania?.NombreCampania || 'NA',
      'Plan de Medios': orden.plan?.nombre_plan || 'NA',
      'Producto': orden.Campania?.Productos?.NombreDelProducto || 'NA',
      'Tema': orden.Temas?.NombreTema || 'NA',
      'Seg': orden.Temas?.Duracion || 'NA',
      'Prog./Elem./Formato': orden.Programas?.descripcion || 'NA',
      'Fecha Exhib./Pub.': orden.fechaCreacion ? format(new Date(orden.fechaCreacion), 'dd/MM/yyyy') : 'NA',
      'Inversion Neta': 'NA',
      'Agen.Creativa': 'NA',
      'Cod. Univ. Aviso': 'NA',
      'Cod. Univ. Prog.': orden.Programas?.codigo_programa || 'NA',
      'Calidad': 'NA',
      'Cod.Usu.': 'NA',
      'Nombre Usuario': 'NA',
      'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || 'NA'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe de Inversión');
    XLSX.writeFile(wb, `Informe_Inversion_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedOrdenes = ordenes.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Informe de Inversión
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
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
          
          <Grid item xs={12} sm={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Medio</InputLabel>
              <Select
                value={filtros.medio}
                label="Medio"
                onChange={(e) => handleFiltroChange('medio', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {medios.map((medio) => (
                  <MenuItem key={medio.id} value={medio.id}>
                    {medio.NombredelMedio}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Proveedor</InputLabel>
              <Select
                value={filtros.proveedor}
                label="Proveedor"
                onChange={(e) => handleFiltroChange('proveedor', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {proveedores.map((proveedor) => (
                  <MenuItem key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                    {proveedor.nombreProveedor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Soporte</InputLabel>
              <Select
                value={filtros.soporte}
                label="Soporte"
                onChange={(e) => handleFiltroChange('soporte', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {soportes.map((soporte) => (
                  <MenuItem key={soporte.id_soporte} value={soporte.id_soporte}>
                    {soporte.nombreIdentficiador}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1 }}>
            {/* <Button
              variant="outlined"
              onClick={limpiarFiltros}
              size="small"
              fullWidth
            >
              Limpiar
            </Button> */}
            <Button
              variant="contained"
              onClick={buscarOrdenes}
              disabled={loading}
              // size="small"
              sx={{ width: 180 , height: 40}}
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
          {/* <Button variant="contained" onClick={buscarOrdenes} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Buscar'}
          </Button> */}
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
                    <TableCell>CLIENTE</TableCell>
                    <TableCell>MES</TableCell>
                    <TableCell>N° DE CTTO.</TableCell>
                    <TableCell>N° DE ORDEN</TableCell>
                    <TableCell>VERSION</TableCell>
                    <TableCell>MEDIO</TableCell>
                    <TableCell>PROVEEDOR</TableCell>
                    <TableCell>SOPORTE</TableCell>
                    <TableCell>CAMPAÑA</TableCell>
                    <TableCell>PLAN DE MEDIOS</TableCell>
                    <TableCell>PRODUCTO</TableCell>
                    <TableCell>TEMA</TableCell>
                    <TableCell>SEG</TableCell>
                    <TableCell>PROG./ELEM./FORMATO</TableCell>
                    <TableCell>FECHA EXHIB./PUB.</TableCell>
                    <TableCell>INVERSION NETA</TableCell>
                    <TableCell>AGEN.CREATIVA</TableCell>
                    <TableCell>COD. UNIV. AVISO</TableCell>
                    <TableCell>COD. UNIV. PROG.</TableCell>
                    <TableCell>CALIDAD</TableCell>
                    <TableCell>COD.USU.</TableCell>
                    <TableCell>NOMBRE USUARIO</TableCell>
                    <TableCell>GRUPO USUARIO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden) => (
                    <TableRow key={orden.id_ordenes_de_comprar}>
                      <TableCell>{orden.Campania?.Clientes?.nombreCliente || 'NA'}</TableCell>
                      <TableCell>{orden.plan?.Meses?.Nombre || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.num_contrato || 'NA'}</TableCell>
                      <TableCell>{orden.numero_correlativo || 'NA'}</TableCell>
                      <TableCell>{orden.copia || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Medios?.NombredelMedio || 'NA'}</TableCell>
                      <TableCell>{orden.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{orden.Soportes?.nombreIdentficiador || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.NombreCampania || 'NA'}</TableCell>
                      <TableCell>{orden.plan?.nombre_plan || 'NA'}</TableCell>
                      <TableCell>{orden.Campania?.Productos?.NombreDelProducto || 'NA'}</TableCell>
                      <TableCell>{orden.Temas?.NombreTema || 'NA'}</TableCell>
                      <TableCell>{orden.Temas?.Duracion || 'NA'}</TableCell>
                      <TableCell>{orden.Programas?.descripcion || 'NA'}</TableCell>
                      <TableCell>
                        {orden.fechaCreacion ? format(new Date(orden.fechaCreacion), 'dd/MM/yyyy') : 'NA'}
                      </TableCell>
                      <TableCell>NA</TableCell>
                      <TableCell>NA</TableCell>
                      <TableCell>NA</TableCell>
                      <TableCell>{orden.Programas?.codigo_programa || 'NA'}</TableCell>
                      <TableCell>NA</TableCell>
                      <TableCell>{typeof orden.usuario_registro === 'object' ? orden.usuario_registro.nombre || 'NA' : orden.usuario_registro || 'NA'}</TableCell>
                      <TableCell>{orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || 'NA'}</TableCell>
                      <TableCell>{orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || 'NA'}</TableCell>
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

export default InformeInversion;