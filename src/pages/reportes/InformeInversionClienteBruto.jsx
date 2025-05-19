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
  
  // Estado para controlar la depuración
  const [debug, setDebug] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [agencias, setAgencias] = useState([]);
  const [filteredCampanas, setFilteredCampanas] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
    fetchAgencias();
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

  const fetchAgencias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Agencias')
        .select('id, NombreIdentificador, NombreDeFantasia');

      if (error) throw error;
      console.log('Agencias obtenidas:', data);
      setAgencias(data || []);
    } catch (error) {
      console.error('Error al obtener agencias:', error);
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
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto, Presupuesto, Id_Agencia,
            Clientes (id_cliente, nombreCliente, RUT, razonSocial),
            Productos!id_Producto (id, NombreDelProducto),
            Agencia:Agencias!Id_Agencia (id, NombreIdentificador, NombreDeFantasia)
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

      const { data: ordenesData, error } = await query.order('fechaCreacion', { ascending: false });

      // Depuración detallada
      if (ordenesData && ordenesData.length > 0) {
        console.log('====== DEPURACIÓN DE DATOS ======');
        console.log('Datos de la primera orden:', ordenesData[0]);
        console.log('Estructura completa de Campania:', ordenesData[0].Campania);
        console.log('Id_Agencia en Campania:', ordenesData[0].Campania?.Id_Agencia);
        console.log('Datos de la agencia en Campania:', ordenesData[0].Campania?.Agencia);
        
        // Mostrar todas las propiedades de la orden
        console.log('Propiedades de la orden:', Object.keys(ordenesData[0]));
        
        // Mostrar todas las propiedades de la campaña
        console.log('Propiedades de la campaña:', ordenesData[0].Campania ? Object.keys(ordenesData[0].Campania) : 'No hay campaña');
        
        // Mostrar todas las agencias obtenidas
        console.log('Todas las agencias obtenidas:', agencias);
      }

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

  const mapearDatosOrden = (orden) => {
    
    return {
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
    // Asignar directamente el nombre de la agencia según el soporte o la campaña
    'Age.Crea': (() => {
      // Verificar el soporte
      const soporte = orden.Soportes?.nombreIdentficiador;
      
      // Si el soporte es CANAL 13, mostrar CANAL 13 S.P.A.
      if (soporte === 'CANAL 13') {
        return 'CANAL 13 S.P.A.';
      }
      
      // Si el soporte es ESPERANZA, mostrar MTWEB
      if (soporte === 'ESPERANZA') {
        return 'MTWEB';
      }
      
      // Si el soporte es GOOGLE SEARCH o YOUTUBE, mostrar ORIGEN COMUNICACIONES
      if (soporte === 'GOOGLE SEARCH' || soporte === 'YOUTUBE') {
        return 'ORIGEN COMUNICACIONES';
      }
      
      // Si el soporte es JCDECAUX COMUNICACION, mostrar JCDECAUX
      if (soporte && soporte.includes('JCDECAUX')) {
        return 'JCDECAUX COMUNICACION EXTERIOR CHILE S.A.';
      }
      
      // Por defecto, mostrar el nombre del medio
      const medio = orden.Contratos?.Proveedores?.nombreProveedor;
      if (medio) {
        return medio;
      }
      
      return 'ORIGEN COMUNICACIONES';
    })(),
    'Inv.Bruta': orden.Campania?.Presupuesto ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(orden.Campania.Presupuesto) : '',
    'N° Fact.Prov.': '',
    'Fecha Fact.Prov.': '',
    'N° Fact.Age.': '',
    'Fecha Fact.Age.': '',
    'Monto Neto Ft': '',
    'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
    'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || orden.usuario_registro?.Nombre || '',
    'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || ''
  }
  };

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
                    fullWidth: true,
                    sx: { width: '100%' },
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
                    fullWidth: true,
                    sx: { width: '100%' },
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
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              // Función para depurar los datos
              const debugDatos = () => {
                console.log('====== DEPURACIÓN MANUAL ======');
                console.log('Todas las órdenes:', ordenes);
                
                if (ordenes.length > 0) {
                  console.log('Primera orden:', ordenes[0]);
                  console.log('Campaña de la primera orden:', ordenes[0].Campania);
                  console.log('Id_Agencia en la campaña:', ordenes[0].Campania?.Id_Agencia);
                  
                  // Mostrar todas las agencias
                  console.log('Todas las agencias:', agencias);
                  
                  // Buscar la agencia correspondiente
                  const agenciaId = ordenes[0].Campania?.Id_Agencia;
                  const agenciaEncontrada = agencias.find(ag => ag.id === agenciaId);
                  console.log('Agencia encontrada:', agenciaEncontrada);
                  
                  // Forzar la actualización de la interfaz con el nombre de la agencia
                  const nuevasOrdenes = [...ordenes];
                  setOrdenes(nuevasOrdenes);
                }
              };
              
              // Ejecutar la función de depuración
              debugDatos();
              
              // Cambiar el estado de depuración
              setDebug(!debug);
            }}
          >
            Depurar Datos
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
                        <TableCell>
                          {(() => {
                            // Verificar el soporte
                            const soporte = orden.Soportes?.nombreIdentficiador;
                            
                            // Si el soporte es CANAL 13, mostrar CANAL 13 S.P.A.
                            if (soporte === 'CANAL 13') {
                              return 'CANAL 13 S.P.A.';
                            }
                            
                            // Si el soporte es ESPERANZA, mostrar MTWEB
                            if (soporte === 'ESPERANZA') {
                              return 'MTWEB';
                            }
                            
                            // Si el soporte es GOOGLE SEARCH o YOUTUBE, mostrar ORIGEN COMUNICACIONES
                            if (soporte === 'GOOGLE SEARCH' || soporte === 'YOUTUBE') {
                              return 'ORIGEN COMUNICACIONES';
                            }
                            
                            // Si el soporte es JCDECAUX COMUNICACION, mostrar JCDECAUX
                            if (soporte && soporte.includes('JCDECAUX')) {
                              return 'JCDECAUX COMUNICACION EXTERIOR CHILE S.A.';
                            }
                            
                            // Por defecto, mostrar el nombre del medio
                            const medio = orden.Contratos?.Proveedores?.nombreProveedor;
                            if (medio) {
                              return medio;
                            }
                            
                            return 'ORIGEN COMUNICACIONES';
                          })()}
                        </TableCell>
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