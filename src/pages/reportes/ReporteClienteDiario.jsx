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

const ReporteClienteDiario = () => {
  const [loading, setLoading] = useState(false);
  const [ordenesAgrupadas, setOrdenesAgrupadas] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: { id_cliente: 'all', nombreCliente: 'Todos', razonSocial: 'Todos los clientes' },
    campana: '',
    anio: '',
    mes: ''
  });
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [anios, setAnios] = useState([]);
  const [meses, setMeses] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25);

  useEffect(() => {
    fetchClientes();
    fetchAnios();
    fetchMeses();
  }, []);

  useEffect(() => {
    if (filtros.cliente && filtros.cliente.id_cliente !== 'all') {
      fetchCampanas(filtros.cliente.id_cliente);
    } else {
      setCampanas([]);
      setFiltros(prev => ({ ...prev, campana: '' }));
    }
  }, [filtros.cliente]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente, razonSocial')
        .order('nombreCliente');

      if (error) throw error;

      // Agregar opción "Todos" al inicio de la lista
      const clientesConTodos = [
        { id_cliente: 'all', nombreCliente: 'Todos', razonSocial: 'Todos los clientes' },
        ...(data || [])
      ];

      setClientes(clientesConTodos);
    } catch (error) {
      // Error al cargar clientes
    }
  };

  const fetchCampanas = async (idCliente) => {
    try {
      const { data, error } = await supabase
        .from('Campania')
        .select('id_campania, NombreCampania')
        .eq('id_Cliente', idCliente)
        .order('NombreCampania');

      if (error) throw error;
      
      // Eliminar duplicados basándose en NombreCampania (nombre de la campaña)
      const campanasUnicas = data?.reduce((acc, campana) => {
        if (!acc.find(c => c.NombreCampania === campana.NombreCampania)) {
          acc.push(campana);
        }
        return acc;
      }, []) || [];
      
      setCampanas(campanasUnicas);
    } catch (error) {
      // Error al cargar campañas
      setCampanas([]);
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
      // Error al cargar años
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
      // Error al cargar meses
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

      // Validación: si no es "Todos", entonces año y mes son requeridos
      if (filtros.cliente && filtros.cliente.id_cliente !== 'all') {
        if (!filtros.anio || !filtros.mes) {
          Swal.fire({
            icon: 'warning',
            title: 'Faltan datos',
            text: 'Por favor seleccione año y mes para un cliente específico',
            confirmButtonColor: '#1976d2'
          });
          return;
        }
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
            Productos!id_Producto (id, NombreDelProducto),
            Agencias!Id_Agencia (id, NombreIdentificador)
          ),
          Contratos (id, NombreContrato, num_contrato, IdProveedor, IdMedios, id_GeneraracionOrdenTipo,
            Proveedores (id_proveedor, nombreProveedor, rutProveedor, razonSocial),
            Medios (id, NombredelMedio),
            TipoGeneracionDeOrden!id_GeneraracionOrdenTipo (id, NombreTipoOrden)
          ),
          Soportes!left (id_soporte, nombreIdentficiador, id_medios,
            Medios!left (id, NombredelMedio)
          ),
          plan!inner (id, nombre_plan, anio, mes,
            Anios!anio (id, years),
            Meses (Id, Nombre)
          )
        `);

      // Aplicar filtros
      // Solo filtrar por cliente si no está seleccionado "Todos"
      if (filtros.cliente && filtros.cliente.id_cliente !== 'all') {
        query = query.eq('Campania.id_Cliente', filtros.cliente.id_cliente);
      }

      // Filtrar por campaña si está seleccionada
      // Buscar por nombre de campaña en lugar de ID para incluir todas las campañas con el mismo nombre
      if (filtros.campana) {
        query = query.eq('Campania.NombreCampania', filtros.campana);
      }

      // Solo filtrar por año y mes si están seleccionados
      if (filtros.anio) {
        query = query.eq('plan.anio', filtros.anio);
      }

      if (filtros.mes) {
        query = query.eq('plan.mes', filtros.mes);
      }

      const { data: ordenesData, error } = await query.order('fechaCreacion', { ascending: true });

      if (error) throw error;

      // Para cada orden, obtener sus alternativas para calcular las fechas de exhibición
      const ordenesConFechasExhibicion = await Promise.all(
        ordenesData?.map(async (orden) => {
          let fechasExhibicion = '';
          let tarifaBrutaTotal = 0;
          let tarifaNetaTotal = 0;

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
              // Error parseando alternativas_plan_orden
            }

            if (idsAlternativas.length > 0) {
              const { data: alternativas } = await supabase
                .from('alternativa')
                .select(`
                  id,
                  calendar,
                  horario_inicio,
                  horario_fin,
                  total_bruto,
                  total_neto,
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
                // Guardar datos de alternativas para usar en la expansión
                orden.datosAlternativas = alternativas;

                // Calcular tarifa bruta total
                tarifaBrutaTotal = alternativas.reduce((total, alt) => total + (alt.total_bruto || 0), 0);

                // Calcular tarifa neta total
                tarifaNetaTotal = alternativas.reduce((total, alt) => total + (alt.total_neto || 0), 0);

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
                      // Error procesando calendar
                    }
                  }
                });

                // Formatear rangos de fechas
                if (rangos.length > 0) {
                  // Si es "Todos los clientes", usar el mes del plan de la orden
                  // Si es cliente específico, usar el mes del filtro
                  const mesId = (filtros.cliente && filtros.cliente.id_cliente === 'all')
                    ? orden.plan?.mes
                    : filtros.mes;
                  const nombreMes = meses.find(m => m.Id === mesId)?.Nombre || '';
                  const anio = anios.find(a => a.id === filtros.anio)?.years || '';

                  // Obtener todos los días únicos ordenados
                  const todosLosDias = [...new Set(rangos.flatMap(r =>
                    r.inicio === r.fin ? [r.inicio] :
                      Array.from({ length: r.fin - r.inicio + 1 }, (_, i) => r.inicio + i)
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
            tarifaBrutaTotal: tarifaBrutaTotal,
            tarifaNetaTotal: tarifaNetaTotal
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
              // Si la orden ya viene anulada de BD, respetamos ese estado
              if (orden.estado !== 'anulada') {
                orden.estado = 'activa';
              }
            } else {
              orden.estado = 'anulada';
            }
          });
        }
      });

      // Filtrar órdenes anuladas solo cuando se selecciona "Todos los clientes"
      let ordenesFinales = agrupadas;
      if (filtros.cliente && filtros.cliente.id_cliente === 'all') {
        ordenesFinales = agrupadas.map(dia => ({
          ...dia,
          ordenes: dia.ordenes.filter(orden => orden.estado !== 'anulada')
        })).filter(dia => dia.ordenes.length > 0); // Eliminar días sin órdenes
      }

      setOrdenesAgrupadas(ordenesFinales);
    } catch (error) {
      // Error al buscar órdenes
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: { id_cliente: 'all', nombreCliente: 'Todos', razonSocial: 'Todos los clientes' },
      campana: '',
      anio: '',
      mes: ''
    });
    setOrdenesAgrupadas([]);
  };

  const exportarExcel = async () => {
    try {
      // Mostrar loading
      Swal.fire({
        title: 'Generando reporte...',
        html: 'Por favor espere mientras se procesan los datos.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Dar un pequeño tiempo para que se renderice el modal antes de bloquear el hilo JS
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataToExport = [];

      // Recopilar todas las órdenes no anuladas - siempre filtrar órdenes anuladas
      const ordenesNoAnuladas = [];

      for (const dia of ordenesAgrupadas) {
        for (const orden of dia.ordenes) {
          // Siempre omitir órdenes anuladas, sin importar el filtro de cliente
          if (orden.estado === 'anulada') {
            continue;
          }
          ordenesNoAnuladas.push({ ...orden, fechaCreacion: dia.fecha });
        }
      }

      // Procesar cada orden para obtener sus días de exhibición por alternativa
      for (const orden of ordenesNoAnuladas) {
        // Obtener los IDs de alternativas para esta orden
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
            // Error parseando alternativas_plan_orden
          }

          if (idsAlternativas.length > 0) {
            // Obtener alternativas para extraer los días del calendario y datos adicionales
            const { data: alternativas, error } = await supabase
              .from('alternativa')
              .select(`
                id,
                calendar,
                segundos,
                total_bruto,
                total_neto,
                id_tema,
                id_programa,
                id_clasificacion,
                Temas (id_tema, NombreTema, id_Calidad, Calidad (id, NombreCalidad)),
                Programas (id, descripcion, codigo_programa),
                Clasificacion (id, NombreClasificacion)
              `)
              .in('id', idsAlternativas);

            if (!error && alternativas && alternativas.length > 0) {
              // Procesar cada alternativa por separado
              for (const alternativa of alternativas) {
                let diasExhibicion = [];

                // Extraer días del calendario de esta alternativa específica
                if (alternativa.calendar) {
                  try {
                    let calendarData = alternativa.calendar;
                    if (typeof calendarData === 'string') {
                      calendarData = JSON.parse(calendarData);
                    }

                    if (Array.isArray(calendarData)) {
                      const diasSet = new Set();
                      calendarData.forEach(item => {
                        if (item.dia) {
                          diasSet.add(item.dia);
                        }
                      });
                      diasExhibicion = Array.from(diasSet).sort((a, b) => a - b);
                    }
                  } catch (e) {
                    // Error procesando calendar
                  }
                }

                // Si no hay días de exhibición específicos, usar la fecha de creación
                if (diasExhibicion.length === 0) {
                  diasExhibicion = [new Date(orden.fechaCreacion).getDate()];
                }

                // Calcular inversión neta dividida por la cantidad de fechas de exhibición de esta alternativa
                const inversionNetaDividida = (alternativa.total_neto || 0) / (diasExhibicion.length || 1);
                const inversionBrutaDividida = (alternativa.total_bruto || 0) / (diasExhibicion.length || 1);

                // Crear una línea por cada día de exhibición de esta alternativa
                const nombreMes = meses.find(m => m.Id === filtros.mes)?.Nombre || '';

                diasExhibicion.forEach(diaNum => {
                  // Formatear fecha como DD/MM/YYYY
                  const anioReal = orden.plan?.Anios?.years || new Date().getFullYear();
                  const mesReal = orden.plan?.mes || (new Date().getMonth() + 1);
                  const fechaFormateada = format(new Date(anioReal, mesReal - 1, diaNum), 'dd/MM/yyyy');

                  // Determinar si el contrato es Neto (id=1) o Bruto (id=2)
                  const tipoOrden = orden.Contratos?.id_GeneraracionOrdenTipo || 1;
                  const esNeto = tipoOrden === 1;

                  dataToExport.push({
                    'Cliente': orden.Campania?.Clientes?.nombreCliente || '',
                    'Mes': orden.plan?.Meses?.Id || '',
                    'N° de Ctto.': orden.Contratos?.NombreContrato || '',
                    'N° de Orden': orden.numero_correlativo || '',
                    'Version': orden.copia || '',
                    'Medio': orden.Contratos?.Medios?.NombredelMedio || orden.Soportes?.Medios?.NombredelMedio || '',
                    'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                    'Soporte': orden.Soportes?.nombreIdentficiador || '',
                    'Campaña': orden.Campania?.NombreCampania || '',
                    'Plan de Medios': orden.plan?.nombre_plan || '',
                    'Producto': orden.Campania?.Productos?.NombreDelProducto || 'No asignado',
                    'Tema': alternativa?.Temas?.NombreTema || '',
                    'Seg': alternativa?.segundos || '',
                    'Prog./Elem./Formato': alternativa?.Programas?.descripcion || alternativa?.Clasificacion?.NombreClasificacion || '',
                    'Año': orden.plan?.Anios?.years || '',
                    'Fecha Exhib./Pub.': fechaFormateada,
                    'Inversion Neta': esNeto ? inversionNetaDividida : '',
                    'Inversion Bruta': esNeto ? '' : inversionBrutaDividida,
                    'Tipo Ctto': orden.Contratos?.TipoGeneracionDeOrden?.NombreTipoOrden || (esNeto ? 'Neto' : 'Bruto'),
                    'Agen.Creativa': orden.Campania?.Agencias?.NombreIdentificador || '',
                    'Cod. Univ. Aviso': '',
                    'Cod. Univ. Prog': alternativa?.Programas?.codigo_programa || '',
                    'Calidad': alternativa?.Temas?.Calidad?.NombreCalidad || '',
                    'Cod.Usu.': orden.usuario_registro?.id_usuario || '',
                    'Nombre Usuario': orden.usuario_registro?.nombre || '',
                    'Grupo Usuario': orden.usuario_registro?.grupo || ''
                  });
                });
              }
            }
          }
        }
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Cliente Diario');

      const nombreCliente = filtros.cliente?.nombreCliente === 'Todos' ? 'TodosLosClientes' : filtros.cliente?.nombreCliente || 'SinCliente';
      const nombreArchivo = `Reporte_Cliente_Diario_${nombreCliente}_${filtros.anio}_${filtros.mes}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);

      Swal.close();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al generar el reporte',
      });
    }
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

  // Función para expandir órdenes por alternativa
  const expandirOrdenes = (ordenesAgrupadas) => {
    let ordenesExpandidas = [];

    ordenesAgrupadas.forEach(dia => {
      dia.ordenes.forEach(orden => {
        // Extraer IDs de alternativas
        let idsAlternativas = [];
        try {
          if (Array.isArray(orden.alternativas_plan_orden)) {
            idsAlternativas = orden.alternativas_plan_orden;
          } else if (typeof orden.alternativas_plan_orden === 'string') {
            const parsed = JSON.parse(orden.alternativas_plan_orden);
            idsAlternativas = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
          // Error parseando alternativas
        }

        // Si no hay alternativas, mostrar la orden una vez
        if (!idsAlternativas || idsAlternativas.length === 0) {
          ordenesExpandidas.push({ 
            ...orden, 
            alternativaActual: null, 
            fechaCreacion: dia.fecha,
            tarifaBrutaIndividual: orden.tarifaBrutaTotal || 0,
            tarifaNetaIndividual: orden.tarifaNetaTotal || 0
          });
          return;
        }

        // Si hay alternativas, crear una fila por cada alternativa
        // Buscar los datos de cada alternativa en datosAlternativas
        idsAlternativas.forEach(idAlternativa => {
          // Buscar la alternativa específica en los datos que ya tenemos
          const alternativaData = orden.datosAlternativas?.find(alt => alt.id === idAlternativa);
          
          ordenesExpandidas.push({
            ...orden,
            alternativaActual: idAlternativa,
            fechaCreacion: dia.fecha,
            tarifaBrutaIndividual: alternativaData?.total_bruto || 0,
            tarifaNetaIndividual: alternativaData?.total_neto || 0,
            alternativaInfo: alternativaData // Guardar toda la info de la alternativa
          });
        });
      });
    });

    return ordenesExpandidas;
  };

  // Obtener todas las órdenes expandidas por alternativa
  const ordenesExpandidas = expandirOrdenes(ordenesAgrupadas);

  const paginatedOrdenes = ordenesExpandidas.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );


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
          <Grid item xs={12} sm={2.5}>
            <Autocomplete
              size="small"
              options={clientes}
              getOptionLabel={(option) => {
                if (option.id_cliente === 'all') {
                  return 'Todos los clientes';
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
                    return 'todos los clientes'.includes(inputLower);
                  }
                  const nombreCliente = option.nombreCliente?.toLowerCase() || '';
                  const razonSocial = option.razonSocial?.toLowerCase() || '';
                  return nombreCliente.includes(inputLower) || razonSocial.includes(inputLower);
                });
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>Campaña</InputLabel>
              <Select
                value={filtros.campana}
                label="Campaña"
                onChange={(e) => handleFiltroChange('campana', e.target.value)}
                disabled={!filtros.cliente || filtros.cliente.id_cliente === 'all'}
                displayEmpty
                notched
              >
                <MenuItem value="">
                  <em>Todas las campañas</em>
                </MenuItem>
                {campanas.map((campana) => (
                  <MenuItem key={campana.id_campania} value={campana.NombreCampania}>
                    {campana.NombreCampania}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={1.5}>
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

          <Grid item xs={12} sm={1.5}>
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
                    <TableCell sx={{ minWidth: 120 }}>Medio</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Proveedor</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Mes</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Fecha Exhib./Pub.</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="right">Tarifa Bruta</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="right">Tarifa Neta</TableCell>
                    <TableCell sx={{ minWidth: 80 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Usuario Crea</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((orden, index) => {
                    return (
                      <TableRow key={`${orden.id_ordenes_de_comprar}-${orden.alternativaActual || 'default'}-${index}`}>
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
                          {orden.Contratos?.Medios?.NombredelMedio || orden.Soportes?.Medios?.NombredelMedio || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {orden.Campania?.Productos?.NombreDelProducto || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {orden.Contratos?.Proveedores?.nombreProveedor || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {orden.plan?.Meses?.Nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {orden.fechasExhibicion}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(orden.tarifaBrutaIndividual || 0)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(orden.tarifaNetaIndividual || 0)}
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
                Total resultados: {ordenesExpandidas.length}
              </Typography>
              <Pagination
                count={Math.ceil(ordenesExpandidas.length / rowsPerPage)}
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
