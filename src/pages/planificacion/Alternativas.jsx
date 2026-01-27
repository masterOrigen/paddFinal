import React, { useState, useEffect, useRef } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import './Planificacion.css';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Checkbox, 
  ListItemText, 
  OutlinedInput,
  FormHelperText,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Autocomplete,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip
} from '@mui/material';
import ModalEditarTema from '../campanas/ModalEditarTema';
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  PriceChange as PriceChangeIcon,
  Discount as DiscountIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Topic as TopicIcon,
  Radio as RadioIcon,
  Timer as TimerIcon,
  Category as CategoryIcon,
  PlaylistPlay as PlaylistPlayIcon,
  Class as ClassIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  AddCircle as AddCircleIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import ModalAgregarContrato from '../contratos/ModalAgregarContrato';
import ModalEditarContrato from '../contratos/ModalEditarContrato';
import ModalAgregarTema from '../campanas/ModalAgregarTema';
import Swal from 'sweetalert2';

const TIPO_ITEMS = [
  'PAUTA LIBRE',
  'AUSPICIO',
  'VPS',
  'CPR',
  'CPM',
  'CPC',
  'BONIF%',
  'CANJE'
];

const Alternativas = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const { id } = useParams();
  const navigate = useNavigate();
  const [autoFillCantidades, setAutoFillCantidades] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [alternativas, setAlternativas] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [soportes, setSoportes] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [programas, setProgramas] = useState([]); 
  const [nextNumeroOrden, setNextNumeroOrden] = useState(1);
  const [planData, setPlanData] = useState(null);
  const [clienteId, setClienteId] = useState(null);
  const [proveedorId, setProveedorId] = useState(null);
  const [campaniaId, setCampaniaId] = useState(null);
  const [planInfo, setPlanInfo] = useState({
    anio: '',
    mes: '',
    campana: '',
    cliente: '',
    producto: ''
  });

  const [nuevaAlternativa, setNuevaAlternativa] = useState({
    nlinea: '',
    numerorden: 1,
    anio: '',
    mes: '',
    id_campania: '',
    num_contrato: '',
    id_contrato: '',
    id_soporte: '',
    id_programa: '',
    tipo_item: '',
    id_clasificacion: '',
    detalle: '',
    id_tema: '',
    segundos: '',
    id_medio: '',
    cantidades: [], 
    valor_unitario: '',
    descuento_plan: '',
    recargo_plan: '',
    total_bruto: '',
    total_neto: '',
    multiplicar_valor_unitario: false,
    medio: '',
    bonificacion_ano: '',
    escala: '',
    formaDePago: '',
    nombreFormaPago: '',
    soporte: ''
  });

  const [visibleFields, setVisibleFields] = useState({
    duracion: false,
    color: false,
    codigo_megatime: false,
    calidad: false,
    cooperado: false,
    rubro: false
  });

  const [editandoAlternativa, setEditandoAlternativa] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [openContratosModal, setOpenContratosModal] = useState(false);
  const [openAddContratoModal, setOpenAddContratoModal] = useState(false);
  const [openEditContratoModal, setOpenEditContratoModal] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [searchContrato, setSearchContrato] = useState('');
  const [openAddSoporteModal, setOpenAddSoporteModal] = useState(false);
  const [openTemasModal, setOpenTemasModal] = useState(false);
  const [openAddTemaModal, setOpenAddTemaModal] = useState(false);
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [temasFiltrados, setTemasFiltrados] = useState([]);
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [searchTema, setSearchTema] = useState('');
  const [nuevoSoporte, setNuevoSoporte] = useState({
    nombreIdentficiador: '',
    bonificacion_ano: 0,
    escala: 0,
    id_medio: '',
    medios: []
  });
  const [mediosOptions, setMediosOptions] = useState([]);
  const [loadingMedios, setLoadingMedios] = useState(false);
  const [openSoportesModal, setOpenSoportesModal] = useState(false);
  const [selectedSoporte, setSelectedSoporte] = useState(null);
  const [allSoportes, setAllSoportes] = useState([]);
  const [soportesFiltrados, setSoportesFiltrados] = useState([]);
  const [loadingSoportes, setLoadingSoportes] = useState(false);
  const [searchSoporte, setSearchSoporte] = useState('');

  const [openProgramasModal, setOpenProgramasModal] = useState(false);
  const [searchPrograma, setSearchPrograma] = useState('');
  const [loadingProgramas, setLoadingProgramas] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState(null);
  const [programasFiltrados, setProgramasFiltrados] = useState([]);

  const [openClasificacionModal, setOpenClasificacionModal] = useState(false);
  const [openAddEditClasificacionModal, setOpenAddEditClasificacionModal] = useState(false);
  const [searchClasificacion, setSearchClasificacion] = useState('');
  const [loadingClasificaciones, setLoadingClasificaciones] = useState(false);
  const [clasificacionesList, setClasificacionesList] = useState([]);
  const [selectedClasificacion, setSelectedClasificacion] = useState(null);
  const [editingClasificacion, setEditingClasificacion] = useState(null);
  const [nuevaClasificacion, setNuevaClasificacion] = useState({
    NombreClasificacion: '',
    IdMedios: '' 
  });

  const [openAddEditProgramaModal, setOpenAddEditProgramaModal] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState(null);
  const [newPrograma, setNewPrograma] = useState({
    descripcion: '',
    hora_inicio: '',
    hora_fin: '',
    cod_prog_megatime: '',
    codigo_programa: '',
    soporte_id: ''
  });
  const [soportesParaPrograma, setSoportesParaPrograma] = useState([]);
  const cantidadesRef = useRef({});

  const handleOpenAddContratoModal = () => {
    setOpenAddContratoModal(true);
  };
  const handleCantidadInput = (dia, valor) => {
    cantidadesRef.current[dia] = valor;
    if (autoFillCantidades && valor !== '') {
      const diaActual = parseInt(dia, 10);
      for (let i = diaActual + 1; i <= 31; i++) {
        const diaSiguiente = i.toString().padStart(2, '0');
        cantidadesRef.current[diaSiguiente] = valor;
      }
    }
  };
  const handleToggleMultiplicar = (checked) => {
    setNuevaAlternativa(prev => {
      const tipoGeneracionOrden = contratoSeleccionado?.id_GeneraracionOrdenTipo || 1;
      const updated = { ...prev, multiplicar_valor_unitario: checked };
      const valorUnitario = Number(updated.valor_unitario) || 0;
      const descuento = Number(updated.descuento_plan) || 0;
      const recargo = Number(updated.recargo_plan) || 0;
      const totalCantidades = updated.cantidades.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
      const multiplicador = updated.multiplicar_valor_unitario ? (totalCantidades > 0 ? totalCantidades : 1) : 1;
      let totalBruto = 0;
      let totalNeto = 0;
      if (tipoGeneracionOrden === 1) {
        const totalNetoBase = valorUnitario * multiplicador;
        let totalConDescuento = totalNetoBase;
        if (descuento > 0) totalConDescuento = totalNetoBase - (totalNetoBase * (descuento / 100));
        totalNeto = recargo > 0 ? totalConDescuento + (totalConDescuento * (recargo / 100)) : totalConDescuento;
        totalBruto = Math.round(totalNeto / 0.85);
      } else {
        const totalBrutoBase = valorUnitario * multiplicador;
        let totalConDescuento = totalBrutoBase;
        if (descuento > 0) totalConDescuento = totalBrutoBase - (totalBrutoBase * (descuento / 100));
        totalBruto = recargo > 0 ? totalConDescuento + (totalConDescuento * (recargo / 100)) : totalConDescuento;
        totalNeto = Math.round(totalBruto * 0.85);
      }
      const iva = Math.round(totalNeto * 0.19);
      const totalOrden = totalNeto + iva;
      return {
        ...updated,
        total_bruto: Math.round(totalBruto),
        total_neto: Math.round(totalNeto),
        iva: Math.round(iva),
        total_orden: Math.round(totalOrden)
      };
    });
  };

  const handleCloseAddContratoModal = () => {
    setOpenAddContratoModal(false);
    handleSearchContrato(); // Actualizar la lista después de agregar
  };
  const handleOpenAddSoporteModal = () => {
    // Verificar que contratoSeleccionado exista
    if (!contratoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato'
      });
      return;
    }
    
    // Verificar que el proveedor exista en el contrato (considerando ambas estructuras posibles)
    const proveedorId = contratoSeleccionado.proveedor?.id_proveedor || contratoSeleccionado.IdProveedor;
    
    if (!proveedorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'El contrato seleccionado no tiene un proveedor válido'
      });
      return;
    }
    
    // Establecer el ID del proveedor para usarlo en la función handleSaveSoporte
    setProveedorId(proveedorId);
    
    // Inicializar el nuevo soporte con el medio del contrato seleccionado
    const medioId = contratoSeleccionado.medio?.id || contratoSeleccionado.IdMedios;
    
    if (medioId) {
      setNuevoSoporte({
        nombreIdentficiador: '',
        bonificacion_ano: 0,
        escala: 0,
        id_medio: medioId,
        medios: [medioId]
      });
    } else {
      setNuevoSoporte({
        nombreIdentficiador: '',
        bonificacion_ano: 0,
        escala: 0,
        id_medio: '',
        medios: []
      });
    }
    
    // Cargar los medios disponibles
    fetchMedios();
    setOpenAddSoporteModal(true);
  };
  // Función para cerrar el modal de agregar soporte
  const handleCloseAddSoporteModal = () => {
    setOpenAddSoporteModal(false);
    setNuevoSoporte({
      nombreIdentficiador: '',
      bonificacion_ano: 0,
      escala: 0,
      id_medio: '',
      medios: []
    });
  };

  // Función para cargar los medios disponibles
  const fetchMedios = async () => {
    setLoadingMedios(true);
    try {
      const { data, error } = await supabase
        .from('Medios')
        .select('id, NombredelMedio')
        .order('NombredelMedio', { ascending: true });

      if (error) throw error;
      setMediosOptions(data || []);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los medios'
      });
    } finally {
      setLoadingMedios(false);
    }
  };

  // Función para guardar el nuevo soporte
  const handleSaveSoporte = async () => {
    if (!nuevoSoporte.nombreIdentficiador) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'El nombre del soporte es obligatorio'
      });
      return;
    }

    // Obtener el ID del proveedor del contrato seleccionado
    const proveedorId = contratoSeleccionado.proveedor?.id_proveedor || contratoSeleccionado.IdProveedor;
    
    if (!proveedorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'No se pudo identificar el proveedor del contrato'
      });
      return;
    }


    // Verificar los medios
    let mediosToInsert = [];
    if (contratoSeleccionado && contratoSeleccionado.medio && contratoSeleccionado.medio.id) {
      // Si hay un medio en el contrato con estructura anidada
      mediosToInsert = [contratoSeleccionado.medio.id];
    } else if (contratoSeleccionado && contratoSeleccionado.IdMedios) {
      // Si hay un medio en el contrato con estructura plana
      mediosToInsert = [contratoSeleccionado.IdMedios];
    } else if (nuevoSoporte.medios && nuevoSoporte.medios.length > 0) {
      // Si no hay medio en el contrato pero hay medios seleccionados
      mediosToInsert = nuevoSoporte.medios;
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debe seleccionar al menos un medio'
      });
      return;
    }

    try {
      // 1. Primero, obtener el máximo id_soporte actual para generar uno nuevo manualmente
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('Soportes')
        .select('id_soporte')
        .order('id_soporte', { ascending: false })
        .limit(1);

      if (maxIdError) throw maxIdError;

      // Calcular el nuevo id_soporte
      const maxId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id_soporte : 0;
      const nuevoId = maxId + 1;
      
      // 2. Insertar el soporte con el id_soporte explícito
      const soporteData = {
        id_soporte: nuevoId,
        nombreIdentficiador: nuevoSoporte.nombreIdentficiador,
        bonificacion_ano: nuevoSoporte.bonificacion_ano || 0,
        escala: nuevoSoporte.escala || 0
      };
      
      const { data: insertedSoporte, error: soporteError } = await supabase
        .from('Soportes')
        .insert([soporteData])
        .select();

      if (soporteError) throw soporteError;

      if (!insertedSoporte || insertedSoporte.length === 0) {
        throw new Error('No se pudo obtener el ID del soporte insertado');
      }

      const nuevoSoporteId = insertedSoporte[0].id_soporte;
      // 3. Insertar relaciones soporte-medio
      const soporteMediosInserts = mediosToInsert.map(medioId => ({
        id_soporte: nuevoSoporteId,
        id_medio: medioId
      }));

      const { error: soporteMediosError } = await supabase
        .from('soporte_medios')
        .insert(soporteMediosInserts);

      if (soporteMediosError) throw soporteMediosError;

      // 4. Insertar relación proveedor-soporte
      const proveedorId = contratoSeleccionado.proveedor?.id_proveedor || contratoSeleccionado.IdProveedor;
      
      if (!proveedorId) {
        throw new Error('No se pudo identificar el ID del proveedor');
      }
      
      const proveedorSoporteData = {
        id_proveedor: proveedorId,
        id_soporte: nuevoSoporteId
      };
      
      const { error: proveedorSoporteError } = await supabase
        .from('proveedor_soporte')
        .insert([proveedorSoporteData]);

      if (proveedorSoporteError) throw proveedorSoporteError;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Soporte agregado correctamente'
      });

      // Actualizar la lista de soportes
      if (contratoSeleccionado) {
        // Obtener el proveedorId del contrato seleccionado
        const proveedorId = contratoSeleccionado.proveedor?.id_proveedor || contratoSeleccionado.IdProveedor;
        
        const { data: proveedorSoportes, error: soportesError } = await supabase
          .from('proveedor_soporte')
          .select(`
            id_soporte,
            Soportes!inner (
              id_soporte,
              nombreIdentficiador,
              bonificacion_ano,
              escala,
              soporte_medios!inner (
                Medios!inner (
                  id,
                  NombredelMedio
                )
              )
            )
          `)
          .eq('id_proveedor', proveedorId);
  
        if (soportesError) throw soportesError;
  
        const soportesFiltrados = proveedorSoportes.map(item => {
          const medios = item.Soportes.soporte_medios
            ? item.Soportes.soporte_medios
                .map(sm => sm.Medios.NombredelMedio)
                .join(', ')
            : '';
          
          return {
            id_soporte: item.Soportes.id_soporte,
            nombreIdentficiador: item.Soportes.nombreIdentficiador,
            Medios: medios,
            bonificacion_ano: item.Soportes.bonificacion_ano,
            escala: item.Soportes.escala
          };
        });
  
        setAllSoportes(soportesFiltrados);
        
        // Aplicar el filtro por medio del contrato
        if (contratoSeleccionado.medio) {
          const soportesPorMedio = soportesFiltrados.filter(soporte => 
            soporte.Medios.includes(contratoSeleccionado.medio.NombredelMedio)
          );
          setSoportes(soportesPorMedio);
        } else {
          setSoportes(soportesFiltrados);
        }
      }
  
      handleCloseAddSoporteModal();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al guardar el soporte: ${error.message || JSON.stringify(error)}`
      });
    }
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setModoEdicion(false);
    setEditandoAlternativa(null);
    cantidadesRef.current = {};
    // Reset nueva alternativa with all required fields including empty cantidades array
    setNuevaAlternativa({
      nlinea: '',
      numerorden: nextNumeroOrden,
      anio: planData?.anio || '',
      mes: planData?.mes || '',
      id_campania: planData?.id_campania || '',
      num_contrato: '',
      id_soporte: '',
      id_programa: '',
      tipo_item: '',
      id_clasificacion: '',
      detalle: '',
      id_tema: '',
      segundos: '',
      id_medio: '',
      cantidades: [], // Ensure this is always initialized as an empty array
      valor_unitario: '',
      descuento_plan: '',
      recargo_plan: '',
      total_bruto: '',
      total_neto: '',
      multiplicar_valor_unitario: false,
      medio: '',
      bonificacion_ano: '',
      escala: '',
      formaDePago: '',
      nombreFormaPago: '',
      soporte: ''
    });
    // Reset selected items
    setContratoSeleccionado(null);
    setSelectedSoporte(null);
    setSelectedPrograma(null);
    setTemaSeleccionado(null);
    setSelectedClasificacion(null);
  };

  const handleOpenNuevaAlternativa = () => {
    cantidadesRef.current = {};
    setModoEdicion(false);
    setEditandoAlternativa(null);
    setOpenModal(true);
  };

  const handleOpenEditContratoModal = () => {
    if (!contratoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato'
      });
      return;
    }
    setOpenEditContratoModal(true);
  };

  const handleCloseEditContratoModal = () => {
    setOpenEditContratoModal(false);
    handleSearchContrato(); // Actualizar la lista después de editar
  };
  const [validationErrors, setValidationErrors] = useState({
    contrato: false,
    soporte: false
  });

  useEffect(() => {
    const fetchContratos = async () => {
      if (!clienteId) return;

      try {
        const { data, error } = await supabase
          .from('Contratos')
          .select(`
            id,
            NombreContrato,
            Estado,
            cliente:IdCliente (id_cliente, nombreCliente),
            proveedor:IdProveedor (id_proveedor, nombreProveedor),
            medio:IdMedios (id, NombredelMedio),
            formaPago:id_FormadePago(
              id,
              NombreFormadePago
            )
          `)
          .eq('IdCliente', clienteId);

        if (error) throw error;

        setContratos(data || []);
      } catch (error) {
        console.error('Error al obtener contratos:', error);
      }
    };

    fetchContratos();
  }, [clienteId]);
  const fetchClasificacionesByContrato = async (contratoId) => {
    try {
      setLoadingClasificaciones(true);
      
      // Primero obtenemos el contrato para saber su IdMedios
      const { data: contratoData, error: contratoError } = await supabase
        .from('Contratos')
        .select('IdMedios')
        .eq('id', contratoId)
        .single();
      
      if (contratoError) throw contratoError;
      
      if (!contratoData || !contratoData.IdMedios) {
        setClasificacionesList([]);
        return;
      }
      
      // Ahora obtenemos las clasificaciones que coincidan con el medio del contrato
      const { data, error } = await supabase
        .from('Clasificacion')
        .select('*')
        .eq('IdMedios', contratoData.IdMedios);
      
      if (error) throw error;
      
      setClasificacionesList(data || []);
    } catch (error) {
      console.error('Error al cargar clasificaciones:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las clasificaciones'
      });
      setClasificacionesList([]);
    } finally {
      setLoadingClasificaciones(false);
    }
  };
  useEffect(() => {
    const fetchSoportes = async () => {
      if (!proveedorId) {
        setSoportes([]);
        return;
      }

      try {
        // Obtener los soportes del proveedor con sus medios asociados
        const { data: proveedorSoportes, error: soportesError } = await supabase
          .from('proveedor_soporte')
          .select(`
            id_soporte,
            Soportes!inner (
              id_soporte,
              nombreIdentficiador,
              bonificacion_ano,
              escala,
              soporte_medios!inner (
                Medios!inner (
                  id,
                  NombredelMedio
                )
              )
            )
          `)
          .eq('id_proveedor', proveedorId);

        if (soportesError) throw soportesError;

        // Transformar los datos para tener la estructura correcta
        const soportesFiltrados = proveedorSoportes.map(item => {
          // Obtener los nombres de los medios asociados al soporte
          const medios = item.Soportes.soporte_medios
            ? item.Soportes.soporte_medios
                .map(sm => sm.Medios.NombredelMedio)
                .join(', ')
            : '';
          
          return {
            id_soporte: item.Soportes.id_soporte,
            nombreIdentficiador: item.Soportes.nombreIdentficiador,
            Medios: medios,
            bonificacion_ano: item.Soportes.bonificacion_ano,
            escala: item.Soportes.escala
          };
        });

        setSoportes(soportesFiltrados);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al obtener soportes'
        });
      }
    };

    fetchSoportes();
  }, [proveedorId]);

  useEffect(() => {
    const fetchTemas = async () => {
      if (!campaniaId) {
        setTemas([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('campania_temas')
          .select(`
            id_temas,
            Temas:id_temas (
              id_tema,
              NombreTema,
              Duracion,
              id_medio,
              Medios:id_medio (
                id,
                NombredelMedio
              )
            )
          `)
          .eq('id_campania', campaniaId);

        if (error) {
          console.error('Error al obtener temas:', error);
          throw error;
        }

        // Transformar los datos para tener la estructura correcta
        const temasFiltrados = data.map(item => ({
          id_tema: item.id_temas,
          NombreTema: item.Temas.NombreTema,
          segundos: item.Temas.Duracion,
          nombreMedio: item.Temas.Medios?.NombredelMedio || '',
          id_medio: item.Temas.Medios?.id || null
        }));

        setTemas(temasFiltrados);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los temas'
        });
      }
    };

    fetchTemas();
  }, [campaniaId]);

  useEffect(() => {
    const fetchProgramas = async () => {
      if (!nuevaAlternativa.id_soporte) {
        setProgramasFiltrados([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('Programas')
          .select('*')
          .eq('soporte_id', nuevaAlternativa.id_soporte)
          .eq('estado', true)  // Solo programas activos
          .ilike('descripcion', `%${searchPrograma}%`)
          .order('descripcion', { ascending: true });

        if (error) throw error;

        setProgramasFiltrados(data || []);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los programas'
        });
      }
    };

    fetchProgramas();
  }, [nuevaAlternativa.id_soporte, searchPrograma]);

  useEffect(() => {
    const fetchFormasDePago = async () => {
      try {
        const { data, error } = await supabase
          .from('FormaDePago')
          .select('id, NombreFormadePago');

        if (error) throw error;
        setFormasDePago(data || []);
      } catch (error) {
        console.error('Error al obtener formas de pago:', error);
      }
    };

    fetchFormasDePago();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('No se encontró el ID del plan');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Obtener datos del plan
        const { data: plan, error } = await supabase
          .from('plan')
          .select(`
            *,
            Anios!anio (
              id, 
              years
            ),
            Meses!mes (
              Id, 
              Nombre
            ),
            Campania!inner (
              id_campania,
              NombreCampania,
              Clientes (
                id_cliente, 
                nombreCliente
              ),
              Productos (
                id, 
                NombreDelProducto
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setPlanData(plan);
        
        // Guardar los IDs necesarios
        setClienteId(plan.Campania?.Clientes?.id_cliente);
        setCampaniaId(plan.Campania?.id_campania);

        setPlanInfo({
          anio: plan.Anios?.years,
          mes: plan.Meses?.Nombre,
          campana: plan.Campania?.NombreCampania || '',
          cliente: plan.Campania?.Clientes?.nombreCliente || '',
          producto: plan.Campania?.Productos?.NombreDelProducto || ''
        });

        setNuevaAlternativa(prev => ({
          ...prev,
          anio: plan.anio,
          mes: plan.mes,
          id_campania: plan.id_campania
        }));

        await Promise.all([
          fetchAlternativas(),
          fetchDependencies()
        ]);

      } catch (error) {
        setError(error.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo cargar la información del plan'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const fetchAlternativas = async () => {
    try {
      // Primero obtenemos las relaciones de plan_alternativas
      const { data: planAlternativas, error: planAltError } = await supabase
        .from('plan_alternativas')
        .select('id_alternativa')
        .eq('id_plan', id);

      if (planAltError) throw planAltError;

      // Si no hay alternativas, establecemos un array vacío y salimos
      if (!planAlternativas || planAlternativas.length === 0) {
        setAlternativas([]);
        return;
      }

      // Obtenemos los IDs de las alternativas (asegurándonos de que no sean null)
      const alternativaIds = planAlternativas
        .map(pa => pa.id_alternativa)
        .filter(id => id != null);

      // Si no hay IDs válidos después del filtrado, salimos
      if (alternativaIds.length === 0) {
        setAlternativas([]);
        return;
      }

      // Ahora obtenemos los detalles de cada alternativa
      const { data, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Anios (
            id,
            years
          ),
          Meses (
            Id,
            Nombre
          ),
          Contratos (
            id,
            NombreContrato
          ),
          Soportes (
            id_soporte,
            nombreIdentficiador
          ),
          Clasificacion (
            id,
            NombreClasificacion
          ),
          Temas (
            id_tema,
            NombreTema
          ),
          Programas (
            id,
            descripcion
          ),
          Medios (
            id,
            NombredelMedio
          )
        `)
        .in('id', alternativaIds)
        .or('anulada.is.null,anulada.eq.false')
        .order('numerorden', { ascending: true });

      if (error) {
        throw error;
      }

      // Obtener órdenes anuladas del plan para filtrar alternativas asociadas
      const { data: annulledOrders, error: annulledError } = await supabase
        .from('OrdenesDePublicidad')
        .select('alternativas_plan_orden')
        .eq('id_plan', id)
        .eq('estado', 'anulada');

      if (annulledError) throw annulledError;

      const annulledAlternativeIds = annulledOrders 
        ? annulledOrders.flatMap(o => o.alternativas_plan_orden || [])
        : [];

      // Filtrar alternativas que estén en órdenes anuladas y aquellas con campo anulada en true
      const filteredData = (data || []).filter(alt => 
        !annulledAlternativeIds.includes(alt.id) && 
        alt.anulada !== true
      );

      setAlternativas(filteredData);
      if (filteredData.length > 0) {
        setNextNumeroOrden(Math.max(...filteredData.map(a => a.numerorden)) + 1);
      }
    } catch (error) {
      setAlternativas([]); 
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las alternativas'
      });
    }
  };

  const fetchDependencies = async () => {
    try {
      const { data: clasificaciones, error } = await supabase
        .from('Clasificacion')
        .select('*');

      if (error) throw error;
      
      setClasificaciones(clasificaciones || []);
    } catch (error) {
      console.error('Error al cargar las dependencias:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar las dependencias'
      });
    }
  };

  const handleDuplicateAlternativa = async (alternativa) => {

    try {
      // Create a new alternativa object with the same values but without the id
      const duplicatedAlternativaData = {
        ...alternativa,
        // Handle nlinea properly - if it's null or not a number, generate a new one
        // otherwise append a number to make it unique
        // nlinea: alternativa.nlinea ? (Number(alternativa.nlinea) + 1).toString() : '1',
        // numerorden: nextNumeroOrden
        nlinea: null,
        ordencreada: null,
  numerorden: null
      };
      delete duplicatedAlternativaData.id;
      delete duplicatedAlternativaData.Anios;
      delete duplicatedAlternativaData.Meses;
      delete duplicatedAlternativaData.Contratos;
      delete duplicatedAlternativaData.Soportes;
      delete duplicatedAlternativaData.Clasificacion;
      delete duplicatedAlternativaData.Temas;
      delete duplicatedAlternativaData.Medios;
      delete duplicatedAlternativaData.Programas;

   
      // First insert the new alternativa
      const { data: newAlternativa, error: alternativaError } = await supabase
        .from('alternativa')
        .insert([duplicatedAlternativaData])
        .select();


        
      if (alternativaError) throw alternativaError;

      // Then create the plan_alternativas relationship
      const { error: planAltError } = await supabase
        .from('plan_alternativas')
        .insert([{
          id_plan: id,
          id_alternativa: newAlternativa[0].id
        }]);

      if (planAltError) throw planAltError;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Alternativa duplicada correctamente'
      });

      await fetchAlternativas();
      setNextNumeroOrden(prev => prev + 1);

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo duplicar la alternativa: ${error.message || 'Error desconocido'}`
      });
    }
  };


  const handleDeleteAlternativa = async (alternativaId) => {
    try {
      const { data: alternativaCheck, error: checkError } = await supabase
      .from('alternativa')
      .select('numerorden')
      .eq('id', alternativaId)
      .single();
    
    if (checkError) throw checkError;
    
    // Si tiene número de orden, bloqueamos la eliminación
    if (alternativaCheck && alternativaCheck.numerorden) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción bloqueada',
        text: 'No se puede eliminar una alternativa que ya tiene número de orden asignado'
      });
      return;
    }
      // Mostrar confirmación antes de eliminar
      const { isConfirmed } = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (!isConfirmed) return;

      setLoading(true);

      // Primero eliminar la relación en plan_alternativas
      const { error: planAltError } = await supabase
        .from('plan_alternativas')
        .delete()
        .eq('id_plan', id)
        .eq('id_alternativa', alternativaId);

      if (planAltError) throw planAltError;

      // Luego eliminar la alternativa
      const { error: altError } = await supabase
        .from('alternativa')
        .delete()
        .eq('id', alternativaId);

      if (altError) throw altError;

      // Recargar la lista de alternativas
      await fetchAlternativas();

      Swal.fire(
        '¡Eliminado!',
        'La alternativa ha sido eliminada.',
        'success'
      );
    } catch (error) {
      console.error('Error al eliminar alternativa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la alternativa'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleEditAlternativa = async (alternativaId) => {
    try {
      setLoading(true);
      cantidadesRef.current = {};
       // Primero verificamos si la alternativa tiene número de orden
    const { data: alternativaCheck, error: checkError } = await supabase
    .from('alternativa')
    .select('numerorden')
    .eq('id', alternativaId)
    .single();
  
  if (checkError) throw checkError;
   // Si tiene número de orden, bloqueamos la edición
   if (alternativaCheck && alternativaCheck.numerorden) {
    Swal.fire({
      icon: 'warning',
      title: 'Acción bloqueada',
      text: 'No se puede editar una alternativa que ya tiene número de orden asignado'
    });
    setLoading(false);
    return;
  }
      
      // Updated query to include more detailed Temas and Medios information
      const { data: alternativa, error } = await supabase
        .from('alternativa')
        .select(`
          *,
          Contratos:num_contrato (*,
            formaPago:id_FormadePago (id, NombreFormadePago),
            medio:IdMedios (id, NombredelMedio)
          ),
          Soportes:id_soporte (*),
          Programas:id_programa (*),
          Temas:id_tema (
            id_tema,
            NombreTema,
            Duracion,
            id_medio,
            Medios:id_medio (
              id,
              NombredelMedio
            )
          ),
          Clasificacion:id_clasificacion (*)
        `)
        .eq('id', alternativaId)
        .single();
  
      if (error) throw error;
  
      // Asegurarse de que los valores numéricos sean números y no strings
      const valor_unitario = parseFloat(alternativa.valor_unitario) || 0;
      const descuento_plan = parseFloat(alternativa.descuento_plan) || 0;
      const recargo_plan = parseFloat(alternativa.recargo_plan) || 0;
      const total_bruto = parseFloat(alternativa.total_bruto) || 0;
      const total_neto = parseFloat(alternativa.total_neto) || 0;
      const iva = parseFloat(alternativa.iva) || 0;
      const total_orden = parseFloat(alternativa.total_orden) || 0;
      
      const contratoConMedio = {
        ...alternativa.Contratos,
        medio: alternativa.Contratos?.medio || null
      };
      setContratoSeleccionado(contratoConMedio);
      // Set related data including classification
      setContratoSeleccionado(alternativa.Contratos);
      setSelectedSoporte(alternativa.Soportes);
      setSelectedPrograma(alternativa.Programas);
      setSelectedClasificacion(alternativa.Clasificacion);
      
      // Set tema with proper structure
      if (alternativa.Temas) {
        const temaData = {
          id_tema: alternativa.Temas.id_tema,
          NombreTema: alternativa.Temas.NombreTema, // Changed from nombre_tema to NombreTema
          segundos: alternativa.Temas.Duracion,
          id_medio: alternativa.Temas.id_medio,
          Medios: alternativa.Temas.Medios,
          nombreMedio: alternativa.Temas.Medios?.NombredelMedio || ''
        };
        setTemaSeleccionado(temaData);
      }
  
      // Prepare calendar data
      const calendarData = alternativa.calendar || [];
      if (Array.isArray(calendarData)) {
        calendarData.forEach(({ dia, cantidad }) => {
          if (dia) cantidadesRef.current[dia] = cantidad ?? '';
        });
      }
      
      // Recalcular los valores monetarios para asegurar consistencia
      const tipoGeneracionOrden = alternativa.Contratos?.id_GeneraracionOrdenTipo || 1;
      let calculatedTotalBruto = total_bruto;
      let calculatedTotalNeto = total_neto;
      
      // Si no hay valores, recalcularlos según la lógica de handleMontoChange
      if (!total_bruto || !total_neto) {
        const totalCantidades = (Array.isArray(alternativa.calendar) ? alternativa.calendar : []).reduce((sum, item) => {
          return sum + (Number(item.cantidad) || 0);
        }, 0);
        
        if (tipoGeneracionOrden === 1) { // Neto
          calculatedTotalNeto = valor_unitario * totalCantidades;
          calculatedTotalBruto = Math.round(calculatedTotalNeto / 0.85);
        } else { // Bruto
          calculatedTotalBruto = valor_unitario * totalCantidades;
          calculatedTotalNeto = Math.round(calculatedTotalBruto * 0.85);
        }
      }
      
      // Calcular IVA y total orden si no existen
      const calculatedIva = iva || Math.round(calculatedTotalNeto * 0.19);
      const calculatedTotalOrden = total_orden || (calculatedTotalNeto + calculatedIva);
  
      // Set complete alternative data for editing
      setNuevaAlternativa(prev => ({
        ...alternativa,
        id_contrato: alternativa.num_contrato, // Asegurar que id_contrato esté presente para validaciones
        cantidades: Array.isArray(alternativa.calendar) ? alternativa.calendar : [],
        detalle: alternativa.detalle || '',
        nlinea: alternativa.nlinea || '',
        formaDePago: alternativa.Contratos?.formaPago?.id,
        nombreFormaPago: alternativa.Contratos?.formaPago?.NombreFormadePago,
        segundos: alternativa.Temas?.Duracion || '',
        id_medio: alternativa.Contratos?.medio?.id || null,
        nombreMedio: alternativa.Contratos?.medio?.NombredelMedio || '',
        Medios: alternativa.Contratos?.medio || null,
        // Asegurar que los valores monetarios sean números
        valor_unitario: alternativa.valor_unitario || '',
        descuento_plan: alternativa.descuento_pl || '',
        recargo_plan: recargo_plan,
        total_bruto: calculatedTotalBruto || 0,
        total_neto: calculatedTotalNeto || 0,
        iva: calculatedIva || 0,
        total_orden: calculatedTotalOrden || 0,
        multiplicar_valor_unitario: Boolean(alternativa.multiplicar_valor)
      }));
  
      // Set edit mode and open modal
      setEditandoAlternativa(alternativaId);
      setModoEdicion(true);
      setOpenModal(true);
  
    } catch (error) {
      console.error('Error al cargar alternativa para editar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la alternativa para editar'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEdicion = async () => {
    try {
      setLoading(true);
  
      // Function to clean numeric values
      const cleanNumericValue = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        return Number(value);
      };

      // Filter and format calendar data consistent with creation
      const calendarData = nuevaAlternativa.cantidades && nuevaAlternativa.cantidades.length > 0
        ? nuevaAlternativa.cantidades
            .filter(item => item.cantidad && item.cantidad > 0)
            .map(item => ({
              dia: item.dia.toString().padStart(2, '0'),
              cantidad: parseInt(item.cantidad)
            }))
        : null;
  
      // Prepare data for update, only including valid table columns
      const datosActualizacion = {
        nlinea: cleanNumericValue(nuevaAlternativa.nlinea),
        anio: nuevaAlternativa.anio,
        mes: nuevaAlternativa.mes,
        id_campania: nuevaAlternativa.id_campania,
        num_contrato: cleanNumericValue(nuevaAlternativa.num_contrato),
        id_soporte: cleanNumericValue(nuevaAlternativa.id_soporte),
        descripcion: nuevaAlternativa.descripcion || null,
        id_programa: cleanNumericValue(nuevaAlternativa.id_programa),
        tipo_item: nuevaAlternativa.tipo_item,
        id_clasificacion: cleanNumericValue(nuevaAlternativa.id_clasificacion),
        detalle: nuevaAlternativa.detalle || null,
        id_tema: cleanNumericValue(nuevaAlternativa.id_tema),
        segundos: cleanNumericValue(nuevaAlternativa.segundos),
        total_neto: cleanNumericValue(nuevaAlternativa.total_neto),
        descuento_pl: cleanNumericValue(nuevaAlternativa.descuento_plan),
        recargo_plan: cleanNumericValue(nuevaAlternativa.recargo_plan),
        valor_unitario: cleanNumericValue(nuevaAlternativa.valor_unitario),
        medio: cleanNumericValue(nuevaAlternativa.id_medio),
        total_bruto: cleanNumericValue(nuevaAlternativa.total_bruto),
        multiplicar_valor: Boolean(nuevaAlternativa.multiplicar_valor_unitario),
        calendar: calendarData
      };
  
      // Remove any undefined or null properties
      Object.keys(datosActualizacion).forEach(key => {
        if (datosActualizacion[key] === undefined) {
          delete datosActualizacion[key];
        }
      });
  
      // Update the alternative
      const { error: updateError } = await supabase
      .from('alternativa')
      .update(datosActualizacion)
      .eq('id', editandoAlternativa);

    if (updateError) throw updateError;

    // Refresh the alternatives list
    await fetchAlternativas();
    
    // Close modal and reset states
    setOpenModal(false);
    setModoEdicion(false);
    setEditandoAlternativa(null);
    
    // Reset nueva alternativa state
    setNuevaAlternativa({
      nlinea: '',
      numerorden: nextNumeroOrden,
      anio: planData?.anio || '',
      mes: planData?.mes || '',
      // ... rest of the initial state
    });

    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: 'Alternativa actualizada correctamente'
    });
  } catch (error) {
    // ... existing error handling ...
  } finally {
    setLoading(false);
  }
};

  const handleOpenContratosModal = () => {
    setOpenContratosModal(true);
    handleSearchContrato(); // Actualizar la lista después de agregar
  };

  const handleCloseContratosModal = () => {
    setOpenContratosModal(false);
    setSearchContrato('');
  };

  const handleSeleccionarContrato = async (contrato) => {
    if (!contrato || !contrato.id) {
      console.error('Contrato inválido:', contrato);
      return;
    }

    // Validar rango de expiración respecto al periodo de la alternativa
    try {
      const periodoFin = (nuevaAlternativa.anio && nuevaAlternativa.mes)
        ? new Date(nuevaAlternativa.anio, nuevaAlternativa.mes, 0)
        : null;
      const expira = contrato.FechaTermino ? new Date(contrato.FechaTermino) : null;
      if (periodoFin && expira && expira < periodoFin) {
        await Swal.fire({
          icon: 'warning',
          title: 'Contrato fuera de rango',
          text: `El contrato expira el ${expira.toLocaleDateString()} y es anterior al periodo seleccionado.`,
        });
        return;
      }
    } catch (e) {
      console.warn('Validación de expiración fallida:', e);
    }

    // Asegurarnos de que el contrato tenga la estructura correcta con el proveedor
    const contratoCompleto = {
      ...contrato,
      proveedor: contrato.proveedor || { 
        id_proveedor: contrato.IdProveedor,
        nombreProveedor: contrato.proveedor?.nombreProveedor 
      }
    };

    setContratoSeleccionado(contratoCompleto);
    
    setNuevaAlternativa(prev => ({
      ...prev,
      num_contrato: contrato.id,
      id_contrato: contrato.id, // Agregar esta línea para habilitar el modal de clasificación
      // Limpiar los montos
      valor_unitario: '',
      descuento_plan: '',
      recargo_plan: '',
      total_bruto: '',
      total_neto: '',
      iva: '',
      total_orden: '',
      // Limpiar el calendario
      cantidades: [],
      // Establecer la forma de pago del contrato
      formaDePago: contrato.formaPago?.id || '',
      nombreFormaPago: contrato.formaPago?.NombreFormadePago || '',
      // Establecer el medio del contrato
      id_medio: contrato.medio?.id || contrato.IdMedios || '',
      nombreMedio: contrato.medio?.NombredelMedio || '',
      Medios: contrato.medio || null
    }));
    
    try {
      // Cargar soportes del proveedor
      const { data: proveedorSoportes, error: soportesError } = await supabase
        .from('proveedor_soporte')
        .select(`
          id_soporte,
          Soportes!inner (
            id_soporte,
            nombreIdentficiador,
            bonificacion_ano,
            escala,
            soporte_medios!inner (
              Medios!inner (
                id,
                NombredelMedio
              )
            )
          )
        `)
        .eq('id_proveedor', contrato.IdProveedor);

      if (soportesError) throw soportesError;

      const soportesFiltrados = proveedorSoportes
        .filter(item => item.Soportes)
        .map(item => {
          const medios = item.Soportes.soporte_medios
            ? item.Soportes.soporte_medios
                .map(sm => sm.Medios.NombredelMedio)
                .join(', ')
            : '';
          
          // Agregar el id_medio para facilitar el filtrado
          const id_medio = item.Soportes.soporte_medios && 
                          item.Soportes.soporte_medios.length > 0 ? 
                          item.Soportes.soporte_medios[0].Medios.id : null;
          
          return {
            id_soporte: item.Soportes.id_soporte,
            nombreIdentficiador: item.Soportes.nombreIdentficiador,
            Medios: medios,
            id_medio: id_medio,
            bonificacion_ano: item.Soportes.bonificacion_ano,
            escala: item.Soportes.escala
          };
        });

      setAllSoportes(soportesFiltrados);
      
      // Si el contrato tiene un medio asociado, filtrar los soportes por ese medio
      if (contrato.medio && contrato.medio.id) {
        const soportesPorMedio = soportesFiltrados.filter(soporte => 
          soporte.Medios.includes(contrato.medio.NombredelMedio)
        );
        setSoportes(soportesPorMedio);
      } else {
        setSoportes(soportesFiltrados);
      }
      
      setSoportesFiltrados([]);
      
      // NUEVO: Cargar clasificaciones filtradas por el medio del contrato
      try {
        setLoadingClasificaciones(true);
        
        // Obtener el IdMedios del contrato
        const medioId = contrato.IdMedios || (contrato.medio ? contrato.medio.id : null);
        
        if (!medioId) {
        setClasificacionesList([]);
      } else {
          // Obtener clasificaciones que coincidan con el medio del contrato
          const { data: clasificacionesData, error: clasificacionesError } = await supabase
            .from('Clasificacion')
            .select('*')
            .eq('IdMedios', medioId);
          
          if (clasificacionesError) throw clasificacionesError;
        
        setClasificacionesList(clasificacionesData || []);
      }
      } catch (errorClasificaciones) {
        console.error('Error al cargar clasificaciones:', errorClasificaciones);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las clasificaciones'
        });
        setClasificacionesList([]);
      } finally {
        setLoadingClasificaciones(false);
      }
      
    } catch (error) {
      console.error('Error al obtener soportes del proveedor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los soportes del proveedor'
      });
    }
    setOpenContratosModal(false);
  };

  const handleSearchContrato = async () => {
    setLoadingContratos(true);
    try {
      const { data, error } = await supabase
        .from('Contratos')
        .select(`
          *,
          cliente:IdCliente(nombreCliente),
          proveedor:IdProveedor(nombreProveedor),
          medio:IdMedios(NombredelMedio),
          formaPago:id_FormadePago(
            id,
            NombreFormadePago
          )
        `)
        .eq('IdCliente', clienteId)
        .ilike('NombreContrato', `%${searchContrato}%`);

      if (error) throw error;
      setContratosFiltrados(data || []);
    } catch (error) {
      console.error('Error al buscar contratos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al buscar contratos'
      });
    } finally {
      setLoadingContratos(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      handleSearchContrato();
    }
  }, [clienteId, searchContrato]);

  useEffect(() => {
    if (!openContratosModal) {
      setSearchContrato('');
    }
  }, [openContratosModal]);

  const handleAgregarContrato = () => {
    Swal.fire({
      title: 'Función en desarrollo',
      text: 'La funcionalidad de agregar contratos estará disponible próximamente',
      icon: 'info'
    });
  };

  const handleActualizarContrato = (contrato) => {
    Swal.fire({
      title: 'Función en desarrollo',
      text: 'La funcionalidad de actualizar contratos estará disponible próximamente',
      icon: 'info'
    });
  };

  const handleEliminarContrato = (contrato) => {
    Swal.fire({
      title: 'Función en desarrollo',
      text: 'La funcionalidad de eliminar contratos estará disponible próximamente',
      icon: 'info'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Vigente':
        return 'success.main';
      case 'Consumido':
        return 'warning.main';
      case 'Anulado':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const handleOpenTemasModal = () => {
    if (!contratoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato'
      });
      return;
    }
  
    // Get medium info with fallbacks
    const medioId = contratoSeleccionado.medio?.id || 
                   contratoSeleccionado.IdMedios || 
                   nuevaAlternativa.id_medio;
  
    const medioNombre = contratoSeleccionado.medio?.NombredelMedio || 
                       nuevaAlternativa.nombreMedio || 
                       contratoSeleccionado.medio?.NombredelMedio;

    // Update the alternative with complete media information
    setNuevaAlternativa(prev => ({
      ...prev,
      id_medio: medioId,
      nombreMedio: medioNombre,
      Medios: {
        id: medioId,
        NombredelMedio: medioNombre
      }
    }));
  
    setOpenTemasModal(true);
    fetchTemasFiltrados();
  };

  const handleCloseTemasModal = () => {
    setOpenTemasModal(false);
    setSearchTema('');
  };

  const handleSeleccionarTema = (tema) => {
    setTemaSeleccionado(tema);
    setNuevaAlternativa(prev => ({ 
      ...prev, 
      id_tema: tema.id_tema,
      segundos: tema.duracion || '',
      id_medio: tema.id_medio || null
    }));
    handleCloseTemasModal();
  };

  const fetchTemasFiltrados = async () => {
    if (!campaniaId) return;
    
    setLoadingTemas(true);
    try {
      // Get the media ID from the selected contract
      const medioId = contratoSeleccionado?.IdMedios; // Changed from medio.id to IdMedios
  
      const { data, error } = await supabase
        .from('campania_temas')
        .select(`
          id_temas,
          Temas!inner (
            id_tema,
            NombreTema,
            Duracion,
            id_medio,
            Medios:id_medio (
              id,
              NombredelMedio
            )
          )
        `)
        .eq('id_campania', campaniaId);
  
      if (error) throw error;
  
      const temasFormateados = data?.map(item => ({
        ...item.Temas,
        id_tema: item.id_temas,
        nombre_tema: item.Temas.NombreTema,
        duracion: item.Temas.Duracion,
        descripcion: item.Temas.descripcion,
        estado: item.Temas.estado,
        Calidad: item.Temas.Calidad ? {
          id_calidad: item.Temas.Calidad.id,
          NombreCalidad: item.Temas.Calidad.NombreCalidad
        } : null,
        Medios: item.Temas.Medios ? {
          id_medio: item.Temas.Medios.id,
          NombredelMedio: item.Temas.Medios.NombredelMedio
        } : null
      }))
      .filter(tema => {
        const matchesSearch = 
          tema.nombre_tema?.toLowerCase().includes(searchTema.toLowerCase()) ||
          tema.descripcion?.toLowerCase().includes(searchTema.toLowerCase());
        
        // Updated media matching logic
        const matchesMedia = medioId && tema.Medios?.id_medio === medioId;
  
        return matchesSearch && matchesMedia;
      }) || [];
  
      setTemasFiltrados(temasFormateados);
    } catch (error) {
      console.error('Error al obtener temas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los temas'
      });
    } finally {
      setLoadingTemas(false);
    }
  };

  useEffect(() => {
    if (campaniaId && openTemasModal) {
      fetchTemasFiltrados();
    }
  }, [campaniaId, searchTema, openTemasModal, contratoSeleccionado?.medio?.id]);

  const formatDuracion = (segundos) => {
    if (!segundos) return '-';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const handleSearchSoporte = (searchTerm) => {
    setSearchSoporte(searchTerm);
    
    if (!searchTerm.trim()) {
      // Si la búsqueda está vacía, mostrar todos los soportes que coincidan con el medio del contrato
      if (contratoSeleccionado && contratoSeleccionado.medio) {
        const filteredSoportes = allSoportes.filter(soporte => 
          soporte.Medios.includes(contratoSeleccionado.medio.NombredelMedio)
        );
        setSoportes(filteredSoportes);
        setSoportesFiltrados([]);
      } else {
        setSoportes(allSoportes);
        setSoportesFiltrados([]);
      }
      return;
    }

    // Filtrar basado en el término de búsqueda
    let filtrados = allSoportes.filter(soporte =>
      soporte.nombreIdentficiador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.Medios.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(soporte.id_soporte).includes(searchTerm)
    );
    
    // Filtro adicional por medio si hay un contrato seleccionado
    if (contratoSeleccionado && contratoSeleccionado.medio) {
      filtrados = filtrados.filter(soporte => 
        soporte.Medios.includes(contratoSeleccionado.medio.NombredelMedio)
      );
    }

    setSoportesFiltrados(filtrados);
  };

  const handleOpenSoportesModal = () => {
    if (!contratoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato'
      });
      return;
    }
    
    setOpenSoportesModal(true);
    
    // Filtrar soportes basados en el medio del contrato seleccionado
    if (contratoSeleccionado && contratoSeleccionado.medio) {
      const filteredSoportes = allSoportes.filter(soporte => 
        soporte.Medios.includes(contratoSeleccionado.medio.NombredelMedio)
      );
      
      setSoportes(filteredSoportes);
      setSoportesFiltrados([]);
    }
  };

  const handleCloseSoportesModal = () => {
    setOpenSoportesModal(false);
    setSearchSoporte('');
  };

  const handleSeleccionarSoporte = (soporte) => {
    setSelectedSoporte(soporte);
    setNuevaAlternativa(prev => ({
      ...prev,
      id_soporte: soporte.id_soporte,
      soporte: soporte.nombreIdentficiador,
      bonificacion_ano: soporte.bonificacion_ano,
      escala: soporte.escala
    }));
    setOpenSoportesModal(false);
  };

  const handleSearchPrograma = async (searchValue) => {
    if (!nuevaAlternativa.id_soporte) {
      setProgramasFiltrados([]);
      return;
    }
    
    setLoadingProgramas(true);
    try {
      const { data, error } = await supabase
        .from('Programas')
        .select('*')
        .eq('soporte_id', nuevaAlternativa.id_soporte)
        .eq('estado', true)  // Solo programas activos
        .ilike('descripcion', `%${searchValue}%`)
        .order('descripcion', { ascending: true });

      if (error) throw error;

      setProgramasFiltrados(data || []);
    } catch (error) {
      console.error('Error al buscar programas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al buscar programas'
      });
      setProgramasFiltrados([]);
    } finally {
      setLoadingProgramas(false);
    }
  };

  const handleOpenProgramasModal = () => {
    if (!nuevaAlternativa.id_soporte) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un soporte'
      });
      return;
    }
    setOpenProgramasModal(true);
    handleSearchPrograma('');
  };

  const handleCloseProgramasModal = () => {
    setOpenProgramasModal(false);
    setSearchPrograma('');
  };

  const handleSeleccionarPrograma = (programa) => {
    setSelectedPrograma(programa);
    setNuevaAlternativa(prev => ({
      ...prev,
      id_programa: programa.id
    }));
    handleCloseProgramasModal();
  };
  const handleSearchClasificacion = async (searchTerm) => {
    try {
      setLoadingClasificaciones(true);
      setSearchClasificacion(searchTerm);
      
      if (!nuevaAlternativa.num_contrato) {
        setClasificacionesList([]);
        return;
      }
      
      // Primero obtenemos el contrato para saber su IdMedios
      const { data: contratoData, error: contratoError } = await supabase
        .from('Contratos')
        .select('IdMedios')
        .eq('id', nuevaAlternativa.num_contrato)
        .single();
      
      if (contratoError) throw contratoError;
      
      if (!contratoData || !contratoData.IdMedios) {
        setClasificacionesList([]);
        return;
      }
      
      let query = supabase
        .from('Clasificacion')
        .select('*')
        .eq('IdMedios', contratoData.IdMedios);
      
      if (searchTerm) {
        query = query.ilike('NombreClasificacion', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setClasificacionesList(data || []);
    } catch (error) {
      console.error('Error al buscar clasificaciones:', error);
      setClasificacionesList([]);
    } finally {
      setLoadingClasificaciones(false);
    }
  };

  const handleOpenClasificacionModal = () => {
    if (!nuevaAlternativa.id_contrato) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato'
      });
      return;
    }
    setOpenClasificacionModal(true);
    handleSearchClasificacion('');
  };

  const handleCloseClasificacionModal = () => {
    setOpenClasificacionModal(false);
    setSearchClasificacion('');
  };

  const handleSeleccionarClasificacion = (clasificacion) => {
    setSelectedClasificacion(clasificacion);
    setNuevaAlternativa(prev => ({
      ...prev,
      id_clasificacion: clasificacion.id
    }));
    handleCloseClasificacionModal();
  };

  const handleOpenAddEditClasificacionModal = (clasificacion = null) => {
    if (clasificacion) {
      setEditingClasificacion(clasificacion);
      setNuevaClasificacion({
        NombreClasificacion: clasificacion.NombreClasificacion,
        id_contrato: clasificacion.id_contrato
      });
    } else {
      setEditingClasificacion(null);
      setNuevaClasificacion({
        NombreClasificacion: '',
        id_contrato: nuevaAlternativa.id_contrato
      });
    }
    setOpenAddEditClasificacionModal(true);
  };

  const handleCloseAddEditClasificacionModal = () => {
    setOpenAddEditClasificacionModal(false);
    setEditingClasificacion(null);
    setNuevaClasificacion({
      NombreClasificacion: '',
      id_contrato: ''
    });
  };

  const handleSaveClasificacion = async () => {
    try {
      if (!nuevaClasificacion.NombreClasificacion) {
        Swal.fire({
          icon: 'warning',
          title: 'Atención',
          text: 'El nombre de la clasificación es obligatorio'
        });
        return;
      }

      // Obtener el IdMedios del contrato seleccionado
      const medioId = contratoSeleccionado?.IdMedios || 
                     (contratoSeleccionado?.medio ? contratoSeleccionado.medio.id : null);
      
      if (!medioId) {
        Swal.fire({
          icon: 'warning',
          title: 'Atención',
          text: 'No se pudo identificar el medio del contrato'
        });
        return;
      }

      const clasificacionData = {
        NombreClasificacion: nuevaClasificacion.NombreClasificacion,
        IdMedios: medioId  // Usar IdMedios en lugar de id_contrato
      };

      let response;
      if (editingClasificacion) {
        // Actualizar clasificación existente
        response = await supabase
          .from('Clasificacion')
          .update(clasificacionData)
          .eq('id', editingClasificacion.id);
      } else {
        // Insertar nueva clasificación
        response = await supabase
          .from('Clasificacion')
          .insert([clasificacionData]);
      }

      if (response.error) throw response.error;

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: editingClasificacion 
          ? 'Clasificación actualizada correctamente' 
          : 'Clasificación agregada correctamente'
      });

      // Limpiar el formulario y cerrar el modal
      setNuevaClasificacion({
        NombreClasificacion: '',
        IdMedios: ''
      });
      setEditingClasificacion(null);
      setOpenAddEditClasificacionModal(false);

      // Actualizar la lista de clasificaciones
      if (contratoSeleccionado) {
        fetchClasificacionesByContrato(contratoSeleccionado.id);
      }
    } catch (error) {
      console.error('Error al guardar clasificación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al guardar la clasificación: ${error.message}`
      });
    }
  };

  const handleOpenAddTemaModal = () => {
    if (!contratoSeleccionado?.IdMedios) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero debe seleccionar un contrato con medio asociado'
      });
      return;
    }
    setOpenAddTemaModal(true);
  };

  const handleCloseAddTemaModal = () => {
    setOpenAddTemaModal(false);
  };

  const handleTemaAdded = () => {
    fetchTemasFiltrados();
    handleCloseAddTemaModal();
  };

  const loadSoportesParaPrograma = async () => {
    try {
      const { data: soportes, error } = await supabase
        .from('Soportes')
        .select('id_soporte, nombreIdentficiador');
      
      if (error) throw error;
      setSoportesParaPrograma(soportes);
    } catch (error) {
      console.error('Error al cargar soportes:', error);
    }
  };

  const handleOpenAddEditProgramaModal = async (programa = null) => {
    await loadSoportesParaPrograma();
    if (programa) {
      setEditingPrograma(programa);
      setNewPrograma({
        descripcion: programa.descripcion,
        hora_inicio: programa.hora_inicio,
        hora_fin: programa.hora_fin,
        cod_prog_megatime: programa.cod_prog_megatime,
        codigo_programa: programa.codigo_programa,
        soporte_id: programa.soporte_id
      });
    } else {
      setEditingPrograma(null);
      setNewPrograma({
        descripcion: '',
        hora_inicio: '',
        hora_fin: '',
        cod_prog_megatime: '',
        codigo_programa: '',
        soporte_id: ''
      });
    }
    setOpenAddEditProgramaModal(true);
  };

  const handleCloseAddEditProgramaModal = () => {
    setOpenAddEditProgramaModal(false);
    setEditingPrograma(null);
    setNewPrograma({
      descripcion: '',
      hora_inicio: '',
      hora_fin: '',
      cod_prog_megatime: '',
      codigo_programa: '',
      soporte_id: ''
    });
    // Restaurar los soportes originales al cerrar
    setSoportes(allSoportes);
    setSoportesFiltrados([]);
  };

  const handleSavePrograma = async () => {
    // Validaciones existentes
    if (!newPrograma.descripcion) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'La descripción del programa es obligatoria'
      });
      return;
    }
  
    try {
      setLoading(true);
      
      // Obtener el último valor numérico de cod_prog_megatime
      let nextCodProgMegatime = 3998; // Valor base por defecto
      
      // Consulta para obtener el último valor numérico
      const { data: ultimosProgMegatime, error: errorConsulta } = await supabase
        .from('Programas')
        .select('cod_prog_megatime')
        .not('cod_prog_megatime', 'is', null)
        .not('cod_prog_megatime', 'eq', '')
        .order('created_at', { ascending: false }) // Ordenar por fecha de creación para obtener el más reciente
        .limit(100); // Obtener varios para asegurar encontrar valores numéricos
      
      if (errorConsulta) {
        console.error('Error al consultar últimos códigos:', errorConsulta);
      } else if (ultimosProgMegatime && ultimosProgMegatime.length > 0) {
        // Filtrar solo los valores numéricos y encontrar el máximo
        const codigosNumericos = ultimosProgMegatime
          .map(prog => prog.cod_prog_megatime)
          .filter(codigo => !isNaN(parseInt(codigo)))
          .map(codigo => parseInt(codigo));
        
        if (codigosNumericos.length > 0) {
          const maxCodigo = Math.max(...codigosNumericos);
          nextCodProgMegatime = maxCodigo + 1;
        }
      }
      
      // Preparar datos del programa
      const programaData = {
        descripcion: newPrograma.descripcion,
        hora_inicio: newPrograma.hora_inicio,
        hora_fin: newPrograma.hora_fin,
        codigo_programa: newPrograma.codigo_programa || '',
        soporte_id: selectedSoporte.id_soporte,
        estado: true
      };
      
      // Solo asignar nuevo código si es un nuevo programa, no en edición
      if (!editingPrograma) {
        programaData.cod_prog_megatime = nextCodProgMegatime.toString();
      } else if (editingPrograma && !editingPrograma.cod_prog_megatime) {
        // Si estamos editando un programa sin código, asignarle uno nuevo
        programaData.cod_prog_megatime = nextCodProgMegatime.toString();
      } else if (editingPrograma) {
        // Mantener el código original si existe
        programaData.cod_prog_megatime = editingPrograma.cod_prog_megatime;
      }
      
      let response;
      
      if (editingPrograma) {
        // Actualizar programa existente
        const { data, error } = await supabase
          .from('Programas')
          .update(programaData)
          .eq('id', editingPrograma.id)
          .select();
          
        if (error) throw error;
        response = data;
      } else {
        // Insertar nuevo programa
        const { data, error } = await supabase
          .from('Programas')
          .insert([programaData])
          .select();
          
        if (error) throw error;
        response = data;
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: editingPrograma ? 'Programa actualizado correctamente' : 'Programa agregado correctamente'
      });
      
      // Cerrar el modal y limpiar el formulario
      setOpenAddEditProgramaModal(false);
      setNewPrograma({
        descripcion: '',
        hora_inicio: '',
        hora_inicio_hora: '00',
        hora_inicio_min: '00',
        hora_fin: '',
        hora_fin_hora: '00',
        hora_fin_min: '00',
        cod_prog_megatime: '',
        codigo_programa: '',
        soporte_id: selectedSoporte?.id_soporte || ''
      });
      setEditingPrograma(null);
      
      // Actualizar la lista de programas
      if (selectedSoporte) {
        // Consulta para obtener la lista actualizada
        const { data: programasActualizados, error: errorProgramas } = await supabase
          .from('Programas')
          .select('*')
          .eq('soporte_id', selectedSoporte.id_soporte)
          .eq('estado', true)
          .order('descripcion', { ascending: true });
        
        if (!errorProgramas) {
          setProgramas(programasActualizados || []);
          
          // Actualizar también la lista filtrada
          if (searchPrograma) {
            const filtrados = programasActualizados.filter(programa => 
              programa.descripcion.toLowerCase().includes(searchPrograma.toLowerCase())
            );
            setProgramasFiltrados(filtrados);
          } else {
            setProgramasFiltrados(programasActualizados || []);
          }
        }
      }
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Error al guardar el programa: ${error.message || JSON.stringify(error)}`
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/planificacion')}
          >
            Volver a Planificación
          </Button>
        </Paper>
      </Container>
    );
  }

  const getDiasDelMes = (anio, mes) => {
    if (!anio || !mes) return [];
    
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const dias = [];
    
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(anio, mes - 1, i);
      const nombreDia = diasSemana[fecha.getDay()];
      dias.push({
        dia: i.toString().padStart(2, '0'),
        nombreDia,
        fecha: fecha.toISOString().split('T')[0]
      });
    }
    
    return dias;
  };

  const calcularTarifas = (valores) => {
    const valorUnitario = parseFloat(valores.valor_unitario) || 0;
    const descuento = parseFloat(valores.descuento_plan) || 0;
    const recargo = parseFloat(valores.recargo_plan) || 0;
    const IVA = 19;
    
    const valorConIVA = valorUnitario * (1 + (IVA / 100));
    const tarifaBruta = valorConIVA * (1 + (recargo / 100));
    const tarifaNeta = tarifaBruta * (1 - (descuento / 100));

    const cantidadTotal = nuevaAlternativa.cantidades.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
    
    const totalGeneralBruto = tarifaBruta * cantidadTotal;
    const totalGeneralNeto = tarifaNeta * cantidadTotal;

    return {
      tarifa_bruta: tarifaBruta.toFixed(2),
      tarifa_neta: tarifaNeta.toFixed(2),
      total_bruto: totalGeneralBruto.toFixed(2),
      total_general: totalGeneralBruto.toFixed(2),
      total_neto: totalGeneralNeto.toFixed(2)
    };
  };

  const handleMontoChange = (campo, valor) => {
    setNuevaAlternativa(prev => {
      const tipoGeneracionOrden = contratoSeleccionado?.id_GeneraracionOrdenTipo || 1;
      const valorNumerico = Number(valor) || 0;
      
      // Crear una copia del estado anterior
      const updated = { ...prev };
      
      // Actualizar el campo específico con el nuevo valor
      updated[campo] = valorNumerico;
      
      // Obtener los valores actuales para los cálculos
      const valorUnitario = campo === 'valor_unitario' ? valorNumerico : Number(prev.valor_unitario) || 0;
      const descuento = campo === 'descuento_plan' ? valorNumerico : Number(prev.descuento_plan) || 0;
      const recargo = campo === 'recargo_plan' ? valorNumerico : Number(prev.recargo_plan) || 0;
      
      let totalBruto = 0;
      let totalNeto = 0;
      const sourceCantidadesArray = Object.keys(cantidadesRef.current).length > 0
        ? Object.entries(cantidadesRef.current)
            .filter(([, c]) => c !== '' && c !== null && c !== undefined)
            .map(([d, c]) => ({ dia: d, cantidad: c }))
        : prev.cantidades;
      const totalCantidades = sourceCantidadesArray.reduce((sum, item) => {
        return sum + (Number(item.cantidad) || 0);
      }, 0);
      
      const multiplicador = prev.multiplicar_valor_unitario ? (totalCantidades > 0 ? totalCantidades : 1) : 1;
      
      if (tipoGeneracionOrden === 1) { // Neto
        // Calcular el total neto base (sin descuentos/recargos)
        const totalNetoBase = valorUnitario * multiplicador;
        
        // Aplicar descuento si existe
        let totalConDescuento = totalNetoBase;
        if (descuento > 0) {
          totalConDescuento = totalNetoBase - (totalNetoBase * (descuento / 100));
        }
        
        // Aplicar recargo si existe
        if (recargo > 0) {
          totalNeto = totalConDescuento + (totalConDescuento * (recargo / 100));
        } else {
          totalNeto = totalConDescuento;
        }
        
        // Calcular el total bruto a partir del neto
        totalBruto = Math.round(totalNeto / 0.85);
      } else { // Bruto
        // Calcular el total bruto base (sin descuentos/recargos)
        const totalBrutoBase = valorUnitario * multiplicador;
        
        // Aplicar descuento si existe
        let totalConDescuento = totalBrutoBase;
        if (descuento > 0) {
          totalConDescuento = totalBrutoBase - (totalBrutoBase * (descuento / 100));
        }
        
        // Aplicar recargo si existe
        if (recargo > 0) {
          totalBruto = totalConDescuento + (totalConDescuento * (recargo / 100));
        } else {
          totalBruto = totalConDescuento;
        }
        
        // Calcular el total neto a partir del bruto
        totalNeto = Math.round(totalBruto * 0.85);
      }
      
      // Calcular IVA y total orden
      const iva = Math.round(totalNeto * 0.19);
      const totalOrden = totalNeto + iva;
      
      const result = {
        ...updated,
        total_bruto: Math.round(totalBruto),
        total_neto: Math.round(totalNeto),
        iva: Math.round(iva),
        total_orden: Math.round(totalOrden)
      };
      if (campo === 'valor_unitario') {
        result.cantidades = sourceCantidadesArray;
      }
      return result;
    });
  };

  const handleCantidadChange = (dia, valor) => {
    setNuevaAlternativa(prev => {
      // Crear una copia del array de cantidades
      const cantidadesActualizadas = [...prev.cantidades];
      
      // Buscar si ya existe una entrada para este día
      const index = cantidadesActualizadas.findIndex(item => item.dia === dia);
      
      if (index !== -1) {
        // Actualizar la cantidad existente
        cantidadesActualizadas[index] = {
          ...cantidadesActualizadas[index],
          cantidad: valor
        };
      } else {
        // Agregar nueva cantidad
        cantidadesActualizadas.push({
          dia,
          cantidad: valor
        });
      }
      
      // Si autoFillCantidades está activado, rellenar todas las casillas siguientes
      if (autoFillCantidades && valor !== '') {
        // Convertir el día actual a número para comparar
        const diaActual = parseInt(dia, 10);
        
        // Rellenar todas las casillas siguientes con el mismo valor
        for (let i = diaActual + 1; i <= 31; i++) {
          const diaSiguiente = i.toString().padStart(2, '0');
          const indexSiguiente = cantidadesActualizadas.findIndex(item => item.dia === diaSiguiente);
          
          if (indexSiguiente !== -1) {
            // Actualizar cantidad existente
            cantidadesActualizadas[indexSiguiente] = {
              ...cantidadesActualizadas[indexSiguiente],
              cantidad: valor
            };
          } else {
            // Agregar nueva cantidad
            cantidadesActualizadas.push({
              dia: diaSiguiente,
              cantidad: valor
            });
          }
        }
      }
      
      // Obtener valores actuales para recalcular
      const valorUnitario = Number(prev.valor_unitario) || 0;
      const descuento = Number(prev.descuento_plan) || 0;
      const recargo = Number(prev.recargo_plan) || 0;
      const tipoGeneracionOrden = contratoSeleccionado?.id_GeneraracionOrdenTipo || 1;
      
      // Calcular el total de cantidades
      const totalCantidades = cantidadesActualizadas.reduce((sum, item) => {
        return sum + (Number(item.cantidad) || 0);
      }, 0);
      
      const multiplicador = prev.multiplicar_valor_unitario ? (totalCantidades > 0 ? totalCantidades : 1) : 1;
      
      let totalBruto = 0;
      let totalNeto = 0;
      
      if (tipoGeneracionOrden === 1) { // Neto
        // Calcular el total neto base (sin descuentos/recargos)
        const totalNetoBase = valorUnitario * multiplicador;
        
        // Aplicar descuento si existe
        let totalConDescuento = totalNetoBase;
        if (descuento > 0) {
          totalConDescuento = totalNetoBase - (totalNetoBase * (descuento / 100));
        }
        
        // Aplicar recargo si existe
        if (recargo > 0) {
          totalNeto = totalConDescuento + (totalConDescuento * (recargo / 100));
        } else {
          totalNeto = totalConDescuento;
        }
        
        // Calcular el total bruto a partir del neto
        totalBruto = Math.round(totalNeto / 0.85);
      } else { // Bruto
        // Calcular el total bruto base (sin descuentos/recargos)
        const totalBrutoBase = valorUnitario * multiplicador;
        
        // Aplicar descuento si existe
        let totalConDescuento = totalBrutoBase;
        if (descuento > 0) {
          totalConDescuento = totalBrutoBase - (totalBrutoBase * (descuento / 100));
        }
        
        // Aplicar recargo si existe
        if (recargo > 0) {
          totalBruto = totalConDescuento + (totalConDescuento * (recargo / 100));
        } else {
          totalBruto = totalConDescuento;
        }
        
        // Calcular el total neto a partir del bruto
        totalNeto = Math.round(totalBruto * 0.85);
      }
      
      // Calcular IVA y total orden
      const iva = Math.round(totalNeto * 0.19);
      const totalOrden = totalNeto + iva;
      
      return {
        ...prev,
        cantidades: cantidadesActualizadas,
        total_bruto: Math.round(totalBruto),
        total_neto: Math.round(totalNeto),
        iva: Math.round(iva),
        total_orden: Math.round(totalOrden)
      };
    });
  };
  const handleLimpiarCantidades = () => {
    cantidadesRef.current = {};
    setNuevaAlternativa(prev => ({
      ...prev,
      cantidades: [],
      total_bruto: 0,
      total_neto: 0,
      iva: 0,
      total_orden: 0
    }));
  };
  const handleActualizar = () => {
    const currentVU = nuevaAlternativa?.valor_unitario || 0;
    handleMontoChange('valor_unitario', currentVU);
  };
  const CalendarioAlternativa = ({ anio, mes, cantidades = [], onChange, cantidadesRef, autoFillCantidades }) => {
    const inputRefs = useRef({});
    const [focusedDia, setFocusedDia] = useState(null);
    const dias = getDiasDelMes(anio, mes);
    
    const getCantidad = (dia) => {
      const fromRef = cantidadesRef?.current?.[dia];
      if (fromRef !== undefined) return String(fromRef ?? '');
      const item = Array.isArray(cantidades) ? cantidades.find(c => c.dia === dia) : null;
      return item ? String(item.cantidad ?? '') : '';
    };

    const calcularTotal = () => { 
      // Array con el número de días de cada mes (índice 0 = enero, 1 = febrero, etc.)
      const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      
      // Obtener el mes (restando 1 porque en JavaScript los meses van de 0 a 11)
      const mes = (planData?.mes || nuevaAlternativa.mes) - 1;
      const anio = planData?.anio || nuevaAlternativa.anio;
      
      // Ajustar febrero en años bisiestos
      if (mes === 1 && ((anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0)) {
        diasPorMes[1] = 29;
      }
      
      // Número de días en el mes actual
      const diasEnMes = diasPorMes[mes];
      
      // Filtrar las cantidades para incluir solo los días válidos
      const cantidadesValidas = (Array.isArray(cantidades) ? cantidades : []).filter((item, index) => index < diasEnMes);
      
      const total = cantidadesValidas.reduce((sum, item) => { 
        const cantidad = parseInt(item.cantidad) || 0; 
        return sum + cantidad; 
      }, 0); 
      
      return total;
    };
    
    return (
      <Box sx={{ mt: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
  <Typography variant="h6">Calendario de Cantidades</Typography>
  <Box display="flex" alignItems="center">
    <FormControlLabel
      control={
        <Checkbox
          checked={autoFillCantidades}
          onChange={(e) => setAutoFillCantidades(e.target.checked)}
          color="primary"
        />
      }
      label="Rellenar automáticamente todas las casillas"
    />
    <Button 
      variant="outlined" 
      color="secondary" 
      size="small" 
      onClick={handleLimpiarCantidades}
      sx={{ ml: 2 }}
    >
      Limpiar
    </Button>
    <Button 
      variant="contained" 
      color="primary" 
      size="small" 
      onClick={handleActualizar}
      sx={{ ml: 1 }}
    >
      Actualizar
    </Button>
  </Box>
</Box>
        
        {/* Calendario usando CSS Grid para mejor compatibilidad con Firefox */}
        <Box sx={{ 
          maxWidth: '100%',
          overflowX: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '4px'
        }}>
          {/* Encabezados */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dias.length}, minmax(30px, 1fr)) 50px`,
            gap: 0,
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0'
          }}>
            {dias.map(({ dia, nombreDia }) => (
              <Box key={dia} sx={{
                padding: '4px 2px',
                textAlign: 'center',
                borderRight: '1px solid #e0e0e0',
                minWidth: '30px',
                maxWidth: '34px'
              }}>
                <Typography variant="caption" sx={{ 
                  fontSize: '0.6rem', 
                  display: 'block', 
                  mb: 0.25, 
                  color: '#666',
                  lineHeight: 0.9
                }}>
                  {nombreDia}
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontSize: '0.65rem', 
                  color: '#333',
                  lineHeight: 0.9,
                  fontWeight: 500
                }}>
                  {dia}
                </Typography>
              </Box>
            ))}
            <Box sx={{
              padding: '4px 2px',
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              minWidth: '50px'
            }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.65rem', 
                color: '#333', 
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                Tot
              </Typography>
            </Box>
          </Box>
          
          {/* Campos de entrada */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dias.length}, minmax(30px, 1fr)) 50px`,
            gap: 0,
            padding: '4px 0'
          }}>
            {dias.map(({ dia }) => (
              <Box key={dia} sx={{
                padding: '2px',
                textAlign: 'center',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <TextField
                  type="text"
                  defaultValue={getCantidad(dia)}
                  onChange={(e) => {
                    const v = (e.target.value || '').replace(/[^0-9]/g, '');
                    if (autoFillCantidades) {
                      const diasAll = getDiasDelMes(anio, mes);
                      diasAll.forEach(({ dia: d }) => {
                        onChange(d, v);
                        const el = inputRefs.current[d];
                        if (el) {
                          el.value = v;
                        }
                      });
                      setFocusedDia(dia);
                    } else {
                      onChange(dia, v);
                    }
                  }}
                  size="small"
                  variant="outlined"
                  onFocus={() => setFocusedDia(dia)}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*'
                  }}
                  InputProps={{
                    inputRef: (el) => { if (el) inputRefs.current[dia] = el; }
                  }}
                  sx={{
                    width: '30px',
                    height: '28px',
                    minWidth: '30px',
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      minHeight: '28px',
                      backgroundColor: '#ffffff',
                      '& fieldset': {
                        border: '1px solid #d0d0d0',
                        borderRadius: '3px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#1976d2'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                        borderWidth: '1px'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '6px 4px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      lineHeight: '1.2',
                      height: 'auto',
                      color: '#333333',
                      backgroundColor: 'transparent',
                      boxSizing: 'border-box',
                      // Ocultar spinners en todos los navegadores
                      '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                        display: 'none'
                      },
                      '&[type=number]': {
                        MozAppearance: 'textfield',
                        appearance: 'textfield'
                      },
                      '&::-moz-focus-inner': {
                        border: 0,
                        padding: 0
                      },
                      '&::placeholder': {
                        color: '#999999',
                        opacity: 1
                      }
                    }
                  }}
                />
              </Box>
            ))}
            <Box sx={{
              padding: '2px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: '50px'
            }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>
                {calcularTotal()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const calcularTotalesGenerales = () => {
    return alternativas.reduce((acc, alt) => ({
      totalBruto: acc.totalBruto + Number(alt.total_bruto || 0),
      totalNeto: acc.totalNeto + Number(alt.total_neto || 0)
    }), { totalBruto: 0, totalNeto: 0 });
  };

  const handleGuardarAlternativa = async () => {

    const errors = {
      contrato: !contratoSeleccionado,
      soporte: !selectedSoporte
    };
    
    setValidationErrors(errors);
    
    // Si hay errores, mostrar mensaje y detener el proceso
    if (errors.contrato || errors.soporte) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Debe seleccionar un Contrato y un Soporte para continuar'
      });
      return;
    }

    try {
      setLoading(true);
  
      if (!planData || !planData.id) {
        throw new Error('No hay un plan seleccionado');
      }
  
      // Function to clean numeric values
      const cleanNumericValue = (value) => {
        if (value === "" || value === null || value === undefined) return null;
        return Number(value);
      };
  
      // Filter calendar data
      const calendarData = nuevaAlternativa.cantidades
        .filter(item => item.cantidad && item.cantidad > 0)
        .map(item => ({
          dia: item.dia.toString().padStart(2, '0'),
          cantidad: parseInt(item.cantidad)
        }));
  
      // Prepare data with proper numeric handling
      const alternativaData = {
        nlinea: cleanNumericValue(nuevaAlternativa.nlinea),
        anio: nuevaAlternativa.anio,
        mes: nuevaAlternativa.mes,
        id_campania: nuevaAlternativa.id_campania,
        num_contrato: cleanNumericValue(nuevaAlternativa.num_contrato),
        id_soporte: cleanNumericValue(nuevaAlternativa.id_soporte),
        descripcion: nuevaAlternativa.descripcion || null,
        tipo_item: nuevaAlternativa.tipo_item,
        id_clasificacion: cleanNumericValue(nuevaAlternativa.id_clasificacion),
        detalle: nuevaAlternativa.detalle || null,
        id_tema: cleanNumericValue(nuevaAlternativa.id_tema),
        segundos: cleanNumericValue(nuevaAlternativa.segundos),
        total_neto: cleanNumericValue(nuevaAlternativa.total_neto),
        descuento_pl: cleanNumericValue(nuevaAlternativa.descuento_plan),
        id_programa: cleanNumericValue(nuevaAlternativa.id_programa),
        recargo_plan: cleanNumericValue(nuevaAlternativa.recargo_plan),
        valor_unitario: cleanNumericValue(nuevaAlternativa.valor_unitario),
        medio: cleanNumericValue(nuevaAlternativa.id_medio),
        total_bruto: cleanNumericValue(nuevaAlternativa.total_bruto),
        calendar: calendarData,
        multiplicar_valor: Boolean(nuevaAlternativa.multiplicar_valor_unitario)
      };

      // Insertar en la tabla alternativa
      const { data: nuevaAlternativaInsertada, error: errorAlternativa } = await supabase
        .from('alternativa')
        .insert(alternativaData)
        .select()
        .single();

      if (errorAlternativa) {
        console.error('Error al insertar en alternativa:', errorAlternativa);
        throw errorAlternativa;
      }

      // Preparar los datos para la tabla plan_alternativas
      const planAlternativaData = {
        id_plan: planData.id,
        id_alternativa: nuevaAlternativaInsertada.id
      };

      // Insertar en la tabla plan_alternativas
      const { error: errorPlanAlternativa } = await supabase
        .from('plan_alternativas')
        .insert(planAlternativaData);

      if (errorPlanAlternativa) {
        console.error('Error al insertar en plan_alternativas:', errorPlanAlternativa);
        // Si falla la inserción en plan_alternativas, eliminamos la alternativa creada
        await supabase
          .from('alternativa')
          .delete()
          .eq('id', nuevaAlternativaInsertada.id);
        throw errorPlanAlternativa;
      }

      // Limpiar el formulario y cerrar el modal
      setNuevaAlternativa({
        nlinea: '',
        numerorden: 1,
        anio: '',
        mes: '',
        id_campania: '',
        num_contrato: '',
        id_soporte: '',
        id_programa: '',
        tipo_item: '',
        id_clasificacion: '',
        detalle: '',
        id_tema: '',
        segundos: '',
        id_medio: '',
        cantidades: [],
        valor_unitario: '',
        descuento_plan: '',
        recargo_plan: '',
        total_bruto: '',
        total_neto: '',
        medio: '',
        bonificacion_ano: '',
        escala: '',
        formaDePago: '',
        nombreFormaPago: '',
        soporte: ''
      });

      setOpenModal(false);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Alternativa guardada correctamente'
      }).then(() => {
        // Refrescar la página después de mostrar el mensaje
        window.location.reload();
      });

    } catch (error) {
      console.error('Error al guardar alternativa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al guardar la alternativa'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = modoEdicion ? handleGuardarEdicion : handleGuardarAlternativa;

  const tituloModal = modoEdicion ? 'Editar Alternativa' : 'Nueva Alternativa';

  const handleTemaChange = (_, newValue) => {
    const selectedMedio = newValue?.Medios;
    
    if (selectedMedio) {
      setVisibleFields({
        duracion: Boolean(selectedMedio.duracion),
        color: Boolean(selectedMedio.color),
        codigo_megatime: Boolean(selectedMedio.codigo_megatime),
        calidad: Boolean(selectedMedio.calidad),
        cooperado: Boolean(selectedMedio.cooperado),
        rubro: Boolean(selectedMedio.rubro)
      });
    } else {
      setVisibleFields({
        duracion: false,
        color: false,
        codigo_megatime: false,
        calidad: false,
        cooperado: false,
        rubro: false
      });
    }
  
    setNuevaAlternativa(prev => ({ 
      ...prev, 
      id_tema: newValue?.id_tema || '',
      segundos: newValue?.segundos || '',
      id_medio: newValue?.id_medio || null,
      nombreMedio: newValue?.Medios?.NombredelMedio || ''
    }));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', mt: 3 }}>
        <Paper 
          elevation={3}
          sx={{ 
            width: '100%',
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Volver al plan">
                <IconButton 
                  onClick={() => navigate('/planificacion')}
                  sx={{ color: '#1e293b' }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#1e293b',
                    fontWeight: 600
                  }}
                >
                  Lista de Alternativas
                </Typography>
                {planInfo.campana && (
                  <Typography variant="subtitle1" color="text.secondary">
                    Campaña: {planInfo.campana}
                  </Typography>
                )}
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={handleOpenNuevaAlternativa}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: '#4F46E5',
                '&:hover': {
                  backgroundColor: '#4338CA',
                },
                textTransform: 'none',
                borderRadius: 2
              }}
            >
              Nueva Alternativa
            </Button>
          </Box>

          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Línea</TableCell>
                    <TableCell>N° Orden</TableCell>
                    <TableCell>Año</TableCell>
                    <TableCell>Mes</TableCell>
                    <TableCell>Contrato</TableCell>
                    <TableCell>Soporte</TableCell>
                    <TableCell>Programa</TableCell>
                    <TableCell>Tipo Item</TableCell>
                    <TableCell>Clasificación</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell>Tema</TableCell>
                    <TableCell>Segundos</TableCell>
                    <TableCell>Medio</TableCell>
                    <TableCell>Total Bruto</TableCell>
                    <TableCell>Total Neto</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alternativas.map((alternativa) => (
                    <TableRow key={alternativa.id}>
                      <TableCell>{alternativa.nlinea}</TableCell>
                      <TableCell>{alternativa.numerorden}</TableCell>
                      <TableCell>{alternativa.Anios?.years}</TableCell>
                      <TableCell>{alternativa.Meses?.Nombre}</TableCell>
                      <TableCell>{alternativa.Contratos?.NombreContrato}</TableCell>
                      <TableCell>{alternativa.Soportes?.nombreIdentficiador}</TableCell>
                      <TableCell>{alternativa.Programas?.descripcion}</TableCell>
                      <TableCell>{alternativa.tipo_item}</TableCell>
                      <TableCell>{alternativa.Clasificacion?.NombreClasificacion}</TableCell>
                      <TableCell>{alternativa.detalle}</TableCell>
                      <TableCell>{alternativa.Temas?.NombreTema}</TableCell>
                      <TableCell>{alternativa.segundos}</TableCell>
                      <TableCell>{alternativa.Medios?.NombredelMedio}</TableCell>
                      <TableCell>{alternativa.total_bruto}</TableCell>
                      <TableCell>{alternativa.total_neto}</TableCell>
                      <TableCell>
                      <Tooltip title={alternativa.numerorden ? "No se puede editar con N° de Orden asignado" : "Editar"}>
        <span>
          <IconButton 
            onClick={() => handleEditAlternativa(alternativa.id)} 
            disabled={!!alternativa.numerorden}
            style={{ 
              color: alternativa.numerorden ? 'gray' : '#1976d2' // Azul para habilitado, gris para deshabilitado
            }}
          >
            <EditIcon />
          </IconButton>
        </span>
      </Tooltip>
      
      <Tooltip title={alternativa.numerorden ? "No se puede eliminar con N° de Orden asignado" : "Eliminar"}>
        <span>
          <IconButton 
            onClick={() => handleDeleteAlternativa(alternativa.id)} 
            disabled={!!alternativa.numerorden}
            style={{ 
              color: alternativa.numerorden ? 'gray' : '#d32f2f' // Rojo para habilitado, gris para deshabilitado
            }}
          >
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>
                        <Tooltip title="Duplicar">
                          <IconButton
                            onClick={() => handleDuplicateAlternativa(alternativa)}
                            size="small"
                            color="primary"
                          >
                            <FileCopyIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>

        <Paper 
          elevation={3} 
          sx={{ 
            mt: 3,
            p: 2.5, 
            bgcolor: '#f8f9fa',
            borderRadius: '8px'
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
                Resumen de Totales
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2.5, 
                bgcolor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}>
                <AccountBalanceIcon sx={{ fontSize: '2.2rem', color: '#2196f3', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Bruto
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${calcularTotalesGenerales().totalBruto.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2.5, 
                bgcolor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
              }}>
                <ReceiptIcon sx={{ fontSize: '2.2rem', color: '#4caf50', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total General Neto
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${calcularTotalesGenerales().totalNeto.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Dialog 
          open={openModal} 
          onClose={handleCloseModal}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              height: 'auto',
              maxHeight: '90vh',
              width: '95%',
              '& .MuiDialogContent-root': {
                padding: 2,
                overflowX: 'hidden'
              }
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" component="h2">
              {tituloModal}
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              mt: 2,
              backgroundColor: '#f8f9fa',
              p: 2,
              borderRadius: 1,
              '& > div': {
                backgroundColor: '#fff',
                p: 2,
                borderRadius: 1,
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Período
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {planInfo.anio} / {planInfo.mes}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Campaña / Cliente
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {planInfo.campana}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {planInfo.cliente}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Producto
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {planInfo.producto}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 2 }}>
            <input type="hidden" value={nuevaAlternativa.nlinea} />
            <input type="hidden" value={nuevaAlternativa.numerorden} />
            <input type="hidden" name="anio" value={nuevaAlternativa.anio} />
            <input type="hidden" name="mes" value={nuevaAlternativa.mes} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl fullWidth>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                          <TextField
                            label="Contrato"
                            value={contratoSeleccionado ? contratoSeleccionado.NombreContrato : ''}
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    edge="end"
                                    onClick={handleOpenContratosModal}
                                  >
                                    <SearchIcon />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReceiptIcon />
                                </InputAdornment>
                              )
                            }}
                            onClick={handleOpenContratosModal}
                            sx={{ cursor: 'pointer', width: '100%' }}
                          />
                        </Box>
                      </FormControl>
                    </Box>
                  </Grid>

                  {/* Campos dinámicos basados en el medio seleccionado */}
                  {visibleFields.duracion && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Duración"
                        value={nuevaAlternativa.segundos || ''}
                        onChange={(e) => setNuevaAlternativa(prev => ({ ...prev, segundos: e.target.value }))}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TimerIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  )}

                  {visibleFields.color && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Color"
                        value={nuevaAlternativa.color || ''}
                        onChange={(e) => setNuevaAlternativa(prev => ({ ...prev, color: e.target.value }))}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ColorLensIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  )}

                  {visibleFields.codigo_megatime && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Código Megatime"
                        value={nuevaAlternativa.CodigoMegatime || ''}
                        onChange={(e) => setNuevaAlternativa(prev => ({ ...prev, CodigoMegatime: e.target.value }))}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CodeIcon />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Forma de Pago"
                      value={nuevaAlternativa.nombreFormaPago || ''}
                      disabled
                      fullWidth
                      sx={{ width: '100%' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaymentIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                          <Box sx={{ position: 'relative', width: '100%' }}>
                          <TextField
  label="Tema"
  value={temaSeleccionado ? temaSeleccionado.NombreTema : ''} // Changed from nombre_tema to NombreTema
  InputProps={{
    readOnly: true,
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          edge="end"
          onClick={() => nuevaAlternativa.num_contrato && handleOpenTemasModal()}
          disabled={!nuevaAlternativa.num_contrato}
        >
          <SearchIcon />
        </IconButton>
      </InputAdornment>
    ),
    startAdornment: (
      <InputAdornment position="start">
        <TopicIcon />
      </InputAdornment>
    )
  }}
  onClick={() => nuevaAlternativa.num_contrato && handleOpenTemasModal()}
  sx={{ cursor: nuevaAlternativa.num_contrato ? 'pointer' : 'not-allowed', width: '100%' }}
  helperText={!nuevaAlternativa.num_contrato ? "Primero seleccione un contrato" : ""}
/>
                          </Box>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Medio"
                          size="small"
                          fullWidth
                          value={temaSeleccionado?.Medios?.NombredelMedio || ''}
                          disabled
                          sx={{ width: '100%' }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <RadioIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Segundos"
                          size="small"
                          fullWidth
                          value={nuevaAlternativa.segundos || ''}
                          disabled
                          sx={{ width: '100%' }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TimerIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3} sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                          <Box sx={{ position: 'relative', width: '100%' }}>
                            <TextField
                              label="Soporte"
                              value={selectedSoporte ? selectedSoporte.nombreIdentficiador : ''}
                              onClick={() => {
                                if (nuevaAlternativa.num_contrato) {
                                  handleOpenSoportesModal();
                                } else {
                                  Swal.fire({
                                    icon: 'warning',
                                    title: 'Atención',
                                    text: 'Primero debe seleccionar un contrato'
                                  });
                                }
                              }}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      edge="end"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (nuevaAlternativa.num_contrato) {
                                          handleOpenSoportesModal();
                                        } else {
                                          Swal.fire({
                                            icon: 'warning',
                                            title: 'Atención',
                                            text: 'Primero debe seleccionar un contrato'
                                          });
                                        }
                                      }}
                                    >
                                      <SearchIcon />
                                    </IconButton>
                                  </InputAdornment>
                                ),
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CategoryIcon sx={{ fontSize: '1.1rem' }} />
                                  </InputAdornment>
                                )
                              }}
                              sx={{ cursor: 'pointer', width: '100%' }}
                              helperText={!nuevaAlternativa.num_contrato ? "Primero seleccione un contrato" : ""}
                            />
                          </Box>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Programa"
                          value={selectedPrograma ? selectedPrograma.descripcion : ''}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  edge="end"
                                  onClick={() => nuevaAlternativa.id_soporte && handleOpenProgramasModal()}
                                  disabled={!nuevaAlternativa.id_soporte}
                                >
                                  <SearchIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                            startAdornment: (
                              <InputAdornment position="start">
                                <PlaylistPlayIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                          onClick={() => nuevaAlternativa.id_soporte && handleOpenProgramasModal()}
                          sx={{ cursor: nuevaAlternativa.id_soporte ? 'pointer' : 'not-allowed', width: '100%' }}
                          helperText={!nuevaAlternativa.id_soporte ? "Primero seleccione un soporte" : ""}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Horario Inicio"
                          value={selectedPrograma ? selectedPrograma.hora_inicio : ''}
                          InputProps={{
                            readOnly: true,
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          label="Horario Fin"
                          value={selectedPrograma ? selectedPrograma.hora_fin : ''}
                          InputProps={{
                            readOnly: true,
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccessTimeIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{ width: '100%' }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4} sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                          <Box sx={{ position: 'relative', width: '100%' }}>
                              <TextField
                                label="Clasificación"
                                value={selectedClasificacion ? selectedClasificacion.NombreClasificacion : ''}
                                InputProps={{
                                  readOnly: true,
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        edge="end"
                                        onClick={() => nuevaAlternativa.id_contrato && handleOpenClasificacionModal()}
                                        disabled={!nuevaAlternativa.id_contrato}
                                      >
                                        <SearchIcon />
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <CategoryIcon sx={{ fontSize: '1.1rem' }} />
                                    </InputAdornment>
                                  )
                                }}
                                onClick={() => nuevaAlternativa.id_contrato && handleOpenClasificacionModal()}
                                sx={{ cursor: nuevaAlternativa.id_contrato ? 'pointer' : 'not-allowed', width: '100%' }}
                                helperText={!nuevaAlternativa.id_contrato ? "Primero seleccione un contrato" : ""}
                              />
                          </Box>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          select
                          label="Tipo Item"
                          fullWidth
                          value={nuevaAlternativa.tipo_item}
                          onChange={(e) => setNuevaAlternativa(prev => ({ ...prev, tipo_item: e.target.value }))}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <InventoryIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                        >
                          {TIPO_ITEMS.map((tipo) => (
                            <MenuItem key={tipo} value={tipo}>
                              {tipo}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Detalle"
                          fullWidth
                          value={nuevaAlternativa.detalle}
                          onChange={(e) => setNuevaAlternativa(prev => ({ ...prev, detalle: e.target.value }))}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DescriptionIcon sx={{ fontSize: '1.1rem' }} />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>       <Box  sx={{ mt: 2 }}>
              <CalendarioAlternativa
                anio={nuevaAlternativa.anio}
                mes={nuevaAlternativa.mes}
                cantidades={nuevaAlternativa.cantidades}
                onChange={handleCantidadInput}
                cantidadesRef={cantidadesRef}
                autoFillCantidades={autoFillCantidades}
              />
            </Box></Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
  <Typography variant="subtitle2" gutterBottom>
    Montos
  </Typography>
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            checked={nuevaAlternativa.multiplicar_valor_unitario}
            onChange={(e) => handleToggleMultiplicar(e.target.checked)}
          />
        }
        label="Multiplicar valor unitario"
      />
    </Grid>
    <Grid item xs={12}>
    <TextField
  label="Valor Unitario"
  type="number"
  fullWidth
  value={nuevaAlternativa.valor_unitario}
  onChange={(e) => handleMontoChange('valor_unitario', e.target.value)}
  InputProps={{
    startAdornment: <InputAdornment position="start">$</InputAdornment>,
  }}
/>
    </Grid>
    <Grid item xs={12}>
    <TextField
  label="Descuento Plan (%)"
  type="number"
  fullWidth
  value={nuevaAlternativa.descuento_plan}
  onChange={(e) => handleMontoChange('descuento_plan', e.target.value)}
  InputProps={{
    endAdornment: <InputAdornment position="end">%</InputAdornment>,
  }}
/>
    </Grid>
    <Grid item xs={12}>
    <TextField
  label="Recargo Plan (%)"
  type="number"
  fullWidth
  value={nuevaAlternativa.recargo_plan}
  onChange={(e) => handleMontoChange('recargo_plan', e.target.value)}
  InputProps={{
    endAdornment: <InputAdornment position="end">%</InputAdornment>,
  }}
  sx={{
    '& .MuiOutlinedInput-input': {
      paddingLeft: '12px !important'
    }
  }}
/>
    </Grid>
    <Grid item xs={12}>
      <TextField
        label={contratoSeleccionado?.id_GeneraracionOrdenTipo === 1 ? 'TOTAL NETO' : 'TOTAL BRUTO'}
        size="small"
        fullWidth
        type="number"
        value={contratoSeleccionado?.id_GeneraracionOrdenTipo === 1 ? 
          nuevaAlternativa.total_neto : 
          nuevaAlternativa.total_bruto}
        disabled
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccountBalanceIcon sx={{ fontSize: '1.1rem' }} />
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        label="IVA 19%"
        size="small"
        fullWidth
        type="number"
        value={nuevaAlternativa.iva}
        disabled
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
            </InputAdornment>
          )
        }}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        label="TOTAL ORDEN"
        size="small"
        fullWidth
        type="number"
        value={nuevaAlternativa.total_orden}
        disabled
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
            </InputAdornment>
          )
        }}
      />
    </Grid>
  </Grid>
</Paper>
              </Grid>
            </Grid>

     

          </DialogContent>
          <DialogActions>
  <Button onClick={handleCloseModal}>


Cancelar

  </Button>
  <Button 
    onClick={handleGuardar}
    variant="contained" 
    color="primary"
  >
    {modoEdicion ? 'Guardar Cambios' : 'Guardar'}
  </Button>
</DialogActions>
        </Dialog>

        <Dialog 
          open={openContratosModal} 
          onClose={handleCloseContratosModal}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Seleccionar Contrato</Typography>
              <IconButton onClick={handleCloseContratosModal} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Buscar contrato"
                value={searchContrato}
                onChange={(e) => {
                  setSearchContrato(e.target.value);
                  handleSearchContrato();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenAddContratoModal}
                startIcon={<AddIcon />}
                size="small"
              >
                Agregar
              </Button>
            </Box>
          </DialogTitle>

          <DialogContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre Contrato</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Medio</TableCell>
                    <TableCell>Forma de Pago</TableCell>
                    <TableCell>Fecha Expiración</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingContratos ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : contratosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron contratos
                      </TableCell>
                    </TableRow>
                  ) : (
                    contratosFiltrados.map((contrato) => (
                      <TableRow key={contrato.id}>
                        <TableCell>{contrato.id}</TableCell>
                        <TableCell>{contrato.NombreContrato}</TableCell>
                        <TableCell>{contrato.cliente?.nombreCliente}</TableCell>
                        <TableCell>{contrato.proveedor?.nombreProveedor}</TableCell>
                        <TableCell>{contrato.medio?.NombredelMedio}</TableCell>
                        <TableCell>{contrato.formaPago?.NombreFormadePago}</TableCell>
                        <TableCell>{contrato.FechaTermino ? new Date(contrato.FechaTermino).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Typography color={getEstadoColor(contrato.Estado)}>
                            {contrato.Estado}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {(() => {
                              const periodoFin = (nuevaAlternativa.anio && nuevaAlternativa.mes)
                                ? new Date(nuevaAlternativa.anio, nuevaAlternativa.mes, 0)
                                : null;
                              const expira = contrato.FechaTermino ? new Date(contrato.FechaTermino) : null;
                              const fueraDeRango = periodoFin && expira && expira < periodoFin;
                              const tooltip = fueraDeRango
                                ? `Contrato expira antes del periodo (${expira?.toLocaleDateString()})`
                                : 'Seleccionar';
                              return (
                                <Tooltip title={tooltip}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      disabled={Boolean(fueraDeRango)}
                                      onClick={() => handleSeleccionarContrato(contrato)}
                                    >
                                      <CheckIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              );
                            })()}
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setContratoSeleccionado(contrato);
                                  handleOpenEditContratoModal();
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        <Dialog 
          open={openTemasModal} 
          onClose={handleCloseTemasModal}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Seleccionar Tema</Typography>
              <IconButton onClick={handleCloseTemasModal} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar tema..."
                value={searchTema}
                onChange={(e) => {
                  setSearchTema(e.target.value);
                  fetchTemasFiltrados();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenAddTemaModal}
                startIcon={<AddIcon />}
                size="small"
                disabled={user?.Perfiles?.NombrePerfil === 'Área Planificación'}
              >
                Agregar
              </Button>
            </Box>
          </DialogTitle>


          <DialogContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre Tema</TableCell>
                      <TableCell>Medio</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Duración</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Calidad</TableCell>
                  
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell>Fecha Modificación</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTemas ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : temasFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No se encontraron temas
                      </TableCell>
                    </TableRow>
                  ) : (
                    temasFiltrados.map((tema) => (
                      <TableRow 
                        key={tema.id_tema}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleSeleccionarTema(tema)}
                      >
                        <TableCell>{tema.id_tema}</TableCell>
                        <TableCell>{tema.nombre_tema}</TableCell>
                        <TableCell>
                          {tema.Medios?.NombredelMedio || 'N/A'}
                        </TableCell>
                        <TableCell>{tema.descripcion}</TableCell>
                        <TableCell>{formatDuracion(tema.duracion)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tema.estado || 'N/A'} 
                            color={tema.estado === 'Activo' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {tema.Calidad?.NombreCalidad || 'N/A'}
                        </TableCell>
                       
                        <TableCell>{new Date(tema.fecha_creacion).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(tema.fecha_modificacion).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeleccionarTema(tema);
                            }}
                            color="primary"
                            title="Seleccionar"
                          >
                            <CheckIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        <Dialog 
    open={openSoportesModal} 
    onClose={handleCloseSoportesModal}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6">Seleccionar Soporte</Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddSoporteModal}
            size="small"
            sx={{ mr: 1 }}
            disabled={user?.Perfiles?.NombrePerfil === 'Área Planificación'}
          >
            Nuevo Soporte
          </Button>
          <IconButton onClick={handleCloseSoportesModal} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <TextField
        label="Buscar Soporte"
        variant="outlined"
        fullWidth
        value={searchSoporte}
        onChange={(e) => handleSearchSoporte(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        size="small"
      />
      {contratoSeleccionado && contratoSeleccionado.medio && (
        <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>
          Filtrando soportes para el medio: {contratoSeleccionado.medio.NombredelMedio}
        </Typography>
      )}
    </DialogTitle>
    <DialogContent>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Bonificación Año</TableCell>
              <TableCell>Escala</TableCell>
              <TableCell>Medios</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingSoportes ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : (soportesFiltrados.length > 0 ? soportesFiltrados : soportes).length > 0 ? (
              (soportesFiltrados.length > 0 ? soportesFiltrados : soportes).map((soporte) => (
                <TableRow key={soporte.id_soporte}>
                  <TableCell>{soporte.id_soporte}</TableCell>
                  <TableCell>{soporte.nombreIdentficiador}</TableCell>
                  <TableCell>{soporte.bonificacion_ano}</TableCell>
                  <TableCell>{soporte.escala}</TableCell>
                  <TableCell>{soporte.Medios}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleSeleccionarSoporte(soporte)}
                      title="Seleccionar"
                    >
                      <CheckIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {contratoSeleccionado && contratoSeleccionado.medio ? 
                    `No hay soportes para el medio "${contratoSeleccionado.medio.NombredelMedio}"` : 
                    "No se encontraron soportes"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </DialogContent>
  </Dialog>

  {/* Agregar el modal para crear un nuevo soporte */}
  {/* Modificar el modal para crear un nuevo soporte */}
  <Dialog
    open={openAddSoporteModal}
    onClose={handleCloseAddSoporteModal}
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle>
      Nuevo Soporte
      <IconButton
        aria-label="close"
        onClick={handleCloseAddSoporteModal}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Nombre del Soporte"
          fullWidth
          value={nuevoSoporte.nombreIdentficiador}
          onChange={(e) => setNuevoSoporte({ ...nuevoSoporte, nombreIdentficiador: e.target.value })}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          label="Bonificación Año"
          fullWidth
          type="number"
          value={nuevoSoporte.bonificacion_ano}
          onChange={(e) => setNuevoSoporte({ ...nuevoSoporte, bonificacion_ano: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Escala"
          fullWidth
          type="number"
          value={nuevoSoporte.escala}
          onChange={(e) => setNuevoSoporte({ ...nuevoSoporte, escala: e.target.value })}
          sx={{ mb: 2 }}
        />
        
        {/* Modificar el selector de medios para que esté bloqueado si hay un medio en el contrato */}
        {contratoSeleccionado && contratoSeleccionado.medio ? (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="medios-select-label">Medio</InputLabel>
            <Select
              labelId="medios-select-label"
              value={[contratoSeleccionado.medio.id]}
              input={<OutlinedInput label="Medio" />}
              disabled={true}
              renderValue={() => contratoSeleccionado.medio.NombredelMedio}
            >
              <MenuItem value={contratoSeleccionado.medio.id}>
                {contratoSeleccionado.medio.NombredelMedio}
              </MenuItem>
            </Select>
            <FormHelperText>
              El medio está preseleccionado según el contrato y no puede ser modificado
            </FormHelperText>
          </FormControl>
        ) : (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="medios-select-label">Medios</InputLabel>
            <Select
              labelId="medios-select-label"
              multiple
              value={nuevoSoporte.medios}
              onChange={(e) => setNuevoSoporte({ ...nuevoSoporte, medios: e.target.value })}
              input={<OutlinedInput label="Medios" />}
              renderValue={(selected) => {
                const selectedMedios = mediosOptions.filter(medio => selected.includes(medio.id));
                return selectedMedios.map(medio => medio.NombredelMedio).join(', ');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 224,
                    width: 250,
                  },
                },
              }}
            >
              {loadingMedios ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                </MenuItem>
              ) : (
                mediosOptions.map((medio) => (
                  <MenuItem key={medio.id} value={medio.id}>
                    <Checkbox checked={nuevoSoporte.medios.indexOf(medio.id) > -1} />
                    <ListItemText primary={medio.NombredelMedio} />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseAddSoporteModal}>Cancelar</Button>
      <Button onClick={handleSaveSoporte} variant="contained" color="primary">
        Guardar
      </Button>
    </DialogActions>
  </Dialog>

        <Dialog 
          open={openProgramasModal} 
          onClose={handleCloseProgramasModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Seleccionar Programa</Typography>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAddEditProgramaModal()}
                  size="small"
                  sx={{ mr: 1 }}
                  disabled={user?.Perfiles?.NombrePerfil === 'Área Planificación'}
                >
                  Nuevo Programa
                </Button>
                <IconButton onClick={handleCloseProgramasModal} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar programa..."
              value={searchPrograma}
              onChange={(e) => {
                setSearchPrograma(e.target.value);
                handleSearchPrograma(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </DialogTitle>

          <DialogContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Código Programa</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Hora Inicio</TableCell>
                    <TableCell>Hora Fin</TableCell>
                    <TableCell>Cód. Prog. Megatime</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingProgramas ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : programasFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No se encontraron programas
                      </TableCell>
                    </TableRow>
                  ) : (
                    programasFiltrados.map((programa) => (
                      <TableRow 
                        key={programa.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleSeleccionarPrograma(programa)}
                      >
                        <TableCell>{programa.id}</TableCell>
                        <TableCell>{programa.codigo_programa}</TableCell>
                        <TableCell>{programa.descripcion}</TableCell>
                        <TableCell>{programa.hora_inicio}</TableCell>
                        <TableCell>{programa.hora_fin}</TableCell>
                        <TableCell>{programa.cod_prog_megatime}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeleccionarPrograma(programa);
                            }}
                            color="primary"
                            title="Seleccionar"
                          >
                            <CheckIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        <Dialog 
          open={openClasificacionModal} 
          onClose={handleCloseClasificacionModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Seleccionar Clasificación</Typography>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAddEditClasificacionModal()}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Nueva Clasificación
                </Button>
                <IconButton onClick={handleCloseClasificacionModal} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar clasificación..."
                value={searchClasificacion}
                onChange={(e) => {
                  setSearchClasificacion(e.target.value);
                  handleSearchClasificacion(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                size="small"
              />
            </Box>
          </DialogTitle>

          <DialogContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre Clasificación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingClasificaciones ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : clasificacionesList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No se encontraron clasificaciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    clasificacionesList.map((clasificacion) => (
                      <TableRow 
                        key={clasificacion.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleSeleccionarClasificacion(clasificacion)}
                      >
                        <TableCell>{clasificacion.id}</TableCell>
                        <TableCell>{clasificacion.NombreClasificacion}</TableCell>
                        <TableCell align="center" sx={{ minWidth: 120 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddEditClasificacionModal(clasificacion);
                              }}
                              color="primary"
                              title="Editar"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeleccionarClasificacion(clasificacion);
                              }}
                              color="primary"
                              title="Seleccionar"
                            >
                              <CheckIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openAddEditClasificacionModal}
          onClose={handleCloseAddEditClasificacionModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingClasificacion ? 'Editar' : 'Agregar'} Clasificación
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nombre Clasificación"
                value={nuevaClasificacion.NombreClasificacion}
                onChange={(e) => setNuevaClasificacion(prev => ({
                  ...prev,
                  NombreClasificacion: e.target.value
                }))}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddEditClasificacionModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClasificacion} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openAddContratoModal} 
          onClose={handleCloseAddContratoModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Agregar Contrato
            <IconButton
              aria-label="close"
              onClick={handleCloseAddContratoModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <ModalAgregarContrato 
              open={openAddContratoModal}
              onClose={handleCloseAddContratoModal}
              onContratoAdded={() => {
                handleCloseAddContratoModal();
                handleSearchContrato();
              }}
              clienteId={clienteId} 
              clienteNombre={planInfo.cliente} 
              disableClienteSelect={true} 
            />
          </DialogContent>
        </Dialog>

        <Dialog 
          open={openEditContratoModal} 
          onClose={handleCloseEditContratoModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Modificar Contrato
            <IconButton
              aria-label="close"
              onClick={handleCloseEditContratoModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {contratoSeleccionado && (
              <ModalEditarContrato 
                open={openEditContratoModal}
                onClose={handleCloseEditContratoModal}
                contrato={contratoSeleccionado}
                onContratoUpdated={() => {
                  handleCloseEditContratoModal();
                  handleSearchContrato();
                }}
                clienteId={clienteId}
                clienteNombre={planInfo.cliente}
                disableClienteSelect={true}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog 
          open={openAddTemaModal} 
          onClose={handleCloseAddTemaModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Agregar Tema
            <IconButton
              aria-label="close"
              onClick={handleCloseAddTemaModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
          <ModalAgregarTema
  open={openAddTemaModal}
  onClose={handleCloseAddTemaModal}
  onTemaAdded={handleTemaAdded}
  idCampania={campaniaId}
  medioId={contratoSeleccionado?.IdMedios}
  medioNombre={contratoSeleccionado?.medio?.NombredelMedio}
/>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openAddEditProgramaModal}
          onClose={handleCloseAddEditProgramaModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingPrograma ? 'Editar Programa' : 'Nuevo Programa'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Descripción"
                fullWidth
                value={newPrograma.descripcion}
                onChange={(e) => setNewPrograma({ ...newPrograma, descripcion: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Código Programa"
                fullWidth
                value={newPrograma.codigo_programa}
                onChange={(e) => setNewPrograma({ ...newPrograma, codigo_programa: e.target.value })}
                sx={{ mb: 2, mt: '10px' }}
              />
        
                  {/* Hora de inicio - Reemplazar el campo actual por dos selects */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Hora Inicio
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="hora-inicio-label">Hora</InputLabel>
              <Select
                labelId="hora-inicio-label"
                value={newPrograma.hora_inicio_hora || ""}
                onChange={(e) => {
                  const horaValue = e.target.value;
                  const minValue = newPrograma.hora_inicio_min || "00";
                  setNewPrograma({
                    ...newPrograma, 
                    hora_inicio_hora: horaValue,
                    hora_inicio: `${horaValue}:${minValue}`
                  });
                }}
                label="Hora"
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const hora = i.toString().padStart(2, '0');
                  return (
                    <MenuItem key={`hora-inicio-${hora}`} value={hora}>{hora}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
  <FormControl fullWidth size="small">
    <InputLabel id="min-inicio-label">Minutos</InputLabel>
    <Select
      labelId="min-inicio-label"
      value={newPrograma.hora_inicio_min || ""}
      onChange={(e) => {
        const minValue = e.target.value;
        const horaValue = newPrograma.hora_inicio_hora || "00";
        setNewPrograma({
          ...newPrograma, 
          hora_inicio_min: minValue,
          hora_inicio: `${horaValue}:${minValue}`
        });
      }}
      label="Minutos"
    >
      {Array.from({ length: 60 }, (_, i) => {
        const min = i.toString().padStart(2, '0');
        return (
          <MenuItem key={`min-inicio-${min}`} value={min}>{min}</MenuItem>
        );
      })}
    </Select>
  </FormControl>
</Grid>
        </Grid>
      </Grid>
      
      {/* Hora fin - Reemplazar el campo actual por dos selects */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Hora Fin
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="hora-fin-label">Hora</InputLabel>
              <Select
                labelId="hora-fin-label"
                value={newPrograma.hora_fin_hora || ""}
                onChange={(e) => {
                  const horaValue = e.target.value;
                  const minValue = newPrograma.hora_fin_min || "00";
                  setNewPrograma({
                    ...newPrograma, 
                    hora_fin_hora: horaValue,
                    hora_fin: `${horaValue}:${minValue}`
                  });
                }}
                label="Hora"
              >
                {Array.from({ length: 31 }, (_, i) => {
                  const hora = i.toString().padStart(2, '0');
                  return (
                    <MenuItem key={`hora-fin-${hora}`} value={hora}>{hora}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
  <FormControl fullWidth size="small">
    <InputLabel id="min-fin-label">Minutos</InputLabel>
    <Select
      labelId="min-fin-label"
      value={newPrograma.hora_fin_min || ""}
      onChange={(e) => {
        const minValue = e.target.value;
        const horaValue = newPrograma.hora_fin_hora || "00";
        setNewPrograma({
          ...newPrograma, 
          hora_fin_min: minValue,
          hora_fin: `${horaValue}:${minValue}`
        });
      }}
      label="Minutos"
    >
      {Array.from({ length: 60 }, (_, i) => {
        const min = i.toString().padStart(2, '0');
        return (
          <MenuItem key={`min-fin-${min}`} value={min}>{min}</MenuItem>
        );
      })}
    </Select>
  </FormControl>
</Grid>
        </Grid>
      </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddEditProgramaModal}>Cancelar</Button>
            <Button onClick={handleSavePrograma} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Alternativas;
