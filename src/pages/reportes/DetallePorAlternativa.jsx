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
  Tooltip
} from '@mui/material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import './ReporteOrdenDeCompra.css';
import { Pagination, Checkbox } from '@mui/material';

const ReporteOrdenDeCompra = () => {
  const [loading, setLoading] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [ordenes, setOrdenes] = useState([]);
  const [filtros, setFiltros] = useState({
    cliente: ''
  });
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
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
        .select('id_campania, NombreCampania, Presupuesto')
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

      // Aplicar filtro de cliente
      if (filtros.cliente) {
        query = query.eq('Campania.id_Cliente', filtros.cliente);
      }

      const { data, error } = await query.order('fechaCreacion', { ascending: false });

      if (error) throw error;
      
      // Log the format of the first few orders to see alternativas_plan_orden structure
      if (data && data.length > 0) {
        console.log("Ejemplo de datos de órdenes recibidos:");
        console.log("alternativas_plan_orden (primer elemento):", 
          data[0].alternativas_plan_orden, 
          "tipo:", typeof data[0].alternativas_plan_orden);
      }
      
      setOrdenes(data || []);
    } catch (error) {
      console.error('Error al buscar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener las alternativas por numerorden
  const fetchAlternativasPorNumeroOrden = async (numeroOrden) => {
    try {
      if (!numeroOrden) return [];
      
      console.log(`Buscando alternativas por número de orden ${numeroOrden}`);
      
      // Consulta completa con todas las relaciones
      const { data, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Programas (id, Nombre),
          Clasificacion (id, NombreClasificacion),
          Temas (id_tema, NombreTema),
          Soportes (id_soporte, nombreIdentficiador),
          Anios (id, years),
          Meses (Id, Nombre),
          Medios (id, nombre)
        `)
        .eq('numerorden', numeroOrden);

      if (error) {
        console.error(`Error al buscar alternativas por numerorden ${numeroOrden}:`, error);
        return [];
      }
      
      console.log(`Encontradas ${data ? data.length : 0} alternativas por numerorden ${numeroOrden}`);
      if (data && data.length > 0) {
        console.log("Columnas disponibles:", Object.keys(data[0]));
      }
      
      return data || [];
    } catch (error) {
      console.error('Error al obtener alternativas por numerorden:', error);
      return [];
    }
  };

  // Crear una nueva función para buscar alternativas individualmente
  const fetchAlternativasIndividualmente = async (ids) => {
    try {
      console.log("=== INICIO fetchAlternativasIndividualmente ===");
      console.log("IDs a buscar:", ids);
      
      if (!ids || ids.length === 0) {
        console.log("No hay IDs para buscar");
        return [];
      }
      
      // Buscar cada alternativa individualmente con WHERE id = X
      const resultados = [];
      
      // Procesar los IDs secuencialmente
      for (const id of ids) {
        console.log(`Buscando alternativa con ID = ${id}`);
        
        // Consulta completa incluyendo tablas relacionadas
        const { data, error } = await supabase
          .from('alternativa')
          .select(`
            *,
            Programas (id, Nombre),
            Clasificacion (id, NombreClasificacion),
            Temas (id_tema, NombreTema),
            Soportes (id_soporte, nombreIdentficiador),
            Anios (id, years),
            Meses (Id, Nombre),
            Medios (id, nombre)
          `)
          .eq('id', id);
        
        if (error) {
          console.error(`Error al buscar alternativa con ID ${id}:`, error);
        } else if (data && data.length > 0) {
          console.log(`Encontrada alternativa con ID ${id}:`, data[0]);
          // Mostrar también las columnas disponibles
          if (data[0]) {
            console.log(`Columnas disponibles en alternativa ${id}:`, Object.keys(data[0]));
          }
          resultados.push(...data);
        } else {
          console.log(`No se encontró alternativa con ID ${id}`);
        }
      }
      
      console.log(`Total de alternativas encontradas: ${resultados.length}`);
      console.log("=== FIN fetchAlternativasIndividualmente ===");
      return resultados;
    } catch (error) {
      console.error('Error al obtener alternativas individualmente:', error);
      return [];
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      cliente: ''
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
    console.log("=== INICIO extraerIdsAlternativas ===");
    console.log("Dato original:", alternativasPlanOrden);
    
    if (!alternativasPlanOrden) {
      console.log("Dato es null o undefined");
      return [];
    }
    
    let ids = [];
    
    try {
      // Caso 1: Ya es un array de números
      if (Array.isArray(alternativasPlanOrden) && 
          alternativasPlanOrden.every(id => typeof id === 'number')) {
        console.log("Caso 1: Array de números");
        ids = [...alternativasPlanOrden];
      }
      // Caso 2: Es una cadena JSON
      else if (typeof alternativasPlanOrden === 'string') {
        console.log("Caso 2: String, intentando parsear");
        try {
          const parsed = JSON.parse(alternativasPlanOrden);
          if (Array.isArray(parsed)) {
            console.log("String parseado a array:", parsed);
            ids = parsed.map(item => {
              if (typeof item === 'number') return item;
              if (typeof item === 'object' && item !== null) return item.id;
              if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);
              return null;
            }).filter(id => id !== null);
          } else if (typeof parsed === 'object' && parsed !== null) {
            console.log("String parseado a objeto, extrayendo valores");
            const valores = Object.values(parsed);
            ids = valores.map(val => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
              return null;
            }).filter(id => id !== null);
          }
        } catch (e) {
          console.error("Error parseando string JSON:", e);
        }
      }
      // Caso 3: Es un array pero con objetos o strings
      else if (Array.isArray(alternativasPlanOrden)) {
        console.log("Caso 3: Array con posibles objetos o strings");
        ids = alternativasPlanOrden.map(item => {
          if (typeof item === 'number') return item;
          if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);
          if (typeof item === 'object' && item !== null) return item.id;
          return null;
        }).filter(id => id !== null);
      }
      // Caso 4: Es un objeto pero no un array
      else if (typeof alternativasPlanOrden === 'object' && alternativasPlanOrden !== null) {
        console.log("Caso 4: Objeto no array");
        const valores = Object.values(alternativasPlanOrden);
        ids = valores.map(val => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
          return null;
        }).filter(id => id !== null);
      }
    } catch (e) {
      console.error("Error general procesando los IDs:", e);
    }
    
    console.log("IDs extraídos:", ids);
    console.log("=== FIN extraerIdsAlternativas ===");
    return ids;
  };

  // Función de prueba para buscar la alternativa 158
  const testBuscarAlternativa158 = async () => {
    try {
      console.log("=== PRUEBA DIRECTA: Buscando alternativa con ID 158 ===");
      
      // Consulta directa a la base de datos sin usar funciones intermediarias
      const { data, error } = await supabase
        .from('alternativa')
        .select('*')
        .eq('id', 158)
        .single();
      
      if (error) {
        console.error("Error en la prueba directa:", error);
      } else {
        console.log("Resultado de la prueba directa para ID 158:", data);
        console.log("Campos disponibles en alternativa 158:", Object.keys(data));
        // Imprimir cada campo y su valor
        Object.entries(data).forEach(([key, value]) => {
          console.log(`Campo: ${key}, Valor: ${value}, Tipo: ${typeof value}`);
        });
      }
      
      console.log("=== FIN PRUEBA DIRECTA ID 158 ===");
      return data;
    } catch (error) {
      console.error("Error en prueba directa:", error);
      return null;
    }
  };

  // Modificar la función ejecutarPrueba para iniciar la prueba al cargar la página
  const ejecutarPrueba = async () => {
    console.log("===== INICIANDO PRUEBAS =====");
    await testBuscarAlternativa158();
    console.log("===== PRUEBAS FINALIZADAS =====");
  };

  // Reemplazar el cuerpo de la función exportarOrdenEspecifica
  const exportarOrdenEspecifica = async (orden) => {
    try {
      setLoadingExport(true);
      
      console.log("=== INICIO exportarOrdenEspecifica ===");
      console.log("ID de orden:", orden.id_ordenes_de_comprar);
      console.log("Número de orden:", orden.numero_correlativo);
      console.log("Alternativa actual:", orden.alternativaActual);
      
      // Obtener las alternativas relacionadas por número de orden o IDs
      const numeroOrden = orden.numero_correlativo;
      let alternativas = [];
      
      // Primera prueba: Buscar directamente por ID si hay alternativa específica
      if (orden.alternativaActual) {
        console.log("Exportando sólo la alternativa específica:", orden.alternativaActual);
        
        // Consulta directa usando id
        const { data, error } = await supabase
          .from('alternativa')
          .select('*')
          .eq('id', orden.alternativaActual)
          .single();
        
        if (error) {
          console.error(`Error al buscar alternativa directa con ID ${orden.alternativaActual}:`, error);
        } else if (data) {
          console.log(`Alternativa directa encontrada con ID ${orden.alternativaActual}:`, data);
          console.log("Columnas disponibles en alternativa directa:", Object.keys(data));
          alternativas = [data];
        }
      } 
      // Si no hay alternativa específica, obtener todas las relacionadas
      else {
        // Extraer IDs de manera robusta
        if (orden.alternativas_plan_orden) {
          console.log("alternativas_plan_orden está presente, procesando...");
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            console.log(`Se extrajeron ${ids.length} IDs válidos, buscando alternativas...`);
            
            // Consulta directa por IDs
            for (const id of ids) {
              const { data, error } = await supabase
                .from('alternativa')
                .select('*')
                .eq('id', id)
                .single();
              
              if (error) {
                console.error(`Error al buscar alternativa con ID ${id}:`, error);
              } else if (data) {
                console.log(`Alternativa encontrada con ID ${id}:`, data);
                alternativas.push(data);
              }
            }
          }
        }
        
        // Si no se obtuvieron alternativas y tenemos un número de orden, intentar por ese método
        if (alternativas.length === 0 && numeroOrden) {
          console.log("No se encontraron alternativas por IDs. Buscando por número de orden:", numeroOrden);
          
          const { data, error } = await supabase
            .from('alternativa')
            .select('*')
            .eq('numerorden', numeroOrden);
          
          if (error) {
            console.error(`Error al buscar alternativas por numerorden ${numeroOrden}:`, error);
          } else if (data && data.length > 0) {
            console.log(`Encontradas ${data.length} alternativas por numerorden ${numeroOrden}`);
            alternativas = data;
          }
        }
      }
      
      console.log(`Encontradas ${alternativas.length} alternativas para la orden ${numeroOrden}`);
      
      // Revisar y mostrar detalladamente la primera alternativa
      if (alternativas.length > 0) {
        console.log("Primera alternativa (detallada):", alternativas[0]);
        console.log("Campos disponibles:", Object.keys(alternativas[0]));
        
        // Imprimir cada campo y su valor de la primera alternativa
        Object.entries(alternativas[0]).forEach(([key, value]) => {
          console.log(`Campo: ${key}, Valor: ${value}, Tipo: ${typeof value}`);
        });
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
              
              // Si es el nuevo formato de array
              if (Array.isArray(calendarData)) {
                diasCalendario = calendarData.map(item => `${item.dia}:${item.cantidad}`).join(', ');
              } 
              // Si es el formato anterior con days
              else if (calendarData && Array.isArray(calendarData.days)) {
                diasCalendario = calendarData.days.join(', ');
              }
            } catch (e) {
              console.error(`Error al procesar calendar para alternativa ${alt.id}:`, e);
            }
          }
          
          // Combinar datos de la orden con los de la alternativa
          return {
            ...datosBase,
            'ID Alternativa': alt.id || '',
            'Línea': alt.nlinea || '',
            'Número Orden': alt.numerorden || '',
            'Año ID': alt.anio || '',
            'Mes ID': alt.mes || '',
            'ID Campaña': alt.id_campania || '',
            'Número Contrato': alt.num_contrato || '',
            'ID Soporte': alt.id_soporte || '',
            'Descripción': alt.descripcion || '',
            'Tipo Item': alt.tipo_item || '',
            'ID Clasificación': alt.id_clasificacion || '',
            'Detalle': alt.detalle || '',
            'ID Tema': alt.id_tema || '',
            'Segundos': alt.segundos || '',
            'Total General': formatCurrency(alt.total_general),
            'Total Neto': formatCurrency(alt.total_neto),
            'Descuento %': alt.descuento_pl ? `${alt.descuento_pl}%` : '',
            'ID Programa': alt.id_programa || '',
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
            'Fecha Creación': alt.created_at || ''
          };
        });
      }
      
      // Crear y descargar el archivo Excel
      const wsOrden = XLSX.utils.json_to_sheet(dataToExportOrden);
      const wbOrden = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbOrden, wsOrden, 'Orden');
      
      // Agregar el ID de alternativa al nombre del archivo si está presente
      const alternativaId = orden.alternativaActual ? `-alt-${orden.alternativaActual}` : '';
      XLSX.writeFile(wbOrden, `orden_${orden.numero_correlativo || 'sin-numero'}${alternativaId}.xlsx`);
      
      console.log("Excel generado exitosamente");
      
    } catch (error) {
      console.error('Error al exportar orden específica:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      console.error('Error al formatear fecha:', e);
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
      console.error('Error al formatear hora:', e);
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
      console.log(`Buscando alternativa específica con ID: ${id}`);
      
      const { data, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Programas (id, Nombre),
          Clasificacion (id, NombreClasificacion),
          Temas (id_tema, NombreTema),
          Soportes (id_soporte, nombreIdentficiador),
          Anios (id, years),
          Meses (Id, Nombre),
          Medios (id, nombre)
        `)
        .eq('id', id)
        .limit(1)
        .single();

      if (error) {
        console.error(`Error al buscar alternativa con ID ${id}:`, error);
        return null;
      }
      
      console.log(`Resultado para alternativa con ID ${id}:`, data);
      return data;
    } catch (error) {
      console.error(`Error general al buscar alternativa con ID ${id}:`, error);
      return null;
    }
  };

  // Añadir una nueva función para exportar todas las alternativas
  const exportarTodasLasAlternativas = async () => {
    try {
      setLoadingExport(true);
      console.log("=== INICIO exportarTodasLasAlternativas ===");
      
      // Array para almacenar todas las filas de datos a exportar
      let todasLasFilas = [];
      
      // Para cada orden en ordenes
      for (const orden of ordenes) {
        console.log(`Procesando orden ${orden.id_ordenes_de_comprar}`);
        
        // Obtener las alternativas de esta orden
        const numeroOrden = orden.numero_correlativo;
        let alternativas = [];
        
        // Buscar por IDs de alternativas si están disponibles
        if (orden.alternativas_plan_orden) {
          const ids = extraerIdsAlternativas(orden.alternativas_plan_orden);
          
          if (ids.length > 0) {
            console.log(`Orden ${numeroOrden}: ${ids.length} IDs de alternativas encontrados`);
            
            // Consulta directa para obtener todas las alternativas de una vez
            const { data, error } = await supabase
              .from('alternativa')
              .select('*')
              .in('id', ids);
            
            if (error) {
              console.error(`Error al buscar alternativas para orden ${numeroOrden}:`, error);
            } else if (data && data.length > 0) {
              console.log(`Encontradas ${data.length} alternativas para orden ${numeroOrden}`);
              alternativas = data;
            }
          }
        }
        
        // Si no se encontraron alternativas por IDs, intentar por número de orden
        if (alternativas.length === 0 && numeroOrden) {
          console.log(`Buscando alternativas por numerorden ${numeroOrden}`);
          
          const { data, error } = await supabase
            .from('alternativa')
            .select('*')
            .eq('numerorden', numeroOrden);
          
          if (error) {
            console.error(`Error al buscar alternativas por numerorden ${numeroOrden}:`, error);
          } else if (data && data.length > 0) {
            console.log(`Encontradas ${data.length} alternativas por numerorden ${numeroOrden}`);
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
            'Año ID': '',
            'Mes ID': '',
            'ID Campaña': '',
            'Número Contrato': '',
            'ID Soporte': '',
            'Descripción': '',
            'Tipo Item': '',
            'ID Clasificación': '',
            'Detalle': '',
            'ID Tema': '',
            'Segundos': '',
            'Total General': '',
            'Total Neto': '',
            'Descuento %': '',
            'ID Programa': '',
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
                
                if (Array.isArray(calendarData)) {
                  diasCalendario = calendarData.map(item => `${item.dia}:${item.cantidad}`).join(', ');
                } else if (calendarData && Array.isArray(calendarData.days)) {
                  diasCalendario = calendarData.days.join(', ');
                }
              } catch (e) {
                console.error(`Error al procesar calendar para alternativa ${alt.id}:`, e);
              }
            }
            
            // Agregar una fila con datos combinados
            todasLasFilas.push({
              ...datosBase,
              'ID Alternativa': alt.id || '',
              'Línea': alt.nlinea || '',
              'Número Orden': alt.numerorden || '',
              'Año ID': alt.anio || '',
              'Mes ID': alt.mes || '',
              'ID Campaña': alt.id_campania || '',
              'Número Contrato': alt.num_contrato || '',
              'ID Soporte': alt.id_soporte || '',
              'Descripción': alt.descripcion || '',
              'Tipo Item': alt.tipo_item || '',
              'ID Clasificación': alt.id_clasificacion || '',
              'Detalle': alt.detalle || '',
              'ID Tema': alt.id_tema || '',
              'Segundos': alt.segundos || '',
              'Total General': formatCurrency(alt.total_general),
              'Total Neto': formatCurrency(alt.total_neto),
              'Descuento %': alt.descuento_pl ? `${alt.descuento_pl}%` : '',
              'ID Programa': alt.id_programa || '',
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
              'Fecha Creación': alt.created_at || ''
            });
          });
        }
      }
      
      console.log(`Se exportarán ${todasLasFilas.length} filas en total`);
      
      // Crear y descargar el archivo Excel
      const ws = XLSX.utils.json_to_sheet(todasLasFilas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Completo');
      
      // Generar nombre con fecha actual
      const fechaActual = format(new Date(), 'dd-MM-yyyy');
      XLSX.writeFile(wb, `reporte_alternativas_${fechaActual}.xlsx`);
      
      console.log("Excel general generado exitosamente");
    } catch (error) {
      console.error('Error al exportar todas las alternativas:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 3 }}>
        Reporte de Detalle por Alternativa
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#2c3e50' }}>
          Filtros
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8}>
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
          <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={buscarOrdenes}
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
          {ordenes.length > 0 && (
            <Button 
              variant="contained" 
              color="success" 
              onClick={exportarTodasLasAlternativas}
              disabled={loadingExport}
            >
              {loadingExport ? <CircularProgress size={24} /> : 'Exportar Todo a Excel'}
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
                    <TableCell>ALTERNATIVA</TableCell>
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
    </Container>
  );
};

export default ReporteOrdenDeCompra;