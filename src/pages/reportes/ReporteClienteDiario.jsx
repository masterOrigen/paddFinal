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
  Autocomplete,
  Chip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pagination } from '@mui/material';

const ReporteClienteDiario = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesAgrupadas, setOrdenesAgrupadas] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: null,
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

  const buscarOrdenes = async () => {
    try {
      setLoading(true);
      
      if (!filtros.cliente || !filtros.anio || !filtros.mes) {
        alert('Por favor seleccione cliente, año y mes');
        return;
      }

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
      query = query
        .eq('Campania.id_Cliente', filtros.cliente.id_cliente)
        .eq('plan.anio', filtros.anio)
        .eq('plan.mes', filtros.mes);

      const { data: ordenesData, error } = await query.order('fechaCreacion', { ascending: true });

      if (error) throw error;

      // Para cada orden, obtener sus alternativas para calcular las fechas de exhibición
      const ordenesConFechasExhibicion = await Promise.all(
        ordenesData?.map(async (orden) => {
          let fechasExhibicion = '';
          let tarifaBrutaTotal = 0;
          
          // Obtener alternativas de esta orden
          if (orden.alternativas_plan_orden) {
            let idsAlternativas = [];
            
            // Extraer IDs de alternativas_plan_orden
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
                .select(`
                  calendar,
                  horario_inicio,
                  horario_fin,
                  total_bruto,
                  segundos,
                  id_tema,
                  id_programa,
                  id_clasificacion,
                  Temas (id_tema, NombreTema, id_Calidad, Calidad (id, NombreCalidad)),
                  Programas (id, descripcion, codigo_programa),
                  Clasificacion (id, NombreClasificacion)
                `)
                .in('id', idsAlternativas);

              if (alternativas && alternativas.length > 0) {
                // Calcular tarifa bruta total
                tarifaBrutaTotal = alternativas.reduce((total, alt) => total + (alt.total_bruto || 0), 0);
                
                // Procesar calendario para obtener rangos de fechas
                const rangos = [];
                alternativas.forEach(alt => {
                  if (alt.calendar) {
                    try {
                      let calendarData = alt.calendar;
                      if (typeof calendarData === 'string') {
                        calendarData = JSON.parse(calendarData);
                      }

                      if (Array.isArray(calendarData)) {
                        // Agrupar días consecutivos en rangos
                        const dias = calendarData
                          .map(item => item.dia)
                          .sort((a, b) => a - b);
                        
                        if (dias.length > 0) {
                          let rangoInicio = dias[0];
                          let rangoFin = dias[0];
                          
                          for (let i = 1; i < dias.length; i++) {
                            if (dias[i] === rangoFin + 1) {
                              rangoFin = dias[i];
                            } else {
                              rangos.push({ inicio: rangoInicio, fin: rangoFin });
                              rangoInicio = dias[i];
                              rangoFin = dias[i];
                            }
                          }
                          rangos.push({ inicio: rangoInicio, fin: rangoFin });
                        }
                      }
                    } catch (e) {
                      console.error('Error procesando calendar:', e);
                    }
                  }
                });

                // Formatear rangos de fechas
                if (rangos.length > 0) {
                  const nombreMes = meses.find(m => m.Id === filtros.mes)?.Nombre || '';
                  const anio = anios.find(a => a.id === filtros.anio)?.years || '';
                  
                  // Obtener todos los días únicos ordenados
                  const todosLosDias = [...new Set(rangos.flatMap(r => 
                    r.inicio === r.fin ? [r.inicio] : 
                    Array.from({length: r.fin - r.inicio + 1}, (_, i) => r.inicio + i)
                  ))].sort((a, b) => a - b);
                  
                  // Agrupar días consecutivos
                  const rangosFinales = [];
                  if (todosLosDias.length > 0) {
                    let inicio = todosLosDias[0];
                    let fin = todosLosDias[0];
                    
                    for (let i = 1; i < todosLosDias.length; i++) {
                      if (todosLosDias[i] === fin + 1) {
                        fin = todosLosDias[i];
                      } else {
                        rangosFinales.push({ inicio, fin });
                        inicio = todosLosDias[i];
                        fin = todosLosDias[i];
                      }
                    }
                    rangosFinales.push({ inicio, fin });
                  }
                  
                  // Formatear salida
                  if (rangosFinales.length === 1) {
                    if (rangosFinales[0].inicio === rangosFinales[0].fin) {
                      fechasExhibicion = `${rangosFinales[0].inicio} de ${nombreMes}`;
                    } else {
                      fechasExhibicion = `${rangosFinales[0].inicio} al ${rangosFinales[0].fin} de ${nombreMes}`;
                    }
                  } else {
                    const diasIndividuales = rangosFinales.map(r => 
                      r.inicio === r.fin ? r.inicio.toString() : `${r.inicio} al ${r.fin}`
                    );
                    fechasExhibicion = `${diasIndividuales.join(', ')} de ${nombreMes}`;
                  }
                }
              }
            }
          }

          return {
            ...orden,
            fechasExhibicion: fechasExhibicion || 'Sin fechas definidas',
            tarifaBrutaTotal: tarifaBrutaTotal
          };
        }) || []
      );

      // Agrupar órdenes por día
      const ordenesPorDia = {};
      
      ordenesConFechasExhibicion.forEach(orden => {
        const fecha = orden.fechaCreacion;
        const dia = format(new Date(fecha), 'yyyy-MM-dd');
        
        if (!ordenesPorDia[dia]) {
          ordenesPorDia[dia] = {
            fecha: dia,
            fechaFormateada: format(new Date(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
            ordenes: [],
            totalInversion: 0,
            totalOrdenes: 0
          };
        }
        
        ordenesPorDia[dia].ordenes.push(orden);
        ordenesPorDia[dia].totalOrdenes++;
        ordenesPorDia[dia].totalInversion += orden.Campania?.Presupuesto || 0;
      });

      // Convertir a array y ordenar por fecha
      const agrupadas = Object.values(ordenesPorDia).sort((a, b) =>
        new Date(a.fecha) - new Date(b.fecha)
      );

      // Identificar y marcar órdenes por versión
      // Obtener todas las órdenes de forma plana
      const todasLasOrdenes = agrupadas.flatMap(dia => dia.ordenes);
      
      // Agrupar órdenes por número correlativo
      const ordenesPorNumero = {};
      todasLasOrdenes.forEach(orden => {
        const numOrden = orden.numero_correlativo;
        if (!ordenesPorNumero[numOrden]) {
          ordenesPorNumero[numOrden] = [];
        }
        ordenesPorNumero[numOrden].push(orden);
      });

      // Para cada grupo de órdenes con el mismo número, encontrar la versión mayor
      Object.keys(ordenesPorNumero).forEach(numOrden => {
        const ordenesMismoNumero = ordenesPorNumero[numOrden];
        
        if (ordenesMismoNumero.length > 1) {
          // Encontrar la versión mayor
          let versionMayor = -1;
          let ordenActiva = null;
          
          ordenesMismoNumero.forEach(orden => {
            const version = parseInt(orden.copia) || 0;
            if (version > versionMayor) {
              versionMayor = version;
              ordenActiva = orden;
            }
          });
          
          // Marcar la de versión mayor como activa y las demás como anuladas
          ordenesMismoNumero.forEach(orden => {
            if (orden === ordenActiva) {
              orden.estado = 'activa';
            } else {
              orden.estado = 'anulada';
            }
          });
        }
      });

      setOrdenesAgrupadas(agrupadas);
    } catch (error) {
      console.error('Error al buscar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: null,
      anio: '',
      mes: ''
    });
    setOrdenesAgrupadas([]);
  };

  const exportarExcel = async () => {
    const dataToExport = [];
    
    // Recopilar todas las órdenes no anuladas
    const ordenesNoAnuladas = [];
    
    for (const dia of ordenesAgrupadas) {
      for (const orden of dia.ordenes) {
        // Omitir órdenes anuladas
        if (orden.estado === 'anulada') {
          continue;
        }
        ordenesNoAnuladas.push({ ...orden, fechaCreacion: dia.fecha });
      }
    }

    // Procesar cada orden para obtener sus días de exhibición
    for (const orden of ordenesNoAnuladas) {
      let diasExhibicion = [];
      
      // Obtener los días individuales de exhibición para esta orden
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
          // Obtener alternativas para extraer los días del calendario y datos adicionales
          const { data: alternativas, error } = await supabase
            .from('alternativa')
            .select(`
              calendar,
              segundos,
              id_tema,
              id_programa,
              id_clasificacion,
              Temas (id_tema, NombreTema, id_Calidad, Calidad (id, NombreCalidad)),
              Programas (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion)
            `)
            .in('id', idsAlternativas);

          if (!error && alternativas && alternativas.length > 0) {
            const todosLosDias = new Set();
            
            alternativas.forEach(alt => {
              if (alt.calendar) {
                try {
                  let calendarData = alt.calendar;
                  if (typeof calendarData === 'string') {
                    calendarData = JSON.parse(calendarData);
                  }

                  if (Array.isArray(calendarData)) {
                    calendarData.forEach(item => {
                      if (item.dia) {
                        todosLosDias.add(item.dia);
                      }
                    });
                  }
                } catch (e) {
                  console.error('Error procesando calendar:', e);
                }
              }
            });

            diasExhibicion = Array.from(todosLosDias).sort((a, b) => a - b);
            
            // Guardar datos adicionales de las alternativas para usarlos en el Excel
            orden.datosAlternativas = alternativas;
          }
        }
      }

      // Si no hay días de exhibición específicos, usar la fecha de creación
      if (diasExhibicion.length === 0) {
        diasExhibicion = [new Date(orden.fechaCreacion).getDate()];
      }

      // Crear una línea por cada día de exhibición
      const nombreMes = meses.find(m => m.Id === filtros.mes)?.Nombre || '';
      
      diasExhibicion.forEach(diaNum => {
        // Formatear fecha como DD/MM/YYYY
        // Obtener el año correcto desde el objeto de años
        const anioSeleccionado = anios.find(a => a.id === filtros.anio);
        const anioReal = anioSeleccionado ? anioSeleccionado.years : new Date().getFullYear();
        const fechaFormateada = format(new Date(anioReal, filtros.mes - 1, diaNum), 'dd/MM/yyyy');
        
        // Obtener datos de la primera alternativa para los campos adicionales
        const primeraAlternativa = orden.datosAlternativas && orden.datosAlternativas.length > 0 ? orden.datosAlternativas[0] : null;
        
        dataToExport.push({
          'Cliente': orden.Campania?.Clientes?.nombreCliente || '',
          'Mes': orden.plan?.Meses?.Id || '',
          'N° de Ctto.': orden.Contratos?.NombreContrato || '',
          'N° de Orden': orden.numero_correlativo || '',
          'Version': orden.copia || '',
          'Medio': orden.Soportes?.Medios?.NombredelMedio || orden.Soportes?.id_medios || '',
          'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
          'Soporte': orden.Soportes?.nombreIdentficiador || '',
          'Campaña': orden.Campania?.NombreCampania || '',
          'Plan de Medios': orden.plan?.nombre_plan || '',
          'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
          'Tema': primeraAlternativa?.Temas?.NombreTema || '',
          'Seg': primeraAlternativa?.segundos || '',
          'Prog./Elem./Formato': primeraAlternativa?.Programas?.descripcion || primeraAlternativa?.Clasificacion?.NombreClasificacion || '',
          'Fecha Exhib./Pub.': fechaFormateada,
          'Inversion Neta': formatCurrency(orden.tarifaBrutaTotal || 0),
          'Agen.Creativa': '', // Campo no disponible en la estructura actual
          'Cod. Univ. Aviso': '', // Campo no disponible en la estructura actual
          'Cod. Univ. Prog': primeraAlternativa?.Programas?.codigo_programa || '',
          'Calidad': primeraAlternativa?.Temas?.Calidad?.NombreCalidad || '',
          'Cod.Usu.': orden.usuario_registro?.id_usuario || '',
          'Nombre Usuario': orden.usuario_registro?.nombre || '',
          'Grupo Usuario': orden.usuario_registro?.grupo || ''
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Cliente Diario');
    
    const nombreArchivo = `Reporte_Cliente_Diario_${filtros.cliente?.nombreCliente || 'SinCliente'}_${filtros.anio}_${filtros.mes}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
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

  // Obtener todas las órdenes de forma plana para paginación
  const todasLasOrdenes = ordenesAgrupadas.flatMap((dia) => dia.ordenes);
  
  const paginatedOrdenes = todasLasOrdenes.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Función para calcular los totales - se llamará después de procesar versiones
  const calcularTotales = (ordenesProcesadas) => {
    // Sumar la tarifa bruta de todas las órdenes activas
    let totalBruta = 0;
    let totalActivas = 0;
    const todosLosDias = new Set();
    
    ordenesProcesadas.forEach(dia => {
      dia.ordenes.forEach(orden => {
        if (orden.estado === 'activa') {
          totalBruta += orden.tarifaBrutaTotal || 0;
          totalActivas++;
          
          // Extraer días de exhibición
          if (orden.fechasExhibicion && orden.fechasExhibicion !== 'Sin fechas definidas') {
            const numeros = orden.fechasExhibicion.match(/\d+/g);
            if (numeros) {
              numeros.forEach(num => {
                todosLosDias.add(parseInt(num));
              });
            }
          }
        }
      });
    });
    
    return {
      totalInversionMes: totalBruta,
      totalOrdenesMes: totalActivas,
      totalDiasExhibicion: todosLosDias.size
    };
  };

  const totales = React.useMemo(() => {
    return calcularTotales(ordenesAgrupadas);
  }, [ordenesAgrupadas]);

  const totalInversionMes = totales.totalInversionMes;
  const totalOrdenesMes = totales.totalOrdenesMes;
  const totalDiasExhibicion = totales.totalDiasExhibicion;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Reporte Cliente Diario
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
              getOptionLabel={(option) => `${option.nombreCliente} - ${option.razonSocial}`}
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
              onClick={buscarOrdenes}
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
          {ordenesAgrupadas.length > 0 && (
            <Button variant="contained" color="success" onClick={exportarExcel}>
              Exportar a Excel
            </Button>
          )}
        </Box>
      </Paper>

      {ordenesAgrupadas.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="h6" color="#1976d2">
                  {totalOrdenesMes}
                </Typography>
                <Typography variant="body2" color="#666">
                  Total Órdenes del Mes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                <Typography variant="h6" color="#2e7d32">
                  {totalDiasExhibicion}
                </Typography>
                <Typography variant="body2" color="#666">
                  Días con Actividad
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                <Typography variant="h6" color="#f57c00">
                  {formatCurrency(totalInversionMes)}
                </Typography>
                <Typography variant="body2" color="#666">
                  Inversión Bruta del Mes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resultados
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : ordenesAgrupadas.length > 0 ? (
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
                    <TableCell sx={{ minWidth: 150 }}>Fecha Exhib./Pub.</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="right">Tarifa Bruta</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Usuario Crea</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden) => {
                    // Encontrar la fecha de creación para esta orden
                    const diaOrden = ordenesAgrupadas.find(dia => 
                      dia.ordenes.some(o => o.id_ordenes_de_comprar === orden.id_ordenes_de_comprar)
                    );
                    const fechaCreacion = diaOrden ? diaOrden.fecha : orden.fechaCreacion;
                    
                    return (
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
                            {orden.fechasExhibicion}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(orden.tarifaBrutaTotal || 0)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={orden.estado || 'ACTIVA'}
                            color={orden.estado === 'anulada' ? 'error' : 'success'}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: '24px' }}
                          />
                        </TableCell>
                        <TableCell>
                          {orden.usuario_registro?.nombre || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="#666">
                Total de órdenes: {totalOrdenesMes}
              </Typography>
              <Pagination
                count={Math.ceil(todasLasOrdenes.length / rowsPerPage)}
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

export default ReporteClienteDiario;