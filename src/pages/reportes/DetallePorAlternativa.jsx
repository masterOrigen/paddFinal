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
  Divider,
  Tooltip,
  Modal,
  IconButton
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import './ReporteOrdenDeCompra.css';
import { Pagination, Checkbox } from '@mui/material';
// Importar la función de consulta de alternativas
import { consultarAlternativaPorId } from '../../utils/ConsultaAlternativa';
// Importar la función para generar el informe de inversión
import { generarExcelInformeInversion } from '../../utils/GeneradorExcelAlternativa';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Preview';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import Swal from 'sweetalert2';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ReporteOrdenDeCompra = () => {
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: '',
    fechaInicio: null,
    fechaFin: null,
    campania: '' // Agregar campaña al estado de filtros
  });
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [previewData, setPreviewData] = useState([]);
  const [openPreview, setOpenPreview] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');

  // Nueva función para mostrar la estructura SQL y alternativas_plan_orden
  const showSQLSchemaAndAlternativas = () => {
  

    // Obtener algunas órdenes para ver el formato de alternativas_plan_orden
    supabase
      .from('OrdenesDePublicidad')
      .select('id_ordenes_de_comprar, alternativas_plan_orden, numero_correlativo')
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          // console.error('Error al obtener órdenes:', error);
        } else if (data && data.length > 0) {
          // console.log('Ejemplos de alternativas_plan_orden:');
          data.forEach(orden => {
            // console.log(`Orden ID: ${orden.id_ordenes_de_comprar}, Número: ${orden.numero_correlativo}`);
            // console.log('alternativas_plan_orden:', orden.alternativas_plan_orden);
            
            if (orden.alternativas_plan_orden) {
              // console.log('Tipo:', typeof orden.alternativas_plan_orden);
              
              // Intentar analizar el campo según su tipo
              if (typeof orden.alternativas_plan_orden === 'string') {
                try {
                  const parsed = JSON.parse(orden.alternativas_plan_orden);
                  // console.log('Contenido parseado:', parsed);
                } catch (e) {
                  // console.log('No se pudo parsear como JSON');
                }
              } else if (Array.isArray(orden.alternativas_plan_orden)) {
                // console.log('Es un array con', orden.alternativas_plan_orden.length, 'elementos');
                // console.log('Elementos:', orden.alternativas_plan_orden);
              } else if (typeof orden.alternativas_plan_orden === 'object') {
                // console.log('Es un objeto con propiedades:', Object.keys(orden.alternativas_plan_orden));
                // console.log('Valores:', Object.values(orden.alternativas_plan_orden));
              }
            } else {
              // console.log('Campo alternativas_plan_orden vacío o nulo');
            }
            // console.log('-------------------');
          });
        } else {
          // console.log('No se encontraron órdenes');
        }
      });
  };

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
    // Llamar a la función para mostrar la estructura SQL y alternativas
    showSQLSchemaAndAlternativas();
    
    // Consultar detalles de una alternativa específica por ID
    // Puedes cambiar este ID por el que necesites consultar
    consultarAlternativaPorId(158);
  }, []);

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
      // Error al cargar clientes
    } finally {
      setLoading(false);
    }
  };

  const fetchCampanas = async (idCliente = null) => {
    try {
      setLoading(true);
      let query = supabase
        .from('Campania')
        .select('id_campania, NombreCampania, Presupuesto')
        .order('NombreCampania');
      if (idCliente) {
        query = query.eq('id_Cliente', idCliente);
      }
      const { data, error } = await query;
      if (error) throw error;
      setCampanas(data || []);
    } catch (error) {
      // Error al cargar campañas
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    if (campo === 'cliente') {
      fetchCampanas(valor);
      setFiltros(prev => ({ ...prev, campania: '' })); // Limpiar campaña seleccionada
    }
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

      // Aplicar filtro de cliente
      if (filtros.cliente) {
        query = query.eq('Campania.id_Cliente', filtros.cliente);
      }

      // Aplicar filtro de campaña
      if (filtros.campania) {
        query = query.eq('Campania.id_campania', filtros.campania);
      }

      // Aplicar filtro de fecha inicio
      if (filtros.fechaInicio) {
        const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
        query = query.gte('fechaCreacion', fechaInicioFormateada);
      }

      // Aplicar filtro de fecha fin
      if (filtros.fechaFin) {
        const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
        query = query.lte('fechaCreacion', fechaFinFormateada);
      }

      const { data, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      
      setOrdenes(data || []);
    } catch (error) {
      // Error al buscar órdenes
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener las alternativas por numerorden
  const fetchAlternativasPorNumeroOrden = async (numeroOrden) => {
    try {
      if (!numeroOrden) return [];
      
      // Consulta completa con todas las relaciones
      const { data, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Programas:id_programa (id, descripcion, codigo_programa),
          Clasificacion (id, NombreClasificacion),
          Temas (id_tema, NombreTema),
          Soportes (id_soporte, nombreIdentficiador),
          Anios (id, years),
          Meses (Id, Nombre),
          Medios (id, "NombredelMedio")
        `)
        .eq('numerorden', numeroOrden);

      if (error) {
        return [];
      }
      
      return data || [];
    } catch (error) {
      // Error al obtener alternativas por numerorden
      return [];
    }
  };

  // Modificar la función fetchAlternativasIndividualmente
  const fetchAlternativasIndividualmente = async (ids) => {
    try {
      if (!ids || ids.length === 0) {
        return [];
      }
      
      // Buscar cada alternativa individualmente con WHERE id = X
      const resultados = [];
      
      // Procesar los IDs secuencialmente
      for (const id of ids) {
        // Consulta completa incluyendo tablas relacionadas
        const { data, error } = await supabase
          .from('alternativa')
          .select(`
            *,
            Programas:id_programa (id, descripcion, codigo_programa),
            Clasificacion (id, NombreClasificacion),
            Temas (id_tema, NombreTema),
            Soportes (id_soporte, nombreIdentficiador),
            Anios (id, years),
            Meses (Id, Nombre),
            Medios (id, "NombredelMedio")
          `)
          .eq('id', id);
        
        if (error) {
          // Error al buscar alternativa
        } else if (data && data.length > 0) {
          resultados.push(...data);
        }
      }
      
      return resultados;
    } catch (error) {
      // Error al obtener alternativas individualmente
      return [];
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: '',
      fechaInicio: null,
      fechaFin: null,
      campania: '' // Agregar campaña al limpiar filtros
    });
  };

  const calcularTotalOrden = (alternativas) => {
    return alternativas.reduce((total, alt) => total + (alt.valor_total || 0), 0);
  };

  const exportarExcel = () => {
    // Preparar los datos a exportar
    const dataToExport = ordenes.map(orden => ({
      'Razón Social Cliente': orden.Campania?.Clientes?.razonSocial || '',
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
      'Inversion neta': orden.Campania?.Presupuesto ? formatCurrency(orden.Campania.Presupuesto) : '',
      'N° Fact.Prov.': '',
      'Fecha Fact.Prov.': '',
      'N° Fact.Age.': '',
      'Fecha Fact.Age.': '',
      'Monto Neto Fact.': '',
      'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
      'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
      'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
      'Estado': mostrarEstado(orden.estado),
      'N° Alternativas': orden.alternativas_plan_orden ? orden.alternativas_plan_orden.length : 0
    }));

    // Crear y descargar el archivo Excel
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte_ordenes.xlsx');
  };

  // Extraer IDs de manera robusta
  const extraerIdsAlternativas = (alternativasPlanOrden) => {
    if (!alternativasPlanOrden) {
      return [];
    }
    
    let ids = [];
    
    try {
      // Caso 1: Ya es un array de números
      if (Array.isArray(alternativasPlanOrden) && 
          alternativasPlanOrden.every(id => typeof id === 'number')) {
        ids = [...alternativasPlanOrden];
      }
      // Caso 2: Es una cadena JSON
      else if (typeof alternativasPlanOrden === 'string') {
        try {
          const parsed = JSON.parse(alternativasPlanOrden);
          if (Array.isArray(parsed)) {
            ids = parsed.map(item => {
              if (typeof item === 'number') return item;
              if (typeof item === 'object' && item !== null) return item.id;
              if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);
              return null;
            }).filter(id => id !== null);
          } else if (typeof parsed === 'object' && parsed !== null) {
            const valores = Object.values(parsed);
            ids = valores.map(val => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
              return null;
            }).filter(id => id !== null);
          }
        } catch (e) {
          // Error parseando string JSON
        }
      }
      // Caso 3: Es un array pero con objetos o strings
      else if (Array.isArray(alternativasPlanOrden)) {
        ids = alternativasPlanOrden.map(item => {
          if (typeof item === 'number') return item;
          if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);
          if (typeof item === 'object' && item !== null) return item.id;
          return null;
        }).filter(id => id !== null);
      }
      // Caso 4: Es un objeto pero no un array
      else if (typeof alternativasPlanOrden === 'object' && alternativasPlanOrden !== null) {
        const valores = Object.values(alternativasPlanOrden);
        ids = valores.map(val => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
          return null;
        }).filter(id => id !== null);
      }
    } catch (e) {
      // Error general procesando los IDs
    }
    
    return ids;
  };

  // Función de prueba para buscar la alternativa 158
  const testBuscarAlternativa158 = async () => {
    try {
      // Consulta directa a la base de datos sin usar funciones intermediarias
      const { data, error } = await supabase
        .from('alternativa')
        .select('*')
        .eq('id', 158)
        .single();
      
      return data;
    } catch (error) {
      return null;
    }
  };

  // Modificar la función ejecutarPrueba para iniciar la prueba al cargar la página
  const ejecutarPrueba = async () => {
    await testBuscarAlternativa158();
  };

  // Agregar esta función de utilidad para obtener el nombre del día de la semana
  const obtenerNombreDiaSemana = (year, month, day) => {
    try {
      // Crear una fecha con el año, mes (0-indexed en JS) y día
      const fecha = new Date(year, month - 1, day);
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return diasSemana[fecha.getDay()];
    } catch (e) {
      return '';
    }
  };

  // Función para preparar los datos de una orden específica
  const prepararDatosOrdenEspecifica = async (orden) => {
    try {
      // Obtener las alternativas relacionadas por número de orden o IDs
      const numeroOrden = orden.numero_correlativo;
      let alternativas = [];
      
      // Primera prueba: Buscar directamente por ID si hay alternativa específica
      if (orden.alternativaActual) {
        const { data, error } = await supabase
          .from('alternativa')
          .select(`
            *,
            Programas:id_programa (id, descripcion, codigo_programa),
            Clasificacion (id, NombreClasificacion),
            Temas (id_tema, NombreTema),
            Soportes (id_soporte, nombreIdentficiador),
            Anios (id, years),
            Meses (Id, Nombre),
            Medios (id, "NombredelMedio")
          `)
          .eq('id', orden.alternativaActual)
          .single();
        
        if (error) {
          // Error al buscar alternativa directa
        } else if (data) {
          alternativas = [data];
        }
      } 
      // Si no hay alternativa específica, obtener todas las relacionadas
      else {
        // Extraer IDs de manera robusta
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            for (const id of ids) {
              const { data, error } = await supabase
                .from('alternativa')
                .select(`
                  *,
                  Programas:id_programa (id, descripcion, codigo_programa),
                  Clasificacion (id, NombreClasificacion),
                  Temas (id_tema, NombreTema),
                  Soportes (id_soporte, nombreIdentficiador),
                  Anios (id, years),
                  Meses (Id, Nombre),
                  Medios (id, "NombredelMedio")
                `)
                .eq('id', id)
                .single();
              
              if (error) {
                // Error al buscar alternativa
              } else if (data) {
                alternativas.push(data);
              }
            }
          }
        }
        
        // Si no se obtuvieron alternativas y tenemos un número de orden, intentar por ese método
        if (alternativas.length === 0 && numeroOrden) {
          const { data, error } = await supabase
            .from('alternativa')
            .select(`
              *,
              Programas:id_programa (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion),
              Temas (id_tema, NombreTema),
              Soportes (id_soporte, nombreIdentficiador),
              Anios (id, years),
              Meses (Id, Nombre),
              Medios (id, "NombredelMedio")
            `)
            .eq('numerorden', numeroOrden);
          
          if (error) {
            // Error al buscar alternativas por numerorden
          } else if (data && data.length > 0) {
            alternativas = data;
          }
        }
      }
      
      // Preparar los datos base de la orden
      const datosBase = {
        'Razón Social Cliente': orden.Campania?.Clientes?.razonSocial || '',
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
        'Inversion neta': orden.Campania?.Presupuesto ? formatCurrency(orden.Campania.Presupuesto) : '',
        'N° Fact.Prov.': '',
        'Fecha Fact.Prov.': '',
        'N° Fact.Age.': '',
        'Fecha Fact.Age.': '',
        'Monto Neto Fact.': '',
        'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
        'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
        'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
        'Estado': mostrarEstado(orden.estado)
      };
      
      // Preparar datos para el Excel
      let dataToExportOrden = [];
      
      // Si no hay alternativas, crear una sola fila con los datos de la orden
      if (alternativas.length === 0) {
        dataToExportOrden = [datosBase];
      } else {
        // Si hay alternativas, crear una fila por cada alternativa con los datos de la orden
        dataToExportOrden = alternativas.map(alt => {
          // Procesar calendario si existe
          let diasCalendario = '';
          if (alt.calendar) {
            try {
              let calendarData = alt.calendar;
              if (typeof calendarData === 'string') {
                calendarData = JSON.parse(calendarData);
              }
              
              // Obtener año y mes de la alternativa o de la orden
              const anio = alt.Anios?.years || orden.plan?.Anios?.years;
              const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
              
              // Si es el nuevo formato de array
              if (Array.isArray(calendarData)) {
                diasCalendario = calendarData.map(item => {
                  const nombreDia = obtenerNombreDiaSemana(anio, mes, item.dia);
                  return `${nombreDia} :${item.cantidad}`;
                }).join(', ');
              } 
              // Si es el formato anterior con days
              else if (calendarData && Array.isArray(calendarData.days)) {
                diasCalendario = calendarData.days.map(dia => {
                  const nombreDia = obtenerNombreDiaSemana(anio, mes, dia);
                  return `${nombreDia}`;
                }).join(', ');
              }
            } catch (e) {
              // Error al procesar calendar para alternativa
            }
          }
          
          // Combinar datos de la orden con los de la alternativa
          return {
            ...datosBase,
            'ID Alternativa': alt.id || '',
            'Línea': alt.nlinea || '',
            'Número Orden': alt.numerorden || '',
            // 'Año ID': alt.anio || '',
            // 'Mes ID': alt.mes || '',
            // 'ID Campaña': alt.id_campania || '',
            'Número Contrato': alt.num_contrato || '',
            // 'ID Soporte': alt.id_soporte || '',
            'Descripción': alt.descripcion || '',
            'Tipo Item': alt.tipo_item || '',
            // 'ID Clasificación': alt.id_clasificacion || '',
            'Detalle': alt.detalle || '',
            // 'ID Tema': alt.id_tema || '',
            'Segundos': alt.segundos || '',
            'Total General': formatCurrency(alt.total_general),
            'Total Neto': formatCurrency(alt.total_neto),
            'Descuento %': alt.descuento_pl ? `${alt.descuento_pl}%` : '',
            'ID Programa': alt.Programas?.id || alt.id_programa || '',
            'Programa Descripción': alt.Programas?.descripcion || '',
            'Días Calendario': diasCalendario,
            'Recargo %': alt.recargo_plan ? `${alt.recargo_plan}%` : '',
            'Valor Unitario': formatCurrency(alt.valor_unitario),
            'ID Medio': alt.medio || '',
            'Total Bruto': formatCurrency(alt.total_bruto),
            'Orden Creada': alt.ordencreada !== null ? (alt.ordencreada ? 'Sí' : 'No') : '',
            'Copia': alt.copia || '',
            'Estado Orden': alt.estado_orden !== null ? (alt.estado_orden ? 'Activa' : 'Inactiva') : '',
            'Horario Inicio': alt.horario_inicio || '',
            'Horario Fin': alt.horario_fin || '',
            'Fecha Creación': alt.created_at ? formatDate(alt.created_at) : ''
          };
        });
      }
      
      return dataToExportOrden;
    } catch (error) {
      return [];
    }
  };

  // Función para preparar los datos de todas las alternativas
  const prepararDatosTodasLasAlternativas = async () => {
    try {
      // Array para almacenar todas las filas de datos a exportar
      let todasLasFilas = [];
      
      // Para cada orden en ordenes (limitar a 3 órdenes para la vista previa)
      const ordenesLimitadas = ordenes.slice(0, 3);
      
      for (const orden of ordenesLimitadas) {
        // Obtener las alternativas de esta orden
        const numeroOrden = orden.numero_correlativo;
        let alternativas = [];
        
        // Buscar por IDs de alternativas si están disponibles
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            const { data, error } = await supabase
              .from('alternativa')
              .select(`
                *,
                Programas:id_programa (id, descripcion, codigo_programa),
                Clasificacion (id, NombreClasificacion),
                Temas (id_tema, NombreTema),
                Soportes (id_soporte, nombreIdentficiador),
                Anios (id, years),
                Meses (Id, Nombre),
                Medios (id, "NombredelMedio")
              `)
              .in('id', ids);
            
            if (error) {
              // Error al buscar alternativas para orden
            } else if (data && data.length > 0) {
              alternativas = data;
            }
          }
        }
        
        // Si no se encontraron alternativas por IDs, intentar por número de orden
        if (alternativas.length === 0 && numeroOrden) {
          const { data, error } = await supabase
            .from('alternativa')
            .select(`
              *,
              Programas:id_programa (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion),
              Temas (id_tema, NombreTema),
              Soportes (id_soporte, nombreIdentficiador),
              Anios (id, years),
              Meses (Id, Nombre),
              Medios (id, "NombredelMedio")
            `)
            .eq('numerorden', numeroOrden);
          
          if (error) {
            // Error al buscar alternativas por numerorden
          } else if (data && data.length > 0) {
            alternativas = data;
          }
        }
        
        // Datos base de la orden actual
        const datosBase = {
          'Razón Social Cliente': orden.Campania?.Clientes?.razonSocial || '',
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
          'Inversion neta': orden.Campania?.Presupuesto ? formatCurrency(orden.Campania.Presupuesto) : '',
          'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
          'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
          'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
          'Estado': mostrarEstado(orden.estado)
        };
        
        // Si no hay alternativas, agregar una fila con los datos de la orden
        if (alternativas.length === 0) {
          todasLasFilas.push({
            ...datosBase,
            'ID Alternativa': '',
            'Línea': '',
            'Número Orden': '',
            'Número Contrato': '',
            'Descripción': '',
            'Tipo Item': '',
            'Detalle': '',
            'Segundos': '',
            'Total General': '',
            'Total Neto': '',
            'Descuento %': '',
            'ID Programa': '',
            'Programa Descripción': '',
            'Días Calendario': '',
            'Recargo %': '',
            'Valor Unitario': '',
            'ID Medio': '',
            'Total Bruto': '',
            'Orden Creada': '',
            'Copia': '',
            'Estado Orden': '',
            'Horario Inicio': '',
            'Horario Fin': '',
            'Fecha Creación': ''
          });
        } else {
          // Limitar a 3 alternativas por orden para la vista previa
          const alternativasLimitadas = alternativas.slice(0, 3);
          
          // Para cada alternativa, crear una fila con los datos de la orden + alternativa
          alternativasLimitadas.forEach(alt => {
            // Procesar calendario si existe
            let diasCalendario = '';
            if (alt.calendar) {
              try {
                let calendarData = alt.calendar;
                if (typeof calendarData === 'string') {
                  calendarData = JSON.parse(calendarData);
                }
                
                // Obtener año y mes de la alternativa o de la orden
                const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                
                if (Array.isArray(calendarData)) {
                  diasCalendario = calendarData.map(item => {
                    const nombreDia = obtenerNombreDiaSemana(anio, mes, item.dia);
                    return `${nombreDia} :${item.cantidad}`;
                  }).join(', ');
                } else if (calendarData && Array.isArray(calendarData.days)) {
                  diasCalendario = calendarData.days.map(dia => {
                    const nombreDia = obtenerNombreDiaSemana(anio, mes, dia);
                    return `${nombreDia}`;
                  }).join(', ');
                }
              } catch (e) {
                // Error al procesar calendar para alternativa
              }
            }
            
            // Agregar una fila con datos combinados
            todasLasFilas.push({
              ...datosBase,
              'ID Alternativa': alt.id || '',
              'Línea': alt.nlinea || '',
              'Número Orden': alt.numerorden || '',
              'Número Contrato': alt.num_contrato || '',
              'Descripción': alt.descripcion || '',
              'Tipo Item': alt.tipo_item || '',
              'Detalle': alt.detalle || '',
              'Segundos': alt.segundos || '',
              'Total General': formatCurrency(alt.total_general),
              'Total Neto': formatCurrency(alt.total_neto),
              'Descuento %': alt.descuento_pl ? `${alt.descuento_pl}%` : '',
              'ID Programa': alt.Programas?.id || alt.id_programa || '',
              'Programa Descripción': alt.Programas?.descripcion || '',
              'Días Calendario': diasCalendario,
              'Recargo %': alt.recargo_plan ? `${alt.recargo_plan}%` : '',
              'Valor Unitario': formatCurrency(alt.valor_unitario),
              'ID Medio': alt.medio || '',
              'Total Bruto': formatCurrency(alt.total_bruto),
              'Orden Creada': alt.ordencreada !== null ? (alt.ordencreada ? 'Sí' : 'No') : '',
              'Copia': alt.copia || '',
              'Estado Orden': alt.estado_orden !== null ? (alt.estado_orden ? 'Activa' : 'Inactiva') : '',
              'Horario Inicio': alt.horario_inicio || '',
              'Horario Fin': alt.horario_fin || '',
              'Fecha Creación': alt.created_at ? formatDate(alt.created_at) : ''
            });
          });
        }
      }
      
      return todasLasFilas;
    } catch (error) {
      return [];
    }
  };

  // Función para mostrar la vista previa de la orden específica
  const mostrarVistaPrevia = async (orden) => {
    try {
      setLoadingExport(true);
      const datos = await prepararDatosOrdenEspecifica(orden);
      setPreviewData(datos);
      setPreviewTitle(`Vista previa: Orden ${orden.numero_correlativo || 'sin número'}`);
      setOpenPreview(true);
    } catch (error) {
      // Error al mostrar vista previa
    } finally {
      setLoadingExport(false);
    }
  };
  
  // Función para mostrar la vista previa de todas las alternativas
  const mostrarVistaPreviaTodasAlternativas = async () => {
    try {
      setLoadingExport(true);
      const datos = await prepararDatosTodasLasAlternativas();
      setPreviewData(datos);
      setPreviewTitle('Vista previa: Todas las alternativas');
      setOpenPreview(true);
    } catch (error) {
      // Error al mostrar vista previa
    } finally {
      setLoadingExport(false);
    }
  };

  // Cerrar modal de vista previa
  const cerrarVistaPrevia = () => {
    setOpenPreview(false);
  };

  // Modificar la función exportarOrdenEspecifica para usar la función preparar datos
  const exportarOrdenEspecifica = async (orden) => {
    try {
      setLoadingExport(true);
      
      const dataToExportOrden = await prepararDatosOrdenEspecifica(orden);
      
      // Crear y descargar el archivo Excel
      const wsOrden = XLSX.utils.json_to_sheet(dataToExportOrden);
      const wbOrden = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbOrden, wsOrden, 'Orden');
      
      // Agregar el ID de alternativa al nombre del archivo si está presente
      const alternativaId = orden.alternativaActual ? `-alt-${orden.alternativaActual}` : '';
      XLSX.writeFile(wbOrden, `orden_${orden.numero_correlativo || 'sin-numero'}${alternativaId}.xlsx`);
      
    } catch (error) {
      // Error al exportar orden específica
    } finally {
      setLoadingExport(false);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  // Función para formatear horas
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Si es un objeto Date
      if (timeString instanceof Date) {
        return format(timeString, 'HH:mm:ss');
      }
      // Si es un string en formato HH:MM:SS
      return timeString;
    } catch (e) {
      return timeString;
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP', 
      minimumFractionDigits: 0 
    }).format(value);
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
    'Inversion neta': orden.Campania?.Presupuesto ? formatCurrency(orden.Campania.Presupuesto) : '',
    'N° Fact.Prov.': '',
    'Fecha Fact.Prov.': '',
    'N° Fact.Age.': '',
    'Fecha Fact.Age.': '',
    'Monto Neto Fact.': '',
    'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
    'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
    'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
    'Estado': mostrarEstado(orden.estado),
    'N° Alternativas': orden.alternativas_plan_orden ? orden.alternativas_plan_orden.length : 0
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

  // Modificación: Expandir órdenes basado en alternativas_plan_orden
  const expandirOrdenes = (ordenes) => {
    let ordenesExpandidas = [];
    
    ordenes.forEach(orden => {
      // Extraer IDs de alternativas
      const idsAlternativas = extraerIdsAlternativas(orden.alternativas_plan_orden);
      
      // Si no hay alternativas o es un array vacío, mostrar la orden una vez
      if (!idsAlternativas || idsAlternativas.length === 0) {
        ordenesExpandidas.push({...orden, alternativaActual: null});
        return;
      }
      
      // Si hay alternativas, duplicar la orden para cada alternativa
      idsAlternativas.forEach(idAlternativa => {
        ordenesExpandidas.push({
          ...orden,
          alternativaActual: idAlternativa
        });
      });
    });
    
    return ordenesExpandidas;
  };

  // Aplicar la expansión a todas las órdenes
  const ordenesExpandidas = expandirOrdenes(ordenes);
  
  // Paginar las órdenes expandidas
  const paginatedOrdenes = ordenesExpandidas.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Función para buscar alternativa por ID específico
  const fetchAlternativaPorId = async (id) => {
    try {
      const { data, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Programas:id_programa (id, descripcion),
          Clasificacion (id, NombreClasificacion),
          Temas (id_tema, NombreTema),
          Soportes (id_soporte, nombreIdentficiador),
          Anios (id, years),
          Meses (Id, Nombre),
          Medios (id, "NombredelMedio")
        `)
        .eq('id', id)
        .limit(1)
        .single();

      if (error) {
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  };

  // Añadir una nueva función para exportar todas las alternativas
  const exportarTodasLasAlternativas = async () => {
    try {
      setLoadingExport(true);
      
      // Array para almacenar todas las filas de datos a exportar
      let todasLasFilas = [];
      
      // Para cada orden en ordenes
      for (const orden of ordenes) {
        // Obtener las alternativas de esta orden
        const numeroOrden = orden.numero_correlativo;
        let alternativas = [];
        
        // Buscar por IDs de alternativas si están disponibles
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            const { data, error } = await supabase
              .from('alternativa')
              .select(`
                *,
                Programas:id_programa (id, descripcion, codigo_programa),
                Clasificacion (id, NombreClasificacion),
                Temas (id_tema, NombreTema),
                Soportes (id_soporte, nombreIdentficiador),
                Anios (id, years),
                Meses (Id, Nombre),
                Medios (id, "NombredelMedio")
              `)
              .in('id', ids);
            
            if (error) {
              // Error al buscar alternativas para orden
            } else if (data && data.length > 0) {
              alternativas = data;
            }
          }
        }
        
        // Si no se encontraron alternativas por IDs, intentar por número de orden
        if (alternativas.length === 0 && numeroOrden) {
          const { data, error } = await supabase
            .from('alternativa')
            .select(`
              *,
              Programas:id_programa (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion),
              Temas (id_tema, NombreTema),
              Soportes (id_soporte, nombreIdentficiador),
              Anios (id, years),
              Meses (Id, Nombre),
              Medios (id, "NombredelMedio")
            `)
            .eq('numerorden', numeroOrden);
          
          if (error) {
            // Error al buscar alternativas por numerorden
          } else if (data && data.length > 0) {
            alternativas = data;
          }
        }
        
        // Datos base de la orden actual
        const datosBase = {
          'Razón Social Cliente': orden.Campania?.Clientes?.razonSocial || '',
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
          'Inversion neta': orden.Campania?.Presupuesto ? formatCurrency(orden.Campania.Presupuesto) : '',
          'Tipo Ctto.': orden.Contratos?.NombreContrato || '',
          'Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.nombre || orden.usuario_registro?.nombre || '',
          'Grupo': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || orden.usuario_registro?.grupo || '',
          'Estado': mostrarEstado(orden.estado)
        };
        
        // Si no hay alternativas, agregar una fila con los datos de la orden
        if (alternativas.length === 0) {
          todasLasFilas.push({
            ...datosBase,
            'ID Alternativa': '',
            'Línea': '',
            'Número Orden': '',
            'Número Contrato': '',
            'Descripción': '',
            'Tipo Item': '',
            'Detalle': '',
            'Segundos': '',
            'Total General': '',
            'Total Neto': '',
            'Descuento %': '',
            'ID Programa': '',
            'Programa Descripción': '',
            'Días Calendario': '',
            'Recargo %': '',
            'Valor Unitario': '',
            'ID Medio': '',
            'Total Bruto': '',
            'Orden Creada': '',
            'Copia': '',
            'Estado Orden': '',
            'Horario Inicio': '',
            'Horario Fin': '',
            'Fecha Creación': ''
          });
        } else {
          // Para cada alternativa, crear una fila con los datos de la orden + alternativa
          alternativas.forEach(alt => {
            // Procesar calendario si existe
            let diasCalendario = '';
            if (alt.calendar) {
              try {
                let calendarData = alt.calendar;
                if (typeof calendarData === 'string') {
                  calendarData = JSON.parse(calendarData);
                }
                
                // Obtener año y mes de la alternativa o de la orden
                const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                
                if (Array.isArray(calendarData)) {
                  diasCalendario = calendarData.map(item => {
                    const nombreDia = obtenerNombreDiaSemana(anio, mes, item.dia);
                    return `${nombreDia} :${item.cantidad}`;
                  }).join(', ');
                } else if (calendarData && Array.isArray(calendarData.days)) {
                  diasCalendario = calendarData.days.map(dia => {
                    const nombreDia = obtenerNombreDiaSemana(anio, mes, dia);
                    return `${nombreDia}`;
                  }).join(', ');
                }
              } catch (e) {
                // Error al procesar calendar para alternativa
              }
            }
            
            // Agregar una fila con datos combinados
            todasLasFilas.push({
              ...datosBase,
              'ID Alternativa': alt.id || '',
              'Línea': alt.nlinea || '',
              'Número Orden': alt.numerorden || '',
              'Número Contrato': alt.num_contrato || '',
              'Descripción': alt.descripcion || '',
              'Tipo Item': alt.tipo_item || '',
              'Detalle': alt.detalle || '',
              'Segundos': alt.segundos || '',
              'Total General': formatCurrency(alt.total_general),
              'Total Neto': formatCurrency(alt.total_neto),
              'Descuento %': alt.descuento_pl ? `${alt.descuento_pl}%` : '',
              'ID Programa': alt.Programas?.id || alt.id_programa || '',
              'Programa Descripción': alt.Programas?.descripcion || '',
              'Días Calendario': diasCalendario,
              'Recargo %': alt.recargo_plan ? `${alt.recargo_plan}%` : '',
              'Valor Unitario': formatCurrency(alt.valor_unitario),
              'ID Medio': alt.medio || '',
              'Total Bruto': formatCurrency(alt.total_bruto),
              'Orden Creada': alt.ordencreada !== null ? (alt.ordencreada ? 'Sí' : 'No') : '',
              'Copia': alt.copia || '',
              'Estado Orden': alt.estado_orden !== null ? (alt.estado_orden ? 'Activa' : 'Inactiva') : '',
              'Horario Inicio': alt.horario_inicio || '',
              'Horario Fin': alt.horario_fin || '',
              'Fecha Creación': alt.created_at ? formatDate(alt.created_at) : ''
            });
          });
        }
      }
      
      // Crear y descargar el archivo Excel
      const ws = XLSX.utils.json_to_sheet(todasLasFilas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Completo');
      
      // Generar nombre con fecha actual
      const fechaActual = format(new Date(), 'dd-MM-yyyy');
      XLSX.writeFile(wb, `reporte_alternativas_${fechaActual}.xlsx`);
      
    } catch (error) {
      // Error al exportar todas las alternativas
    } finally {
      setLoadingExport(false);
    }
  };

  // Agregar función para generar el informe de inversión detallado por cliente
  const generarInformeInversionDetallado = async () => {
    try {
      setLoadingExport(true);
      
      // Verificar que haya un cliente seleccionado
      if (!filtros.cliente) {
        Swal.fire({
          icon: 'warning',
          title: 'Cliente requerido',
          text: 'Por favor seleccione un cliente para generar el informe',
          confirmButtonColor: '#1976d2',
        });
        setLoadingExport(false);
        return;
      }

      // Obtener todas las órdenes con los filtros aplicados
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
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto, Presupuesto,
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

      if (filtros.campania) {
        query = query.eq('Campania.id_campania', filtros.campania);
      }

      if (filtros.fechaInicio) {
        const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
        query = query.gte('fechaCreacion', fechaInicioFormateada);
      }

      if (filtros.fechaFin) {
        const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
        query = query.lte('fechaCreacion', fechaFinFormateada);
      }

      const { data: ordenes, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      
      if (ordenes.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin resultados',
          text: 'No se encontraron órdenes con los filtros seleccionados',
          confirmButtonColor: '#1976d2',
        });
        setLoadingExport(false);
        return;
      }
      
      // Obtener el nombre del cliente
      const nombreCliente = ordenes[0]?.Campania?.Clientes?.nombreCliente || 'No especificado';
      
      // Array para almacenar todas las filas del informe
      let filasInforme = [];
      
      // Para cada orden, obtener sus alternativas
      for (const orden of ordenes || []) {
        const numeroOrden = orden.numero_correlativo;
        let alternativas = [];
        
        // Obtener las alternativas por IDs si están disponibles
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            const { data, error } = await supabase
              .from('alternativa')
              .select(`
                *,
                Programas:id_programa (id, descripcion, codigo_programa),
                Clasificacion (id, NombreClasificacion),
                Temas (id_tema, NombreTema),
                Soportes (id_soporte, nombreIdentficiador),
                Anios (id, years),
                Meses (Id, Nombre),
                Medios (id, "NombredelMedio")
              `)
              .in('id', ids);
            
            if (!error && data && data.length > 0) {
              alternativas = data;
            }
          }
        }
        
        // Si no hay alternativas por IDs, buscar por número de orden
        if (alternativas.length === 0 && numeroOrden) {
          const { data, error } = await supabase
            .from('alternativa')
            .select(`
              *,
              Programas:id_programa (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion),
              Temas (id_tema, NombreTema),
              Soportes (id_soporte, nombreIdentficiador),
              Anios (id, years),
              Meses (Id, Nombre),
              Medios (id, "NombredelMedio")
            `)
            .eq('numerorden', numeroOrden);
          
          if (!error && data && data.length > 0) {
            alternativas = data;
          }
        }
        
        // Para cada alternativa, procesar su calendario y crear filas
        for (const alt of alternativas) {
          // Procesar calendario si existe
          let filasGeneradas = false;
          if (alt.calendar) {
            try {
              let calendarData = alt.calendar;
              if (typeof calendarData === 'string') {
                calendarData = JSON.parse(calendarData);
              }
              
              // Extraer las fechas del calendario
              if (Array.isArray(calendarData)) {
                // Nuevo formato de array con {dia, cantidad}
                calendarData.forEach(item => {
                  const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                  const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                  if (anio && mes && item.dia) {
                    const fecha = new Date(anio, mes - 1, item.dia);
                    const fechaFormateada = format(fecha, 'dd/MM/yyyy');
                    for (let i = 0; i < (item.cantidad || 1); i++) {
                      filasInforme.push({
                        ...{
                          'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                          'Mes': orden.plan?.Meses?.Nombre || orden.plan?.Meses?.Id || '',
                          'N° de Ctto.': orden.Contratos?.num_contrato || '',
                          'N° de Orden': orden.numero_correlativo || '',
                          'Version': orden.copia || '1',
                          'Medio': alt.Medios?.NombredelMedio || '',
                          'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                          'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
                          'Campana': orden.Campania?.NombreCampania || '',
                          'Plan de Medios': orden.plan?.nombre_plan || '',
                          'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                          'Tema': alt.Temas?.NombreTema || '',
                          'Seg': alt.segundos || '',
                          'Prog./Elem./Formato': alt.Programas ? `${alt.Programas.descripcion}` : '',
                          'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
                          'Agen.Creativa': '',
                          'Cod. Univ. Aviso': alt.id || '',
                          'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
                          'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                          'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
                          'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
                          'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
                        },
                        'Día': fechaFormateada
                      });
                      filasGeneradas = true;
                    }
                  }
                });
              } else if (calendarData && Array.isArray(calendarData.days)) {
                // Formato anterior con array de días
                calendarData.days.forEach(dia => {
                  const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                  const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                  if (anio && mes && dia) {
                    const fecha = new Date(anio, mes - 1, dia);
                    const fechaFormateada = format(fecha, 'dd/MM/yyyy');
                    filasInforme.push({
                      ...{
                        'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                        'Mes': orden.plan?.Meses?.Nombre || orden.plan?.Meses?.Id || '',
                        'N° de Ctto.': orden.Contratos?.num_contrato || '',
                        'N° de Orden': orden.numero_correlativo || '',
                        'Version': orden.copia || '1',
                        'Medio': alt.Medios?.NombredelMedio || '',
                        'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                        'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
                        'Campana': orden.Campania?.NombreCampania || '',
                        'Plan de Medios': orden.plan?.nombre_plan || '',
                        'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                        'Tema': alt.Temas?.NombreTema || '',
                        'Seg': alt.segundos || '',
                        'Prog./Elem./Formato': alt.Programas ? `${alt.Programas.descripcion}` : '',
                        'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
                        'Agen.Creativa': '',
                        'Cod. Univ. Aviso': alt.id || '',
                        'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
                        'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                        'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
                        'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
                        'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
                      },
                      'Día': fechaFormateada
                    });
                    filasGeneradas = true;
                  }
                });
              }
            } catch (e) {
              // Si hay error, no se generan filas por día
            }
          }
          if (!filasGeneradas) {
            // Si no hay días, agregar una fila sin día
            filasInforme.push({
              ...{
                'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                'Mes': orden.plan?.Meses?.Nombre || orden.plan?.Meses?.Id || '',
                'N° de Ctto.': orden.Contratos?.num_contrato || '',
                'N° de Orden': orden.numero_correlativo || '',
                'Version': orden.copia || '1',
                'Medio': alt.Medios?.NombredelMedio || '',
                'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
                'Campana': orden.Campania?.NombreCampania || '',
                'Plan de Medios': orden.plan?.nombre_plan || '',
                'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                'Tema': alt.Temas?.NombreTema || '',
                'Seg': alt.segundos || '',
                'Prog./Elem./Formato': alt.Programas ? `${alt.Programas.descripcion}` : '',
                'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
                'Agen.Creativa': '',
                'Cod. Univ. Aviso': alt.id || '',
                'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
                'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
                'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
                'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
              },
              'Día': ''
            });
          }
        }
      }
      
      if (filasInforme.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin datos',
          text: 'No se encontraron datos para el informe con los filtros seleccionados',
          confirmButtonColor: '#1976d2',
        });
        setLoadingExport(false);
        return;
      }
      
      // Determinar el año para el título (usar el de la primera orden o el actual)
      const anio = ordenes.length > 0 && ordenes[0].plan?.Anios?.years 
        ? ordenes[0].plan.Anios.years 
        : new Date().getFullYear();
      
      // Si no se selecciona campaña específica, agrupar por campaña y crear una hoja por cada campaña
      if (!filtros.campania) {
        // Agrupar filas por campaña
        const filasPorCampana = filasInforme.reduce((acc, fila) => {
          const campana = fila['Campana'] || 'Sin Campaña';
          if (!acc[campana]) acc[campana] = [];
          acc[campana].push(fila);
          return acc;
        }, {});

        const wb = XLSX.utils.book_new();
        const headers = [
          'CLIENTE', 'Mes', 'N° de Ctto.', 'N° de Orden', 'Version', 'Medio', 'Proveedor',
          'Soporte', 'Campana', 'Plan de Medios', 'Producto', 'Tema', 'Seg', 'Prog./Elem./Formato',
          'Día', 'Inversion Neta', 'Agen.Creativa', 'Cod. Univ. Aviso', 'Cod. Univ. Prog.',
          'Calidad', 'Cod.Usu.', 'Nombre Usuario', 'Grupo Usuario'
        ];
        Object.entries(filasPorCampana).forEach(([campana, filas]) => {
          // Crear hoja para la campaña
          const ws = XLSX.utils.aoa_to_sheet([]);
          const titulo = `INFORME DE INVERSIÓN ${campana} ${anio}`;
          XLSX.utils.sheet_add_aoa(ws, [[titulo]], { origin: 'A1' });
          XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A2' });
          for (let i = 0; i < filas.length; i++) {
            const fila = filas[i];
            const valores = headers.map(header => fila[header] || '');
            XLSX.utils.sheet_add_aoa(ws, [valores], { origin: `A${i + 3}` });
          }
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 22 } });
          if (!ws['!cols']) ws['!cols'] = [];
          ws['!cols'][0] = { wch: 25 };
          ws['!cols'][1] = { wch: 5 };
          ws['!cols'][2] = { wch: 15 };
          ws['!cols'][3] = { wch: 12 };
          ws['!cols'][4] = { wch: 10 };
          ws['!cols'][5] = { wch: 15 };
          ws['!cols'][6] = { wch: 20 };
          ws['!cols'][7] = { wch: 20 };
          ws['!cols'][8] = { wch: 20 };
          ws['!cols'][9] = { wch: 20 };
          ws['!cols'][10] = { wch: 20 };
          ws['!cols'][11] = { wch: 20 };
          ws['!cols'][12] = { wch: 5 };
          ws['!cols'][13] = { wch: 25 };
          ws['!cols'][14] = { wch: 15 };
          ws['!cols'][15] = { wch: 15 };
          ws['!cols'][16] = { wch: 15 };
          ws['!cols'][17] = { wch: 15 };
          ws['!cols'][18] = { wch: 15 };
          ws['!cols'][19] = { wch: 15 };
          ws['!cols'][20] = { wch: 10 };
          ws['!cols'][21] = { wch: 20 };
          ws['!cols'][22] = { wch: 20 };
          XLSX.utils.book_append_sheet(wb, ws, campana.substring(0, 31));
        });
        // Generar nombre con fecha actual
        const fechaActual = format(new Date(), 'dd-MM-yyyy');
        XLSX.writeFile(wb, `informe_inversion_${nombreCliente.replace(/\s+/g, '_').toLowerCase()}_${fechaActual}.xlsx`);
        Swal.fire({
          icon: 'success',
          title: '¡Informe generado!',
          text: 'El archivo Excel se ha descargado correctamente.',
          showConfirmButton: false,
          timer: 1800
        });
        setLoadingExport(false);
        return;
      }
      
      // Crear y descargar el archivo Excel
      const wb = XLSX.utils.book_new();
      
      // Definir las cabeceras
      const headers = [
        'CLIENTE', 'Mes', 'N° de Ctto.', 'N° de Orden', 'Version', 'Medio', 'Proveedor',
        'Soporte', 'Campana', 'Plan de Medios', 'Producto', 'Tema', 'Seg', 'Prog./Elem./Formato',
        'Día', // Nueva columna Día
        'Inversion Neta', 'Agen.Creativa', 'Cod. Univ. Aviso', 'Cod. Univ. Prog.',
        'Calidad', 'Cod.Usu.', 'Nombre Usuario', 'Grupo Usuario'
      ];
      
      // Crear una hoja nueva
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // Agregar título en filas 1 y 2
      // Incluir el nombre del cliente en el título
      const titulo = `INFORME DE INVERSIÓN ${nombreCliente} ${anio}`;
      XLSX.utils.sheet_add_aoa(ws, [[titulo]], { origin: 'A1' });
      
      // Agregar encabezados solo una vez en la fila 2
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A2' });
      
      // Agregar los datos a partir de la fila 3 (ya no 5)
      for (let i = 0; i < filasInforme.length; i++) {
        const fila = filasInforme[i];
        const valores = headers.map(header => fila[header] || '');
        XLSX.utils.sheet_add_aoa(ws, [valores], { origin: `A${i + 3}` });
      }
      
      // Combinar celdas para el título (ajustar para que ocupe solo la primera fila)
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 22 } }); // Solo la primera fila
      
      // Configurar el ancho de las columnas
      if (!ws['!cols']) ws['!cols'] = [];
      
      ws['!cols'][0] = { wch: 25 }; // CLIENTE
      ws['!cols'][1] = { wch: 5 }; // Mes
      ws['!cols'][2] = { wch: 15 }; // N° de Ctto.
      ws['!cols'][3] = { wch: 12 }; // N° de Orden
      ws['!cols'][4] = { wch: 10 }; // Version
      ws['!cols'][5] = { wch: 15 }; // Medio
      ws['!cols'][6] = { wch: 20 }; // Proveedor
      ws['!cols'][7] = { wch: 20 }; // Soporte
      ws['!cols'][8] = { wch: 20 }; // Campana
      ws['!cols'][9] = { wch: 20 }; // Plan de Medios
      ws['!cols'][10] = { wch: 20 }; // Producto
      ws['!cols'][11] = { wch: 20 }; // Tema
      ws['!cols'][12] = { wch: 5 }; // Seg
      ws['!cols'][13] = { wch: 25 }; // Prog./Elem./Formato
      ws['!cols'][14] = { wch: 15 }; // Día
      ws['!cols'][15] = { wch: 15 }; // Inversion Neta
      ws['!cols'][16] = { wch: 15 }; // Agen.Creativa
      ws['!cols'][17] = { wch: 15 }; // Cod. Univ. Aviso
      ws['!cols'][18] = { wch: 15 }; // Cod. Univ. Prog.
      ws['!cols'][19] = { wch: 15 }; // Calidad
      ws['!cols'][20] = { wch: 10 }; // Cod.Usu.
      ws['!cols'][21] = { wch: 20 }; // Nombre Usuario
      ws['!cols'][22] = { wch: 20 }; // Grupo Usuario
      
      XLSX.utils.book_append_sheet(wb, ws, 'Informe Inversión');
      
      // Generar nombre con fecha actual
      const fechaActual = format(new Date(), 'dd-MM-yyyy');
      XLSX.writeFile(wb, `informe_inversion_${nombreCliente.replace(/\s+/g, '_').toLowerCase()}_${fechaActual}.xlsx`);
      
      // Mostrar SweetAlert de éxito
      Swal.fire({
        icon: 'success',
        title: '¡Informe generado!',
        text: 'El archivo Excel se ha descargado correctamente.',
        showConfirmButton: false,
        timer: 1800
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al generar el informe: ' + (error.message || 'Error desconocido'),
        confirmButtonColor: '#1976d2'
      });
      console.error('Error al generar informe de inversión detallado:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  // Modificar la función para mostrar la vista previa del informe de inversión
  const mostrarVistaPreviaInformeInversion = async () => {
    try {
      setLoadingExport(true);
      
      // Similar a generarInformeInversionDetallado pero limitado a las primeras órdenes
      // Array para almacenar todas las filas del informe
      let filasInforme = [];
      
      // Obtener las primeras 3 órdenes
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
          Campania!inner (id_campania, NombreCampania, id_Cliente, id_Producto, Presupuesto,
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

      if (filtros.campania) {
        query = query.eq('Campania.id_campania', filtros.campania);
      }

      if (filtros.fechaInicio) {
        const fechaInicioFormateada = format(new Date(filtros.fechaInicio), 'yyyy-MM-dd');
        query = query.gte('fechaCreacion', fechaInicioFormateada);
      }

      if (filtros.fechaFin) {
        const fechaFinFormateada = format(new Date(filtros.fechaFin), 'yyyy-MM-dd');
        query = query.lte('fechaCreacion', fechaFinFormateada);
      }

      // Limitar a 3 órdenes para la vista previa
      query = query.limit(3);

      const { data: ordenes, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      
      // Para cada orden, obtener sus alternativas (limitar a 3 por orden)
      for (const orden of ordenes || []) {
        const numeroOrden = orden.numero_correlativo;
        let alternativas = [];
        
        // Obtener las alternativas por IDs si están disponibles
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden).slice(0, 3);
          
          if (ids.length > 0) {
            const { data, error } = await supabase
              .from('alternativa')
              .select(`
                *,
                Programas:id_programa (id, descripcion, codigo_programa),
                Clasificacion (id, NombreClasificacion),
                Temas (id_tema, NombreTema),
                Soportes (id_soporte, nombreIdentficiador),
                Anios (id, years),
                Meses (Id, Nombre),
                Medios (id, "NombredelMedio")
              `)
              .in('id', ids);
            
            if (!error && data && data.length > 0) {
              alternativas = data;
            }
          }
        }
        
        // Si no hay alternativas por IDs, buscar por número de orden (limitar a 3)
        if (alternativas.length === 0 && numeroOrden) {
          const { data, error } = await supabase
            .from('alternativa')
            .select(`
              *,
              Programas:id_programa (id, descripcion, codigo_programa),
              Clasificacion (id, NombreClasificacion),
              Temas (id_tema, NombreTema),
              Soportes (id_soporte, nombreIdentficiador),
              Anios (id, years),
              Meses (Id, Nombre),
              Medios (id, "NombredelMedio")
            `)
            .eq('numerorden', numeroOrden)
            .limit(3);
          
          if (!error && data && data.length > 0) {
            alternativas = data;
          }
        }
        
        // Para cada alternativa, procesar su calendario y crear filas (limitar a 5 fechas)
        for (const alt of alternativas) {
          // Procesar calendario si existe
          if (alt.calendar) {
            try {
              let calendarData = alt.calendar;
              if (typeof calendarData === 'string') {
                calendarData = JSON.parse(calendarData);
              }
              
              let fechasExhibicion = [];
              
              // Extraer las fechas del calendario
              if (Array.isArray(calendarData)) {
                // Limitar a los primeros 5 días para la vista previa
                const diasLimitados = calendarData.slice(0, 5);
                
                // Nuevo formato de array con {dia, cantidad}
                diasLimitados.forEach(item => {
                  const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                  const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                  
                  if (anio && mes && item.dia) {
                    const fecha = new Date(anio, mes - 1, item.dia);
                    const fechaFormateada = format(fecha, 'd/M/yyyy');
                    
                    // Limitar a máximo 2 repeticiones por día para la vista previa
                    const repeticiones = Math.min(item.cantidad, 2);
                    for (let i = 0; i < repeticiones; i++) {
                      fechasExhibicion.push(fechaFormateada);
                    }
                  }
                });
              } else if (calendarData && Array.isArray(calendarData.days)) {
                // Limitar a los primeros 5 días para la vista previa
                const diasLimitados = calendarData.days.slice(0, 5);
                
                // Formato anterior con array de días
                diasLimitados.forEach(dia => {
                  const anio = alt.Anios?.years || orden.plan?.Anios?.years;
                  const mes = alt.Meses?.Id || orden.plan?.Meses?.Id;
                  
                  if (anio && mes && dia) {
                    const fecha = new Date(anio, mes - 1, dia);
                    const fechaFormateada = format(fecha, 'd/M/yyyy');
                    fechasExhibicion.push(fechaFormateada);
                  }
                });
              }
              
              // Si no hay fechas, agregar al menos una fila
              if (fechasExhibicion.length === 0) {
                fechasExhibicion.push('');
              }
              
              // Crear una fila por cada fecha de exhibición
              fechasExhibicion.forEach(fechaExhibicion => {
                filasInforme.push({
                  'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                  'Mes': orden.plan?.Meses?.Id || '',
                  'N° de Ctto.': orden.Contratos?.num_contrato || '',
                  'N° de Orden': orden.numero_correlativo || '',
                  'Version': orden.copia || '1',
                  'Medio': alt.Medios?.NombredelMedio || '',
                  'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                  'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
                  'Campana': orden.Campania?.NombreCampania || '',
                  'Plan de Medios': orden.plan?.nombre_plan || '',
                  'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                  'Tema': alt.Temas?.NombreTema || '',
                  'Seg': alt.segundos || '',
                  'Prog./Elem./Formato': alt.Programas?.descripcion || '',
                  'Fecha Exhib./Pub.': fechaExhibicion,
                  'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
                  'Agen.Creativa': '',
                  'Cod. Univ. Aviso': alt.id || '',
                  'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
                  'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                  'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
                  'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
                  'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
                });
              });
              
            } catch (e) {
              // Error al procesar calendario para alternativa
              // Agregar una fila sin fecha de exhibición
              filasInforme.push({
                'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
                'Mes': orden.plan?.Meses?.Id || '',
                'N° de Ctto.': orden.Contratos?.num_contrato || '',
                'N° de Orden': orden.numero_correlativo || '',
                'Version': orden.copia || '1',
                'Medio': alt.Medios?.NombredelMedio || '',
                'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
                'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
                'Campana': orden.Campania?.NombreCampania || '',
                'Plan de Medios': orden.plan?.nombre_plan || '',
                'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
                'Tema': alt.Temas?.NombreTema || '',
                'Seg': alt.segundos || '',
                'Prog./Elem./Formato': alt.Programas?.descripcion || '',
                'Fecha Exhib./Pub.': '',
                'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
                'Agen.Creativa': '',
                'Cod. Univ. Aviso': alt.id || '',
                'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
                'Calidad': alt.Clasificacion?.NombreClasificacion || '',
                'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
                'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
                'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
              });
            }
          } else {
            // Si no hay calendario, agregar una fila sin fecha de exhibición
            filasInforme.push({
              'CLIENTE': orden.Campania?.Clientes?.nombreCliente || '',
              'Mes': orden.plan?.Meses?.Id || '',
              'N° de Ctto.': orden.Contratos?.num_contrato || '',
              'N° de Orden': orden.numero_correlativo || '',
              'Version': orden.copia || '1',
              'Medio': alt.Medios?.NombredelMedio || '',
              'Proveedor': orden.Contratos?.Proveedores?.nombreProveedor || '',
              'Soporte': alt.Soportes?.nombreIdentficiador || orden.Soportes?.nombreIdentficiador || '',
              'Campana': orden.Campania?.NombreCampania || '',
              'Plan de Medios': orden.plan?.nombre_plan || '',
              'Producto': orden.Campania?.Productos?.NombreDelProducto || '',
              'Tema': alt.Temas?.NombreTema || '',
              'Seg': alt.segundos || '',
              'Prog./Elem./Formato': alt.Programas?.descripcion || '',
              'Fecha Exhib./Pub.': '',
              'Inversion Neta': formatCurrency(alt.valor_unitario || 0),
              'Agen.Creativa': '',
              'Cod. Univ. Aviso': alt.id || '',
              'Cod. Univ. Prog.': alt.Programas?.codigo_programa || '',
              'Calidad': alt.Clasificacion?.NombreClasificacion || '',
              'Cod.Usu.': orden.usuario_registro?.id || orden.OrdenesUsuarios?.[0]?.Usuarios?.id_usuario || '0',
              'Nombre Usuario': orden.usuario_registro?.nombre || orden.OrdenesUsuarios?.[0]?.Usuarios?.Nombre || '',
              'Grupo Usuario': orden.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ''
            });
          }
        }
      }
      
      // Mostrar la vista previa
      if (filasInforme.length > 0) {
        // Agregar una fila de título al principio
        const anio = ordenes.length > 0 && ordenes[0].plan?.Anios?.years 
          ? ordenes[0].plan.Anios.years 
          : new Date().getFullYear();
        
        // Obtener el nombre del cliente para la vista previa
        const nombreClientePreview = ordenes[0]?.Campania?.Clientes?.nombreCliente || 'No especificado';
          
        // Crear una fila de título
        const tituloRow = {};
        Object.keys(filasInforme[0]).forEach(key => {
          tituloRow[key] = '';
        });
        // Incluir el nombre del cliente en el título de la vista previa
        tituloRow['CLIENTE'] = `INFORME DE INVERSIÓN ${nombreClientePreview} ${anio}`;
        
        // Insertar la fila de título al principio
        filasInforme = [tituloRow, ...filasInforme];
      }
      
      setPreviewData(filasInforme);
      setPreviewTitle('Informe de Inversión');
      setOpenPreview(true);
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al generar la vista previa: ' + (error.message || 'Error desconocido'),
        confirmButtonColor: '#1976d2',
      });
      console.error('Error al generar vista previa del informe:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  // Modificar la función exportarInformeInversion para usar la nueva función
  const exportarInformeInversion = async () => {
    await generarInformeInversionDetallado();
  };

  // Agregar función para debuggear órdenes y alternativas
  const debugOrdenYAlternativas = async (ordenId, alternativaId) => {
    try {
      // Buscar la orden por ID
      if (ordenId) {
        const { data: ordenData, error: ordenError } = await supabase
          .from('OrdenesDePublicidad')
          .select(`
            *,
            Campania (
              id_campania, 
              NombreCampania,
              Clientes (id_cliente, nombreCliente, razonSocial)
            ),
            Contratos (
              id, 
              NombreContrato, 
              num_contrato,
              Proveedores (id_proveedor, nombreProveedor)
            ),
            Soportes (id_soporte, nombreIdentficiador),
            plan (
              id, 
              nombre_plan,
              Anios (id, years),
              Meses (Id, Nombre)
            )
          `)
          .eq('id_ordenes_de_comprar', ordenId)
          .single();
        
        if (ordenError) {
          // Error al buscar orden
        } else if (ordenData) {
          // Mostrar relaciones
        }
      }
      
      // Buscar la alternativa por ID
      if (alternativaId) {
        const { data: alternativaData, error: alternativaError } = await supabase
          .from('alternativa')
          .select(`
            *,
            Programas:id_programa (id, descripcion),
            Clasificacion (id, NombreClasificacion),
            Temas (id_tema, NombreTema),
            Soportes (id_soporte, nombreIdentficiador),
            Anios (id, years),
            Meses (Id, Nombre),
            Medios (id, "NombredelMedio"),
            Campania (id_campania, NombreCampania),
            Contratos:num_contrato (id, NombreContrato, num_contrato)
          `)
          .eq('id', alternativaId)
          .single();
        
        if (alternativaError) {
          // Error al buscar alternativa
        } else if (alternativaData) {
          // Mostrar relaciones
        }
      }
      
    } catch (error) {
      // Error en debug de órden y alternativas
    }
  };

  // Agregar una función para ejecutar el debug al inicio
  useEffect(() => {
    // Descomentar y colocar IDs específicos para debug
    // debugOrdenYAlternativas(33993, 158);
  }, []);

  // Componente de vista previa modal
  const PreviewModal = () => {
    return (
      <Modal 
        open={openPreview}
        onClose={cerrarVistaPrevia}
        aria-labelledby="modal-preview-title"
        aria-describedby="modal-preview-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 1200,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography id="modal-preview-title" variant="h6" component="h2">
              {previewTitle}
            </Typography>
            <IconButton onClick={cerrarVistaPrevia} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mostrando vista previa de los primeros {previewData.length} registros que se exportarán.
          </Typography>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(90vh - 160px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {previewData.length > 0 && Object.keys(previewData[0]).map((key, index) => (
                      <TableCell key={index}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button variant="outlined" onClick={cerrarVistaPrevia}>
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2', 
          mb: 1, 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px' 
        }}>
          Reporte diario inversión por cliente
        </Typography>
        <Box sx={{ 
          width: '80px', 
          height: '4px', 
          backgroundColor: '#1976d2', 
          margin: '0 auto', 
          mt: 1, 
          mb: 2,
          borderRadius: '2px'
        }} />
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1, mb: 2 }}>
          Filtros
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              labelId="cliente-label"
              id="cliente-select"
              value={filtros.cliente || ''}
              onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              displayEmpty
              placeholder="Todos los clientes"
              sx={{
                '& .MuiSelect-select': {
                  paddingY: '8px',
                }
              }}
            >
              <MenuItem value="">
                Todos los clientes
              </MenuItem>
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.nombreCliente}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              labelId="campania-label"
              id="campania-select"
              value={filtros.campania || ''}
              onChange={(e) => handleFiltroChange('campania', e.target.value)}
              displayEmpty
              placeholder="Todas las campañas"
              sx={{
                '& .MuiSelect-select': {
                  paddingY: '8px',
                }
              }}
            >
              <MenuItem value="">
                Todas las campañas
              </MenuItem>
              {campanas.map((campana) => (
                <MenuItem key={campana.id_campania} value={campana.id_campania}>
                  {campana.NombreCampania}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              value={filtros.fechaInicio}
              onChange={(newValue) => handleFiltroChange('fechaInicio', newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 140 },
                  placeholder: "Fecha Inicio",
                  InputLabelProps: { shrink: false }
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              value={filtros.fechaFin}
              onChange={(newValue) => handleFiltroChange('fechaFin', newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 140 },
                  placeholder: "Fecha Fin",
                  InputLabelProps: { shrink: false }
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            onClick={buscarOrdenes}
            disabled={loading}
            startIcon={<SearchIcon />}
            sx={{ 
              height: 40, 
              minWidth: 48,
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : ''}
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={generarInformeInversionDetallado}
            disabled={loadingExport}
            className="detalle-boton-excel"
            sx={{
              height: 40,
              minWidth: 48,
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #43a047 30%, #66bb6a 90%)',
              color: '#fff',
              boxShadow: '0 4px 6px rgba(67, 160, 71, 0.2)',
              ml: { md: 1 },
              '&:hover': {
                background: 'linear-gradient(45deg, #388e3c 30%, #43a047 90%)',
                boxShadow: '0 6px 10px rgba(67, 160, 71, 0.3)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s'
              }
            }}
          >
            {/* Solo el icono, sin texto */}
          </Button>
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', borderBottom: '1px solid #e0e0e0', pb: 1, mb: 2 }}>
          Resultados
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : ordenes.length > 0 ? (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>RAZÓN SOCIAL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>CLIENTE</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>AÑO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>MES</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>N° DE CTTO.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>N° DE ORDEN</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>VERSIÓN</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>MEDIO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>RAZÓN SOC. PROVEEDOR</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>PROVEEDOR</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>RUT PROV.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>SOPORTE</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>CAMPAÑA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>OC CLIENTE</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>PRODUCTO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>AGE. CREA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>INVERSIÓN NETA</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>N° FACT. PROV.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>FECHA FACT. PROV.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>N° FACT. AGE.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>FECHA FACT. AGE.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>MONTO NETO FACT.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>TIPO CTTO.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>USUARIO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>GRUPO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>ESTADO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>ALTERNATIVA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrdenes.map((ordenExp, index) => (
                    <TableRow key={`${ordenExp.id_ordenes_de_comprar}-${ordenExp.alternativaActual || 'default'}-${index}`}>
                      <TableCell>{ordenExp.Campania?.Clientes?.razonSocial || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Campania?.Clientes?.nombreCliente || 'NA'}</TableCell>
                      <TableCell>{ordenExp.plan?.Anios?.years || 'NA'}</TableCell>
                      <TableCell>{ordenExp.plan?.Meses?.Nombre || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.num_contrato || 'NA'}</TableCell>
                      <TableCell>{ordenExp.numero_correlativo || 'NA'}</TableCell>
                      <TableCell>{ordenExp.copia || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.Proveedores?.nombreProveedor || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.Proveedores?.rutProveedor || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Soportes?.nombreIdentficiador || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Campania?.NombreCampania || 'NA'}</TableCell>
                      <TableCell>{ordenExp.numero_correlativo || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Campania?.Productos?.NombreDelProducto || 'NA'}</TableCell>
                      <TableCell>{ordenExp.usuario_registro?.nombre || 'NA'}</TableCell>
                      <TableCell>{ordenExp.Campania?.Presupuesto ? formatCurrency(ordenExp.Campania.Presupuesto) : 'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{'NA'}</TableCell>
                      <TableCell>{ordenExp.Contratos?.NombreContrato || 'NA'}</TableCell>
                      <TableCell>{ordenExp.OrdenesUsuarios?.[0]?.Usuarios?.nombre || ordenExp.usuario_registro?.nombre || 'NA'}</TableCell>
                      <TableCell>{ordenExp.OrdenesUsuarios?.[0]?.Usuarios?.Grupos?.nombre_grupo || ordenExp.usuario_registro?.grupo || 'NA'}</TableCell>
                      <TableCell>{mostrarEstado(ordenExp.estado)}</TableCell>
                      <TableCell>
                        {ordenExp.alternativaActual ? (
                          <Tooltip title="ID de alternativa">
                            <Box sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                              Alternativa #{ordenExp.alternativaActual}
                            </Box>
                          </Tooltip>
                        ) : 'Sin alternativa'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
      
      {/* Incluir el modal de vista previa */}
      <PreviewModal />
    </Container>
  );
};



export default ReporteOrdenDeCompra;