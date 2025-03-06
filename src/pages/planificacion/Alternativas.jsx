import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
import { 
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
  const { id } = useParams();
  const navigate = useNavigate();
  
  console.log('Componente Alternativas - ID del plan:', id);

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

  const [editandoAlternativa, setEditandoAlternativa] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [openContratosModal, setOpenContratosModal] = useState(false);
  const [openAddContratoModal, setOpenAddContratoModal] = useState(false);
  const [openEditContratoModal, setOpenEditContratoModal] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [searchContrato, setSearchContrato] = useState('');

  const [openTemasModal, setOpenTemasModal] = useState(false);
  const [openAddTemaModal, setOpenAddTemaModal] = useState(false);
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [temasFiltrados, setTemasFiltrados] = useState([]);
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [searchTema, setSearchTema] = useState('');

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
    id_contrato: ''
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

  const handleOpenAddContratoModal = () => {
    setOpenAddContratoModal(true);
  };

  const handleCloseAddContratoModal = () => {
    setOpenAddContratoModal(false);
    handleSearchContrato(); // Actualizar la lista después de agregar
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModoEdicion(false);
    setEditandoAlternativa(null);
    // Reset nueva alternativa to initial state with empty array for cantidades
    setNuevaAlternativa({
      nlinea: '',
      numerorden: nextNumeroOrden,
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
      cantidades: [], // Ensure this is always an array
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
    // Reset selected items
    setContratoSeleccionado(null);
    setSelectedSoporte(null);
    setSelectedPrograma(null);
    setTemaSeleccionado(null);
    setSelectedClasificacion(null);
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
    console.log('Abriendo modal con contrato:', contratoSeleccionado); // Para debugging
    setOpenEditContratoModal(true);
  };

  const handleCloseEditContratoModal = () => {
    setOpenEditContratoModal(false);
    handleSearchContrato(); // Actualizar la lista después de editar
  };

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

        console.log('Contratos obtenidos:', data);
        setContratos(data || []);
      } catch (error) {
        console.error('Error al obtener contratos:', error);
      }
    };

    fetchContratos();
  }, [clienteId]);

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

        console.log('Soportes filtrados por proveedor:', soportesFiltrados);
        setSoportes(soportesFiltrados);
      } catch (error) {
        console.error('Error al obtener soportes:', error);
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
        console.log('Buscando temas para campaña:', campaniaId);
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

        console.log('Temas filtrados por campaña:', temasFiltrados);
        setTemas(temasFiltrados);
      } catch (error) {
        console.error('Error al obtener temas:', error);
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
        console.log('Buscando programas para soporte:', nuevaAlternativa.id_soporte);
        
        const { data, error } = await supabase
          .from('Programas')
          .select('*')
          .eq('soporte_id', nuevaAlternativa.id_soporte)
          .eq('estado', true)  // Solo programas activos
          .ilike('descripcion', `%${searchPrograma}%`)
          .order('descripcion', { ascending: true });

        if (error) throw error;

        console.log('Programas filtrados por soporte:', data);
        setProgramasFiltrados(data || []);
      } catch (error) {
        console.error('Error al obtener programas:', error);
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

        console.log('Plan obtenido:', plan);
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
        console.error('Error al cargar los datos:', error);
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

      if (planAltError) {
        console.error('Error al obtener plan_alternativas:', planAltError);
        throw planAltError;
      }

      // Si no hay alternativas, establecemos un array vacío y salimos
      if (!planAlternativas || planAlternativas.length === 0) {
        console.log('No hay alternativas para este plan');
        setAlternativas([]);
        return;
      }

      // Obtenemos los IDs de las alternativas (asegurándonos de que no sean null)
      const alternativaIds = planAlternativas
        .map(pa => pa.id_alternativa)
        .filter(id => id != null);

      console.log('IDs de alternativas encontrados:', alternativaIds);

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
          Medios (
            id,
            NombredelMedio
          )
        `)
        .in('id', alternativaIds)
        .order('numerorden', { ascending: true });

      if (error) {
        console.error('Error al obtener alternativas:', error);
        throw error;
      }

      console.log('Alternativas obtenidas:', data);
      setAlternativas(data || []);
      if (data && data.length > 0) {
        setNextNumeroOrden(Math.max(...data.map(a => a.numerorden)) + 1);
      }
    } catch (error) {
      console.error('Error al obtener alternativas:', error);
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

  const handleDeleteAlternativa = async (alternativaId) => {
    try {
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
      
      // Obtener los datos completos de la alternativa
      const { data: alternativa, error } = await supabase
        .from('alternativa')
        .select('*')
        .eq('id', alternativaId)
        .single();

      if (error) throw error;

      // Preparar el objeto para edición
      const alternativaParaEditar = {
        ...alternativa,
        cantidades: alternativa.calendar || []
      };

      // Establecer los valores para edición
      setNuevaAlternativa(alternativaParaEditar);
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

      // Validar campos requeridos
      const camposRequeridos = {
        tipo_item: nuevaAlternativa.tipo_item
      };

      const camposFaltantes = Object.entries(camposRequeridos)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (camposFaltantes.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
      }

      // Preparar datos para actualización
      const datosActualizacion = {
        ...nuevaAlternativa,
        calendar: Object.keys(nuevaAlternativa.cantidades).length > 0 ? nuevaAlternativa.cantidades : null
      };

      // Eliminar campos que no queremos actualizar
      delete datosActualizacion.id;
      delete datosActualizacion.cantidades;

      // Actualizar la alternativa
      const { error: updateError } = await supabase
        .from('alternativa')
        .update(datosActualizacion)
        .eq('id', editandoAlternativa);

      if (updateError) throw updateError;

      // Recargar alternativas y limpiar estado
      await fetchAlternativas();
      setOpenModal(false);
      setModoEdicion(false);
      setEditandoAlternativa(null);
      setNuevaAlternativa({
        nlinea: '',
        numerorden: nextNumeroOrden,
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

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Alternativa actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar alternativa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar la alternativa'
      });
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

    console.log('Contrato seleccionado con forma de pago:', contrato);
    setContratoSeleccionado(contrato);
    
    setNuevaAlternativa(prev => ({
      ...prev,
      num_contrato: contrato.id,
      id_contrato: contrato.id,
      formaDePago: contrato.formaPago.id,
      nombreFormaPago: contrato.formaPago.NombreFormadePago
    }));
    
    try {
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
          
          return {
            id_soporte: item.Soportes.id_soporte,
            nombreIdentficiador: item.Soportes.nombreIdentficiador,
            Medios: medios,
            bonificacion_ano: item.Soportes.bonificacion_ano,
            escala: item.Soportes.escala
          };
        });

      console.log('Soportes filtrados por proveedor:', soportesFiltrados);
      setAllSoportes(soportesFiltrados);
      setSoportes(soportesFiltrados);
      setSoportesFiltrados([]);
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
      console.log('Contratos con forma de pago:', data);
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

      // Transformar los datos para tener una estructura más plana
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
      .filter(tema => 
        tema.nombre_tema?.toLowerCase().includes(searchTema.toLowerCase()) ||
        tema.descripcion?.toLowerCase().includes(searchTema.toLowerCase())
      ) || [];

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
  }, [campaniaId, searchTema, openTemasModal]);

  const formatDuracion = (segundos) => {
    if (!segundos) return '-';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const handleSearchSoporte = (searchTerm) => {
    if (!searchTerm.trim()) {
      setSoportes(allSoportes);
      setSoportesFiltrados([]);
      return;
    }

    const filtrados = allSoportes.filter(soporte =>
      soporte.nombreIdentficiador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      soporte.Medios.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSoportes(filtrados);
    setSoportesFiltrados(filtrados);
  };

  const handleOpenSoportesModal = () => {
    setOpenSoportesModal(true);
  };

  const handleCloseSoportesModal = () => {
    setOpenSoportesModal(false);
    setSearchSoporte('');
  };

  const handleSeleccionarSoporte = (soporte) => {
    console.log('Soporte seleccionado:', soporte);
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
      console.log('Buscando programas para soporte:', nuevaAlternativa.id_soporte);
      
      const { data, error } = await supabase
        .from('Programas')
        .select('*')
        .eq('soporte_id', nuevaAlternativa.id_soporte)
        .eq('estado', true)  // Solo programas activos
        .ilike('descripcion', `%${searchValue}%`)
        .order('descripcion', { ascending: true });

      if (error) throw error;

      console.log('Programas encontrados:', data);
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

  const handleSearchClasificacion = async (searchValue) => {
    if (!nuevaAlternativa.num_contrato) {
      setClasificacionesList([]);
      return;
    }
    
    setLoadingClasificaciones(true);
    try {
      console.log('Buscando clasificaciones para contrato:', nuevaAlternativa.num_contrato);
      
      const { data, error } = await supabase
        .from('Clasificacion')
        .select('*')
        .eq('id_contrato', nuevaAlternativa.num_contrato)
        .ilike('NombreClasificacion', `%${searchValue}%`)
        .order('NombreClasificacion', { ascending: true });

      if (error) throw error;

      console.log('Clasificaciones encontradas:', data);
      setClasificacionesList(data || []);
    } catch (error) {
      console.error('Error al buscar clasificaciones:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al buscar clasificaciones'
      });
      setClasificacionesList([]);
    } finally {
      setLoadingClasificaciones(false);
    }
  };

  const handleOpenClasificacionModal = () => {
    if (!nuevaAlternativa.num_contrato) {
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
        id_contrato: nuevaAlternativa.num_contrato
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
      setLoading(true);
      
      if (!nuevaClasificacion.NombreClasificacion?.trim()) {
        throw new Error('El nombre de la clasificación es requerido');
      }

      // Asegurarnos de que no haya un ID en los datos
      const clasificacionData = {
        NombreClasificacion: nuevaClasificacion.NombreClasificacion.trim(),
        id_contrato: nuevaAlternativa.num_contrato || null
      };

      console.log('Datos a guardar:', clasificacionData);

      if (editingClasificacion) {
        const { error } = await supabase
          .from('Clasificacion')
          .update(clasificacionData)
          .eq('id', editingClasificacion.id);

        if (error) throw error;
      } else {
        // Insertar sin especificar ID y sin usar array
        const { data, error } = await supabase
          .from('Clasificacion')
          .insert(clasificacionData)
          .select();

        if (error) {
          console.error('Error detallado:', error);
          throw error;
        }
        console.log('Clasificación insertada:', data);
      }

      // Recargar las clasificaciones
      await handleSearchClasificacion('');
      
      // Cerrar el modal y limpiar el formulario
      setOpenAddEditClasificacionModal(false);
      setEditingClasificacion(null);
      setNuevaClasificacion({
        NombreClasificacion: '',
        id_contrato: ''
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Clasificación ${editingClasificacion ? 'actualizada' : 'creada'} correctamente`
      });

    } catch (error) {
      console.error('Error al guardar clasificación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al guardar la clasificación'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddTemaModal = () => {
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
    try {
      if (!newPrograma.descripcion) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La descripción es requerida'
        });
        return;
      }

      // Verificar que haya un soporte seleccionado
      if (!selectedSoporte) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Debe seleccionar un soporte primero'
        });
        return;
      }

      let query = supabase.from('Programas');
      
      if (editingPrograma?.id) {
        // Si estamos editando, usamos update
        const { data, error } = await query
          .update({
            descripcion: newPrograma.descripcion,
            hora_inicio: newPrograma.hora_inicio,
            hora_fin: newPrograma.hora_fin,
            cod_prog_megatime: newPrograma.cod_prog_megatime,
            codigo_programa: newPrograma.codigo_programa,
            soporte_id: selectedSoporte.id_soporte,
            estado: true // Agregamos el campo estado
          })
          .eq('id', editingPrograma.id)
          .select();

        if (error) throw error;
      } else {
        // Si estamos creando, usamos insert sin especificar ID
        const { data, error } = await query
          .insert({
            descripcion: newPrograma.descripcion,
            hora_inicio: newPrograma.hora_inicio,
            hora_fin: newPrograma.hora_fin,
            cod_prog_megatime: newPrograma.cod_prog_megatime,
            codigo_programa: newPrograma.codigo_programa,
            soporte_id: selectedSoporte.id_soporte,
            estado: true // Agregamos el campo estado
          })
          .select();

        if (error) throw error;
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Programa ${editingPrograma ? 'actualizado' : 'creado'} correctamente`
      });

      handleCloseAddEditProgramaModal();
      
      // Recargar la lista de programas
      if (selectedSoporte) {
        const { data: programasData, error: programasError } = await supabase
          .from('Programas')
          .select('*')
          .eq('soporte_id', selectedSoporte.id_soporte);

        if (!programasError) {
          setProgramas(programasData);
          setProgramasFiltrados([]);
        }
      }
    } catch (error) {
      console.error('Error al guardar programa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al guardar el programa: ' + error.message
      });
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
      const valorUnitarioBase = campo === 'valor_unitario' ? valor : prev.valor_unitario;
      const descuento = campo === 'descuento_plan' ? valor : prev.descuento_plan;
      const recargo = campo === 'recargo_plan' ? valor : prev.recargo_plan;
      
      // Obtener el total de cantidades
      const totalCantidades = prev.cantidades.reduce((sum, item) => {
        return sum + (Number(item.cantidad) || 0);
      }, 0);
  
      // Verificar si el medio es TV CABLE o RADIO
      const medioId = temaSeleccionado?.id_medio;
      const esMediacionEspecial = medioId === 38 || medioId === 35; // TV CABLE o RADIO
  
      // Calcular valor unitario ajustado
      let valorUnitarioAjustado = Number(valorUnitarioBase) || 0;
      if (esMediacionEspecial && totalCantidades > 0) {
        valorUnitarioAjustado *= totalCantidades;
      }
  
      const valorBase = valorUnitarioAjustado;
      const descuentoValor = valorBase * (Number(descuento) / 100) || 0;
      const recargoValor = valorBase * (Number(recargo) / 100) || 0;
  
      const totalBruto = valorBase;
      const totalNeto = (totalBruto - descuentoValor + recargoValor) * 1.19;
  
      return {
        ...prev,
        [campo]: valor,
        total_bruto: Math.round(totalBruto),
        total_neto: Math.round(totalNeto)
      };
    });
  };

  const handleCantidadChange = (dia, valor) => {
    setNuevaAlternativa(prev => {
      let nuevasCantidades = [...prev.cantidades];
      const index = nuevasCantidades.findIndex(item => item.dia === dia);
      
      if (valor && valor !== '0') {
        if (index !== -1) {
          nuevasCantidades[index] = { dia, cantidad: Number(valor) };
        } else {
          nuevasCantidades.push({ dia, cantidad: Number(valor) });
        }
      } else {
        if (index !== -1) {
          nuevasCantidades.splice(index, 1);
        }
      }
  
      nuevasCantidades.sort((a, b) => a.dia - b.dia);
  
      // Recalcular los montos después de actualizar las cantidades
      const totalCantidades = nuevasCantidades.reduce((sum, item) => {
        return sum + (Number(item.cantidad) || 0);
      }, 0);
  
      const medioId = temaSeleccionado?.id_medio;
      const esMediacionEspecial = medioId === 38 || medioId === 35;
  
      let valorUnitario = Number(prev.valor_unitario) || 0;
      if (esMediacionEspecial && totalCantidades > 0) {
        valorUnitario *= totalCantidades;
      }
  
      const descuento = Number(prev.descuento_plan) || 0;
      const recargo = Number(prev.recargo_plan) || 0;
  
      const descuentoValor = valorUnitario * (descuento / 100);
      const recargoValor = valorUnitario * (recargo / 100);
  
      const totalBruto = valorUnitario;
      const totalNeto = (totalBruto - descuentoValor + recargoValor) * 1.19;
  
      return {
        ...prev,
        cantidades: nuevasCantidades,
        total_bruto: Math.round(totalBruto),
        total_neto: Math.round(totalNeto)
      };
    });
  };

  const CalendarioAlternativa = ({ anio, mes, cantidades = [], onChange }) => {
  const dias = getDiasDelMes(anio, mes);
    
  const getCantidad = (dia) => {
    const item = cantidades?.find(c => c.dia === dia);
    return item ? item.cantidad : '';
  };

  const calcularTotal = () => {
    return (cantidades || []).reduce((sum, item) => {
      const cantidad = parseInt(item.cantidad) || 0;
      return sum + cantidad;
    }, 0);
  };
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, color: '#666' }}>
          Calendario de Cantidades
        </Typography>
        <TableContainer sx={{ 
          maxWidth: '100%',
          overflowX: 'auto',
          '& .MuiTable-root': {
            tableLayout: 'fixed',
            minWidth: 'max-content'
          }
        }}>
          <Table size="small" sx={{
            '& .MuiTableCell-root': {
              padding: '4px',
              border: '1px solid #e0e0e0',
              minWidth: '32px',
              maxWidth: '32px'
            }
          }}>
            <TableHead>
              <TableRow>
                {dias.map(({ dia, nombreDia }) => (
                  <TableCell key={dia} align="center" sx={{ backgroundColor: '#f5f5f5' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5, color: '#666' }}>
                      {nombreDia}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#333' }}>
                      {dia}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ backgroundColor: '#f5f5f5', minWidth: '40px' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#333', fontWeight: 'bold' }}>
                    Tot
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {dias.map(({ dia }) => (
                  <TableCell key={dia} align="center" padding="none">
                    <input
                      type="number"
                      value={getCantidad(dia)}
                      onChange={(e) => onChange(dia, e.target.value)}
                      style={{ 
                        width: '28px',
                        height: '24px',
                        padding: '2px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '2px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        backgroundColor: '#fff'
                      }}
                      min="0"
                    />
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ backgroundColor: '#f8f9fa' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#333' }}>
                    {calcularTotal()}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
    try {
      setLoading(true);

      if (!planData || !planData.id) {
        throw new Error('No hay un plan seleccionado');
      }

      // Obtener el plan actual para usar su num_correlativo
      const { data: planActual, error: errorPlan } = await supabase
        .from('plan')
        .select('num_correlativo')
        .eq('id', planData.id)
        .single();

      if (errorPlan) throw errorPlan;
      if (!planActual?.num_correlativo) {
        throw new Error('El plan no tiene un número correlativo asignado');
      }

      // Función para convertir strings vacíos a null
      const cleanValue = (value) => {
        if (value === "") return null;
        if (typeof value === 'string' && !isNaN(value)) return Number(value);
        return value;
      };

      // Filtrar cantidades para solo incluir días con valores
      const calendarData = nuevaAlternativa.cantidades
        .filter(item => item.cantidad && item.cantidad > 0)
        .map(item => ({
          dia: item.dia.toString().padStart(2, '0'),
          cantidad: parseInt(item.cantidad)
        }));

      // Preparar los datos para la tabla alternativa según su estructura real
      const alternativaData = {
        nlinea: nuevaAlternativa.nlinea || null,
        anio: nuevaAlternativa.anio,
        mes: nuevaAlternativa.mes,
        id_campania: nuevaAlternativa.id_campania,
        num_contrato: nuevaAlternativa.num_contrato,
        id_soporte: nuevaAlternativa.id_soporte,
        descripcion: nuevaAlternativa.descripcion || null,
        tipo_item: nuevaAlternativa.tipo_item,
        id_clasificacion: nuevaAlternativa.id_clasificacion,
        detalle: nuevaAlternativa.detalle || null,
        id_tema: nuevaAlternativa.id_tema,
        segundos: nuevaAlternativa.segundos,
        total_general: cleanValue(nuevaAlternativa.total_bruto),
        total_neto: cleanValue(nuevaAlternativa.total_neto),
        descuento_pl: cleanValue(nuevaAlternativa.descuento_plan),
        id_programa: nuevaAlternativa.id_programa,
        recargo_plan: cleanValue(nuevaAlternativa.recargo_plan),
        valor_unitario: cleanValue(nuevaAlternativa.valor_unitario),
        medio: nuevaAlternativa.id_medio,
        total_bruto: cleanValue(nuevaAlternativa.total_bruto),
        calendar: calendarData // Agregando el campo calendar
      };

      console.log('Datos para inserción en alternativa:', alternativaData);

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

      console.log('Datos para inserción en plan_alternativas:', planAlternativaData);

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
    setNuevaAlternativa(prev => ({ 
      ...prev, 
      id_tema: newValue?.id_tema || '',
      segundos: newValue?.segundos || '',
      id_medio: newValue?.id_medio || null
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
            <Typography
              variant="h6"
              sx={{
                color: '#1e293b',
                fontWeight: 600
              }}
            >
              Lista de Alternativas
              {planInfo.campana && (
                <Typography variant="subtitle1" color="text.secondary">
                  Campaña: {planInfo.campana}
                </Typography>
              )}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpenModal(true)}
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
                      <TableCell>{alternativa.tipo_item}</TableCell>
                      <TableCell>{alternativa.Clasificacion?.NombreClasificacion}</TableCell>
                      <TableCell>{alternativa.detalle}</TableCell>
                      <TableCell>{alternativa.Temas?.NombreTema}</TableCell>
                      <TableCell>{alternativa.segundos}</TableCell>
                      <TableCell>{alternativa.Medios?.NombredelMedio}</TableCell>
                      <TableCell>{alternativa.total_bruto}</TableCell>
                      <TableCell>{alternativa.total_neto}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditAlternativa(alternativa.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAlternativa(alternativa.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
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
                              value={temaSeleccionado ? temaSeleccionado.nombre_tema : ''}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      edge="end"
                                      onClick={handleOpenTemasModal}
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
                              onClick={handleOpenTemasModal}
                              sx={{ cursor: 'pointer', width: '100%' }}
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
                                      onClick={() => nuevaAlternativa.num_contrato && handleOpenClasificacionModal()}
                                      disabled={!nuevaAlternativa.num_contrato}
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
                              onClick={() => nuevaAlternativa.num_contrato && handleOpenClasificacionModal()}
                              sx={{ cursor: nuevaAlternativa.num_contrato ? 'pointer' : 'not-allowed', width: '100%' }}
                              helperText={!nuevaAlternativa.num_contrato ? "Primero seleccione un contrato" : ""}
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
                </Grid>
              </Grid>

              <Grid item xs={12} md={3}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Montos
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Valor Unitario"
                        size="small"
                        fullWidth
                        type="number"
                        value={nuevaAlternativa.valor_unitario}
                        onChange={(e) => handleMontoChange('valor_unitario', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PriceChangeIcon sx={{ fontSize: '1.1rem' }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Descuento Plan (%)"
                        size="small"
                        fullWidth
                        type="number"
                        value={nuevaAlternativa.descuento_plan}
                        onChange={(e) => handleMontoChange('descuento_plan', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DiscountIcon sx={{ fontSize: '1.1rem' }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Recargo Plan (%)"
                        size="small"
                        fullWidth
                        type="number"
                        value={nuevaAlternativa.recargo_plan}
                        onChange={(e) => handleMontoChange('recargo_plan', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TrendingUpIcon sx={{ fontSize: '1.1rem' }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Total Bruto"
                        size="small"
                        fullWidth
                        type="number"
                        value={nuevaAlternativa.total_bruto}
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
                        label="Total Neto (con IVA)"
                        size="small"
                        fullWidth
                        type="number"
                        value={nuevaAlternativa.total_neto}
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

            <Box sx={{ mt: 2 }}>
              <CalendarioAlternativa
                anio={nuevaAlternativa.anio}
                mes={nuevaAlternativa.mes}
                cantidades={nuevaAlternativa.cantidades}
                onChange={handleCantidadChange}
              />
            </Box>

          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenModal(false);
              setModoEdicion(false);
              setEditandoAlternativa(null);
              setNuevaAlternativa({
                id_soporte: null,
                id_programa: null,
                estado: true
              });
            }}>
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
                        <TableCell>
                          <Typography color={getEstadoColor(contrato.Estado)}>
                            {contrato.Estado}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Seleccionar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleSeleccionarContrato(contrato)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
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
                      <TableCell colSpan={9} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : temasFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
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
            Seleccionar Soporte
            <IconButton
              aria-label="close"
              onClick={handleCloseSoportesModal}
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
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Buscar Soporte"
                variant="outlined"
                fullWidth
                onChange={(e) => handleSearchSoporte(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
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
                  {(soportesFiltrados.length > 0 ? soportesFiltrados : soportes).map((soporte) => (
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
                  ))}
                  {(soportesFiltrados.length === 0 && soportes.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No se encontraron soportes
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
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
                    <TableCell>Acciones</TableCell>
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
                        <TableCell>
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
                sx={{ mb: 2 }}
              />
              <TextField
                label="Código Programa Megatime"
                fullWidth
                value={newPrograma.cod_prog_megatime}
                onChange={(e) => setNewPrograma({ ...newPrograma, cod_prog_megatime: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Hora Inicio"
                type="time"
                fullWidth
                value={newPrograma.hora_inicio}
                onChange={(e) => setNewPrograma({ ...newPrograma, hora_inicio: e.target.value })}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hora Fin"
                type="time"
                fullWidth
                value={newPrograma.hora_fin}
                onChange={(e) => setNewPrograma({ ...newPrograma, hora_fin: e.target.value })}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
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
