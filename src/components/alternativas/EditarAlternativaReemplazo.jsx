import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating temporary IDs
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    FormControlLabel, Checkbox,
    TextField,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Chip
} from '@mui/material';
import { supabase } from '../../config/supabase';
import Swal from 'sweetalert2';
import { 
    Add as AddIcon, 
    Remove as RemoveIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ModalAgregarContrato from '../../pages/contratos/ModalAgregarContrato';
import ModalEditarContrato from '../../pages/contratos/ModalEditarContrato';
import ModalAgregarTema from '../../pages/campanas/ModalAgregarTema';
// First, let's import the necessary icons at the top of the file
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import SubjectIcon from '@mui/icons-material/Subject';
import TopicIcon from '@mui/icons-material/Topic';
import TvIcon from '@mui/icons-material/Tv';
import TimerIcon from '@mui/icons-material/Timer';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PercentIcon from '@mui/icons-material/Percent';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
const EditarAlternativaReemplazo = ({ 
    alternativaId, 
    onSave, 
    onCancel, 
    isCreatingNew = false,
    initialData = null
}) => {
    const [alternativa, setAlternativa] = useState(null);
    const [loading, setLoading] = useState(false);
    const [clasificaciones, setClasificaciones] = useState([]);
    const [temas, setTemas] = useState([]);
    const [programas, setProgramas] = useState([]);
    const [tempAlternativas, setTempAlternativas] = useState([]);
    const [isAnularReemplazarMode, setIsAnularReemplazarMode] = useState(false);
    // Estado para el calendario
    const [calendarData, setCalendarData] = useState([]);
    const [daysInMonth, setDaysInMonth] = useState([]);
    const [planInfo, setPlanInfo] = useState(null);

    // Estados para modales
    const [openTemasModal, setOpenTemasModal] = useState(false);
    const [openSoportesModal, setOpenSoportesModal] = useState(false);
    const [openProgramasModal, setOpenProgramasModal] = useState(false);
    const [openClasificacionModal, setOpenClasificacionModal] = useState(false);
    const [openAddContratoModal, setOpenAddContratoModal] = useState(false);
    const [openEditContratoModal, setOpenEditContratoModal] = useState(false);
    const [openAddTemaModal, setOpenAddTemaModal] = useState(false);
  const [openAddEditProgramaModal, setOpenAddEditProgramaModal] = useState(false);
  const [openAddEditClasificacionModal, setOpenAddEditClasificacionModal] = useState(false);
  const cantidadesRef = React.useRef({});
  const [autoFillCantidades, setAutoFillCantidades] = useState(false);
    
    // Estados para búsqueda y filtrado
    const [searchTema, setSearchTema] = useState('');
    const [searchPrograma, setSearchPrograma] = useState('');
    const [searchClasificacion, setSearchClasificacion] = useState('');
    const [temasFiltrados, setTemasFiltrados] = useState([]);
    const [programasFiltrados, setProgramasFiltrados] = useState([]);
    const [clasificacionesList, setClasificacionesList] = useState([]);
    const [soportes, setSoportes] = useState([]);
    const [soportesFiltrados, setSoportesFiltrados] = useState([]);
    
    // Estados para edición
    const [editingClasificacion, setEditingClasificacion] = useState(null);
    const [nuevaClasificacion, setNuevaClasificacion] = useState({ NombreClasificacion: '' });
    const [editingPrograma, setEditingPrograma] = useState(null);
    const [newPrograma, setNewPrograma] = useState({
        descripcion: '',
        codigo_programa: '',
        cod_prog_megatime: '',
        hora_inicio: '',
        hora_fin: ''
    });

    const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
    const [clienteId, setClienteId] = useState(null);
    const [campaniaId, setCampaniaId] = useState(null);
    const [loadingTemas, setLoadingTemas] = useState(false);
    const [loadingProgramas, setLoadingProgramas] = useState(false);
    const [loadingClasificaciones, setLoadingClasificaciones] = useState(false);
// Modificar el useEffect para que reaccione cuando se obtenga el medio del contrato
useEffect(() => {
    // Si estamos editando una alternativa existente
    if (alternativa && (alternativa.Contratos?.IdMedios || alternativa.medio)) {
        const medioId = alternativa.Contratos?.IdMedios || alternativa.medio;
        console.log('Detectado cambio en medio ID:', medioId);
        fetchClasificacionesByMedioId(medioId);
    } 
    // Si estamos creando una nueva alternativa y tenemos initialData con información del medio
    else if (isCreatingNew && initialData) {
        // Intentar obtener el ID del medio desde initialData
        const medioId = initialData.IdMedios || initialData.medio || 
                        (initialData.Contratos && initialData.Contratos.IdMedios);
        
        if (medioId) {
            console.log('Creando nueva alternativa - Aplicando filtro por medio ID:', medioId);
            fetchClasificacionesByMedioId(medioId);
        }
    }
}, [alternativa?.Contratos?.IdMedios, alternativa?.medio, isCreatingNew, initialData]);

// Añadir un nuevo useEffect para reaccionar cuando se selecciona un contrato
useEffect(() => {
    if (alternativa?.num_contrato && !alternativa.Contratos?.IdMedios && !alternativa.medio) {
        // Si tenemos un contrato seleccionado pero no tenemos el medio, obtenerlo
        const fetchMedioFromContrato = async () => {
            try {
                const { data, error } = await supabase
                    .from('Contratos')
                    .select('IdMedios')
                    .eq('id', alternativa.num_contrato)
                    .single();
                
                if (error) throw error;
                
                if (data && data.IdMedios) {
                    console.log('Medio ID obtenido de contrato seleccionado:', data.IdMedios);
                    // Actualizar la alternativa con el medio obtenido
                    setAlternativa(prev => ({
                        ...prev,
                        medio: data.IdMedios
                    }));
                    // Cargar clasificaciones filtradas por este medio
                    fetchClasificacionesByMedioId(data.IdMedios);
                }
            } catch (error) {
                console.error('Error al obtener medio del contrato:', error);
            }
        };
        
        fetchMedioFromContrato();
    }
}, [alternativa?.num_contrato]);
    const fetchClasificacionesByMedioId = async (medioId) => {
        try {
            setLoadingClasificaciones(true);
            
            console.log('Obteniendo clasificaciones para medio ID:', medioId);
            
            const { data, error } = await supabase
                .from('Clasificacion')
                .select('*')
                .eq('IdMedios', medioId);
            
            if (error) throw error;
            
            console.log('Clasificaciones filtradas por medio:', data);
            setClasificaciones(data || []);
            setClasificacionesList(data || []);
        } catch (error) {
            console.error('Error al cargar clasificaciones por medio ID:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las clasificaciones'
            });
        } finally {
            setLoadingClasificaciones(false);
        }
    };
    const handleSearchClasificacion = (searchTerm) => {
        setSearchClasificacion(searchTerm);
        setLoadingClasificaciones(true);
        
        if (!searchTerm.trim()) {
            setClasificacionesList(clasificaciones);
            setLoadingClasificaciones(false);
            return;
        }
        
        const filtered = clasificaciones.filter(
            clasificacion => clasificacion.NombreClasificacion.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setClasificacionesList(filtered);
        setLoadingClasificaciones(false);
    };
    
    // Funciones para manejar modales
    const handleOpenTemasModal = () => {
        fetchTemasFiltrados();
        setOpenTemasModal(true);
    };
    const handleCloseTemasModal = () => setOpenTemasModal(false);
    const fetchClasificaciones = async () => {
        try {
            setLoadingClasificaciones(true);
            
            // Obtener el ID del medio desde la alternativa
            const medioId = alternativa?.Contratos?.IdMedios;
            console.log('Aplicando filtro por medio ID:', medioId);
            
            let query = supabase.from('Clasificacion').select('*');
            
            // Si tenemos un ID de medio, filtrar por él
            if (medioId) {
                query = query.eq('IdMedios', medioId);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            console.log('Clasificaciones filtradas por medio:', data);
            setClasificaciones(data || []);
            setClasificacionesList(data || []);
        } catch (error) {
            console.error('Error al cargar clasificaciones:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las clasificaciones'
            });
        } finally {
            setLoadingClasificaciones(false);
        }
    };
    const handleOpenSoportesModal = () => setOpenSoportesModal(true);
    const handleCloseSoportesModal = () => setOpenSoportesModal(false);
    
    const handleOpenProgramasModal = () => {
        handleSearchPrograma('');
        setOpenProgramasModal(true);
    };
    const handleCloseProgramasModal = () => setOpenProgramasModal(false);
    
    const handleOpenClasificacionModal = () => {
        // Obtener el ID del medio desde diferentes fuentes posibles
        let medioId = null;
        
        // Si estamos editando una alternativa existente
        if (alternativa && alternativa.Contratos && alternativa.Contratos.IdMedios) {
            medioId = alternativa.Contratos.IdMedios;
        } else if (alternativa && alternativa.medio) {
            medioId = alternativa.medio;
        } else if (alternativa && alternativa.num_contrato) {
            // Si tenemos un contrato pero no el medio, obtenerlo de forma síncrona
            // Usamos la última consulta exitosa que ya tenemos en el log
            console.log('Usando medio ID del contrato seleccionado:', medioId);
        }
        
        if (medioId) {
            // Si tenemos un medio ID, usar la función que filtra por medio
            fetchClasificacionesByMedioId(medioId);
        } else {
            // Si no tenemos un medio ID, mostrar un mensaje de advertencia
            console.warn('No se pudo determinar el medio para filtrar clasificaciones');
            // Opcionalmente, puedes mostrar un mensaje al usuario
            // Swal.fire({
            //     icon: 'warning',
            //     title: 'Advertencia',
            //     text: 'No se pudo determinar el medio para filtrar clasificaciones'
            // });
        }
        
        handleSearchClasificacion('');
        setOpenClasificacionModal(true);
    };
    const handleCloseClasificacionModal = () => setOpenClasificacionModal(false);
    
    const handleOpenAddContratoModal = () => setOpenAddContratoModal(true);
    const handleCloseAddContratoModal = () => setOpenAddContratoModal(false);
    
    const handleOpenEditContratoModal = (contrato) => {
        setContratoSeleccionado(contrato);
        setOpenEditContratoModal(true);
    };
    const handleCloseEditContratoModal = () => setOpenEditContratoModal(false);
    const loadSoportesParaPrograma = async (soporteId) => {
        try {
          setLoading(true);
          
          // Obtener información del soporte
          const { data: soporteData, error: soporteError } = await supabase
            .from('Soportes')
            .select('*')
            .eq('id_soporte', soporteId)
            .single();
          
          if (soporteError) throw soporteError;
          
          // Actualizar la alternativa con la información del soporte
          setAlternativa(prev => ({
            ...prev,
            id_soporte: soporteId,
            soporte: soporteData.nombreIdentficiador,
            bonificacion_ano: soporteData.bonificacion_ano || 0,
            escala: soporteData.escala || 0
          }));
          
          // Cargar programas asociados al soporte
          const { data: programasData, error: programasError } = await supabase
            .from('Programas')
            .select('*')
            .eq('id_soporte', soporteId);
          
          if (programasError) throw programasError;
          
          // Procesar los datos de programas para incluir hora_inicio_hora y hora_inicio_min
          const programasProcesados = programasData.map(programa => {
            // Separar hora_inicio en hora y minutos
            const [hora_inicio_hora = "00", hora_inicio_min = "00"] = (programa.hora_inicio || "00:00").split(":");
            // Separar hora_fin en hora y minutos
            const [hora_fin_hora = "00", hora_fin_min = "00"] = (programa.hora_fin || "00:00").split(":");
            
            return {
              ...programa,
              hora_inicio_hora,
              hora_inicio_min,
              hora_fin_hora,
              hora_fin_min
            };
          });
          
          setProgramas(programasProcesados || []);
          
        } catch (error) {
          console.error('Error al cargar soporte y programas:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del soporte y programas'
          });
        } finally {
          setLoading(false);
        }
      };
    const handleOpenAddTemaModal = () => setOpenAddTemaModal(true);
    const handleCloseAddTemaModal = () => setOpenAddTemaModal(false);
    const handleOpenAddEditProgramaModal = (programa = null) => {
        if (programa) {
          // Si estamos editando un programa existente
          // Separar hora_inicio en hora y minutos
          const [hora_inicio_hora = "00", hora_inicio_min = "00"] = (programa.hora_inicio || "00:00").split(":");
          // Separar hora_fin en hora y minutos
          const [hora_fin_hora = "00", hora_fin_min = "00"] = (programa.hora_fin || "00:00").split(":");
          
          setNewPrograma({
            id: programa.id,
            descripcion: programa.descripcion || '',
            codigo_programa: programa.codigo_programa || '',
            cod_prog_megatime: programa.cod_prog_megatime || '',
            hora_inicio: programa.hora_inicio || '',
            hora_fin: programa.hora_fin || '',
            hora_inicio_hora,
            hora_inicio_min,
            hora_fin_hora,
            hora_fin_min,
            id_soporte: programa.id_soporte
          });
          setEditingPrograma(programa);
        } else {
          // Si estamos creando un nuevo programa
          setNewPrograma({
            descripcion: '',
            codigo_programa: '',
            cod_prog_megatime: '',
            hora_inicio: '',
            hora_fin: '',
            hora_inicio_hora: '00',
            hora_inicio_min: '00',
            hora_fin_hora: '00',
            hora_fin_min: '00',
            id_soporte: alternativa?.id_soporte || null
          });
          setEditingPrograma(null);
        }
        setOpenAddEditProgramaModal(true);
      };
      const handleCloseAddEditProgramaModal = () => {
        setOpenAddEditProgramaModal(false);
        setNewPrograma({
          descripcion: '',
          codigo_programa: '',
          cod_prog_megatime: '',
          hora_inicio: '',
          hora_fin: '',
          hora_inicio_hora: '00',
          hora_inicio_min: '00',
          hora_fin_hora: '00',
          hora_fin_min: '00'
        });
        setEditingPrograma(null);
      };
    const handleOpenAddEditClasificacionModal = (clasificacion = null) => {
        if (clasificacion) {
            setEditingClasificacion(clasificacion);
            setNuevaClasificacion({
                NombreClasificacion: clasificacion.NombreClasificacion || ''
            });
        } else {
            setEditingClasificacion(null);
            setNuevaClasificacion({ NombreClasificacion: '' });
        }
        setOpenAddEditClasificacionModal(true);
    };
    const handleCloseAddEditClasificacionModal = () => setOpenAddEditClasificacionModal(false);
    useEffect(() => {
      if (isAnularReemplazarMode && alternativa) {
          // Initialize with existing alternatives from the order
          const fetchAlternativasDeOrden = async () => {
              try {
                  const { data, error } = await supabase
                      .from('alternativa')
                      .select('*')
                      .eq('id_orden', alternativa.id_orden);
                  
                  if (error) throw error;
                  
                  // Add a temporary flag to identify these as existing alternatives
                  const alternativasConFlag = data.map(alt => ({
                      ...alt,
                      _tempStatus: 'existing' // existing, new, modified, deleted
                  }));
                  
                  setTempAlternativas(alternativasConFlag);
              } catch (error) {
                  console.error('Error al cargar alternativas de la orden:', error);
              }
          };
          
          fetchAlternativasDeOrden();
      }
  }, [isAnularReemplazarMode, alternativa?.id_orden]);
// Add this function near the top of your component
const debugSessionStorage = () => {
  try {
      const tempAlternativasStr = sessionStorage.getItem('tempAlternativas');
      console.log("DEBUG - tempAlternativas en sessionStorage:", tempAlternativasStr);
      
      if (tempAlternativasStr) {
          const tempAlternativas = JSON.parse(tempAlternativasStr);
          console.log("DEBUG - tempAlternativas parseado:", tempAlternativas);
          
          if (alternativaId && alternativaId.toString().startsWith('temp_')) {
              const found = tempAlternativas.find(alt => alt.id === alternativaId);
              console.log(`DEBUG - Alternativa con ID ${alternativaId} encontrada:`, found);
          }
      }
      
      console.log("DEBUG - window.tempAlternativasState:", window.tempAlternativasState);
  } catch (error) {
      console.error("Error en debugSessionStorage:", error);
  }
};

// Call this in useEffect
useEffect(() => {
  // Initialize global temporary alternatives state if it doesn't exist
  if (!window.tempAlternativasState) {
      const storedTempAlternativas = JSON.parse(sessionStorage.getItem('tempAlternativas') || '[]');
      window.tempAlternativasState = storedTempAlternativas;
  }
  
  // Debug session storage
  debugSessionStorage();
  
  return () => {
      // Optional cleanup if needed
  };
}, []);
  // Function to handle adding a new alternative to the temporary storage
const handleAddTempAlternativa = (newAlternativa) => {
  // Generate a temporary ID for new alternatives
  const tempId = `temp_${uuidv4()}`;
  
  setTempAlternativas(prev => [
      ...prev,
      {
          ...newAlternativa,
          id: tempId,
          _tempStatus: 'new'
      }
  ]);
};
// Function to handle editing an alternative in the temporary storage
const handleEditTempAlternativa = (editedAlternativa) => {
  setTempAlternativas(prev => 
      prev.map(alt => 
          alt.id === editedAlternativa.id 
              ? { 
                  ...editedAlternativa, 
                  _tempStatus: alt._tempStatus === 'new' ? 'new' : 'modified' 
              } 
              : alt
      )
  );
};
// Function to handle deleting an alternative from the temporary storage
const handleDeleteTempAlternativa = (alternativaId) => {
  setTempAlternativas(prev => {
      // If it's a new alternative, remove it completely
      if (prev.find(alt => alt.id === alternativaId)?._tempStatus === 'new') {
          return prev.filter(alt => alt.id !== alternativaId);
      }
      
      // If it's an existing alternative, mark it as deleted
      return prev.map(alt => 
          alt.id === alternativaId 
              ? { ...alt, _tempStatus: 'deleted' } 
              : alt
      );
  });
};
// Function to prepare alternatives for saving when finalizing the replacement order
const prepareAlternativasForSave = (newOrderId, numeroCorrelativo) => {
  // Filter out deleted alternatives
  const alternativasToSave = tempAlternativas.filter(alt => alt._tempStatus !== 'deleted');
  
  // Prepare alternatives for insertion/update
  return alternativasToSave.map(alt => {
      // Remove temporary properties and fields that don't exist in the database
      const { 
          _tempStatus, 
          _originalData, 
          id_orden,
          id_contrato, // This doesn't exist, should be num_contrato
          Anios, 
          Meses, 
          Contratos, 
          Soportes, 
          Clasificacion, 
          Temas, 
          Programas, 
          Medios,
          ...cleanAlt 
      } = alt;
      
      // If the ID is temporary, remove it so the database can generate a new one
      if (cleanAlt.id && cleanAlt.id.toString().startsWith('temp_')) {
          delete cleanAlt.id;
      }
      
      // Ensure calendar is properly formatted as JSON string
      if (cleanAlt.cantidades && Array.isArray(cleanAlt.cantidades)) {
          cleanAlt.calendar = JSON.stringify(cleanAlt.cantidades);
          delete cleanAlt.cantidades;
      } else if (cleanAlt.calendar && typeof cleanAlt.calendar !== 'string') {
          cleanAlt.calendar = JSON.stringify(cleanAlt.calendar);
      }
      
      // Make sure we're using the correct field names
      if (id_contrato) {
          cleanAlt.num_contrato = id_contrato;
      }
      
      // Update with new order ID as numerorden
      return {
          ...cleanAlt,
          numerorden: newOrderId,
          multiplicar_valor: Boolean(cleanAlt.multiplicar_valor_unitario)
      };
  });
};

    // Efecto para sincronizar el calendario cuando cambia la alternativa
    useEffect(() => {
      if (alternativa && alternativa.id) {
          // Si la alternativa tiene datos de calendario, procesarlos
          if (alternativa.calendar) {
              try {
                  let calendarArray = [];
                  if (typeof alternativa.calendar === 'string') {
                      calendarArray = JSON.parse(alternativa.calendar);
                  } else if (Array.isArray(alternativa.calendar)) {
                      calendarArray = alternativa.calendar;
                  }
                  
                  // Actualizar el estado de cantidades en el objeto alternativa
                  setAlternativa(prev => ({
                      ...prev,
                      cantidades: calendarArray
                  }));
                  
                  // También actualizar el estado separado de calendarData
                  setCalendarData(calendarArray);
                  
                  console.log("Calendar data synchronized:", calendarArray);
              } catch (error) {
                  console.error('Error al sincronizar el calendario:', error);
              }
          }
      }
  }, [alternativa?.id, alternativa?.calendar]);
 // Función para procesar los datos del calendario al cargar
 useEffect(() => {
  if (alternativa && alternativa.calendar) {
      try {
          // Intentar parsear el calendario si viene como string JSON
          let calendarData;
          if (typeof alternativa.calendar === 'string') {
              calendarData = JSON.parse(alternativa.calendar);
          } else if (Array.isArray(alternativa.calendar)) {
              calendarData = alternativa.calendar;
          }
          
          if (calendarData && Array.isArray(calendarData)) {
              // Actualizar el estado de cantidades con los datos del calendario
              setAlternativa(prev => ({
                  ...prev,
                  cantidades: calendarData
              }));
          }
      } catch (error) {
          console.error('Error al parsear datos del calendario:', error);
      }
  }
}, [alternativa?.id]);
    // Funciones para búsqueda y filtrado
    const fetchTemasFiltrados = async () => {
        try {
            setLoadingTemas(true);
            
            // Primero, si tenemos una campaña seleccionada, obtenemos los IDs de temas relacionados
            let temasIds = [];
            if (alternativa.id_campania) {
                const { data: relacionesTemas, error: errorRelaciones } = await supabase
                    .from('campania_temas')
                    .select('id_temas')
                    .eq('id_campania', alternativa.id_campania);
                
                if (errorRelaciones) throw errorRelaciones;
                
                if (relacionesTemas && relacionesTemas.length > 0) {
                    temasIds = relacionesTemas.map(rel => rel.id_temas);
                }
            }
            
            // Ahora construimos la consulta para obtener los temas
            let query = supabase
                .from('Temas')
                .select(`
                  id_tema,
                  NombreTema,
                  Duracion,
                  CodigoMegatime,
                  id_medio,
                  id_Calidad,
                  color,
                  cooperado,
                  rubro,
                  Medios:id_medio (
                    id,
                    NombredelMedio
                  ),
                  Calidad:id_Calidad (
                    id,
                    NombreCalidad
                  )
                `)
                .order('NombreTema');
            
            // Obtener el medio del contrato
            let medioId = null;
            
            // Verificar todas las posibles fuentes del ID del medio
            if (alternativa && alternativa.Contratos && alternativa.Contratos.IdMedios) {
                medioId = alternativa.Contratos.IdMedios;
                console.log("Medio ID obtenido de alternativa.Contratos.IdMedios:", medioId);
            } else if (alternativa && alternativa.medio) {
                medioId = alternativa.medio;
                console.log("Medio ID obtenido de alternativa.medio:", medioId);
            } else if (alternativa && alternativa.Medios && alternativa.Medios.id) {
                medioId = alternativa.Medios.id;
                console.log("Medio ID obtenido de alternativa.Medios.id:", medioId);
            } else if (alternativa && alternativa.num_contrato) {
                // Si tenemos el ID del contrato pero no el medio, intentamos obtenerlo
                try {
                    const { data: contratoData, error: contratoError } = await supabase
                        .from('Contratos')
                        .select('IdMedios')
                        .eq('id', alternativa.num_contrato)
                        .single();
                    
                    if (!contratoError && contratoData) {
                        medioId = contratoData.IdMedios;
                        console.log("Medio ID obtenido de consulta a Contratos:", medioId);
                    }
                } catch (err) {
                    console.error("Error al obtener medio del contrato:", err);
                }
            }
            
            // Si tenemos un ID de medio, filtramos por él
            if (medioId) {
                console.log("Aplicando filtro por medio ID:", medioId);
                query = query.eq('id_medio', medioId);
            } else {
                console.log("No se pudo determinar el medio del contrato, mostrando todos los temas");
            }
            
            // Si tenemos IDs de temas relacionados con la campaña, filtramos por ellos
            if (alternativa.id_campania && temasIds.length > 0) {
                query = query.in('id_tema', temasIds);
            }
            
            // Filtrar por búsqueda si existe
            if (searchTema) {
                query = query.ilike('NombreTema', `%${searchTema}%`);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            console.log("Temas filtrados:", data);
            setTemasFiltrados(data || []);
        } catch (error) {
            console.error('Error al obtener temas:', error);
        } finally {
            setLoadingTemas(false);
        }
      };
  // Función para manejar cambios en los montos
     // Función para manejar cambios en los montos
  const handleMontoChange = (campo, valor) => {
       setAlternativa(prev => {
         const tipoGeneracionOrden = prev.Contratos?.id_GeneraracionOrdenTipo || 1;
         const valorNumerico = Number(valor) || 0;
         const updated = { ...prev };
         updated[campo] = valorNumerico;
         const valorUnitario = campo === 'valor_unitario' ? valorNumerico : Number(prev.valor_unitario) || 0;
         const descuento = campo === 'descuento_pl' ? valorNumerico : Number(prev.descuento_pl) || 0;
         const recargo = campo === 'recargo_plan' ? valorNumerico : Number(prev.recargo_plan) || 0;
         const sourceCantidadesArray = Object.keys(cantidadesRef.current).length > 0
           ? Object.entries(cantidadesRef.current)
               .filter(([, c]) => c !== '' && c !== null && c !== undefined)
               .map(([d, c]) => ({ dia: d, cantidad: c }))
           : (prev.cantidades || []);
         const totalCantidades = sourceCantidadesArray.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
         const multiplicador = prev.multiplicar_valor_unitario ? (totalCantidades > 0 ? totalCantidades : 1) : 1;
         let totalBruto = 0;
         let totalNeto = 0;
         if (tipoGeneracionOrden === 1) {
           const totalNetoBase = valorUnitario * multiplicador;
           let totalConDescuento = totalNetoBase;
           if (descuento > 0) totalConDescuento = totalNetoBase - (totalNetoBase * (descuento / 100));
           if (recargo > 0) totalNeto = totalConDescuento + (totalConDescuento * (recargo / 100));
           else totalNeto = totalConDescuento;
           totalBruto = Math.round(totalNeto / 0.85);
         } else {
           const totalBrutoBase = valorUnitario * multiplicador;
           let totalConDescuento = totalBrutoBase;
           if (descuento > 0) totalConDescuento = totalBrutoBase - (totalBrutoBase * (descuento / 100));
           if (recargo > 0) totalBruto = totalConDescuento + (totalConDescuento * (recargo / 100));
           else totalBruto = totalConDescuento;
           totalNeto = Math.round(totalBruto * 0.85);
         }
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

   // Función para manejar cambios en las cantidades del calendario
   const handleCantidadChange = (dia, valor) => {
    // Convertir el valor a número o mantenerlo vacío
    const cantidad = valor === '' ? '' : Number(valor);
    
    // Actualizar el estado de calendarData
    setCalendarData(prev => {
        const existingIndex = prev.findIndex(item => item.dia === dia);
        
        if (cantidad === '' || isNaN(cantidad) || cantidad === 0) {
            // Si el valor es vacío, no es un número o es cero, eliminar la entrada
            if (existingIndex >= 0) {
                return prev.filter(item => item.dia !== dia);
            }
            return prev;
        } else {
            // Actualizar o agregar el valor
            if (existingIndex >= 0) {
                const newData = [...prev];
                newData[existingIndex] = { dia, cantidad };
                return newData;
            } else {
                return [...prev, { dia, cantidad }];
            }
        }
    });
    
    // Actualizar también el estado de alternativa.cantidades
    setAlternativa(prev => {
        const nuevasCantidades = [...(prev.cantidades || [])];
        const index = nuevasCantidades.findIndex(item => item.dia === dia);
        
        if (cantidad === '' || isNaN(cantidad) || cantidad === 0) {
            // Si el valor es vacío, no es un número o es cero, eliminar la entrada
            if (index !== -1) {
                nuevasCantidades.splice(index, 1);
            }
        } else {
            // Actualizar o agregar el valor
            if (index !== -1) {
                nuevasCantidades[index] = { dia, cantidad };
            } else {
                nuevasCantidades.push({ dia, cantidad });
            }
        }
        
        nuevasCantidades.sort((a, b) => a.dia - b.dia);
        
        // Recalcular los montos después de actualizar las cantidades
        const totalCantidades = nuevasCantidades.reduce((sum, item) => {
            return sum + (Number(item.cantidad) || 0);
        }, 0);
    
        const medioId = prev.id_medio;
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
            total_neto: Math.round(totalNeto),
            total_general: Math.round(totalBruto)
        };
    });
};
    const handleSearchPrograma = async (search = '') => {
        setLoadingProgramas(true);
        try {
            let query = supabase
                .from('Programas')
                .select('*')
                .order('codigo_programa');
            
            // Si tenemos un soporte seleccionado, filtramos por ese soporte
            if (alternativa.id_soporte) {
                query = query.eq('soporte_id', alternativa.id_soporte);
            }
            
            if (search) {
                query = query.or(`descripcion.ilike.%${search}%,codigo_programa.ilike.%${search}%`);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            setProgramasFiltrados(data || []);
        } catch (error) {
            console.error('Error al buscar programas:', error);
        } finally {
            setLoadingProgramas(false);
        }
    };

    const handleSearchSoporte = (search) => {
        if (!search) {
            setSoportesFiltrados([]);
            return;
        }
        
        const filtrados = soportes.filter(soporte => 
            soporte.nombreIdentficiador.toLowerCase().includes(search.toLowerCase())
        );
        setSoportesFiltrados(filtrados);
    };
    const handleSearchContrato = async () => {
        // Implementar según necesidad
    };
        // Función para seleccionar un tema
        const handleSeleccionarTema = (tema) => {
          console.log("Tema seleccionado:", tema); // Para depuración
          setAlternativa(prev => ({
              ...prev,
              id_tema: tema.id_tema,
              id_medio: tema.id_medio,
              Temas: tema, // Guardamos el objeto completo para acceder a todas sus propiedades
              Medios: tema.Medios // Guardamos la información del medio asociado
          }));
          handleCloseTemasModal();
      };
        const handleSeleccionarSoporte = (soporte) => {
            setAlternativa(prev => ({
                ...prev,
                id_soporte: soporte.id_soporte,
                Soportes: soporte
            }));
            handleCloseSoportesModal();
        };
    
        const handleSeleccionarPrograma = (programa) => {
            setAlternativa(prev => ({
                ...prev,
                id_programa: programa.id,
                Programas: programa
            }));
            handleCloseProgramasModal();
        };
    
        const handleSeleccionarClasificacion = (clasificacion) => {
            setAlternativa(prev => ({
                ...prev,
                id_clasificacion: clasificacion.id,
                Clasificacion: clasificacion
            }));
            handleCloseClasificacionModal();
        };
            // Funciones para guardar
            const handleSaveClasificacion = async () => {
                if (!nuevaClasificacion.NombreClasificacion.trim()) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'El nombre de la clasificación es requerido'
                    });
                    return;
                }
                
                try {
                    setLoadingClasificaciones(true);
                    
                    // Obtener el ID del medio desde todas las fuentes posibles
                    let medioId = null;
                    
                    // Si estamos editando una alternativa existente
                    if (alternativa && alternativa.Contratos && alternativa.Contratos.IdMedios) {
                        medioId = alternativa.Contratos.IdMedios;
                        console.log('Usando medio ID de alternativa.Contratos.IdMedios:', medioId);
                    } else if (alternativa && alternativa.medio) {
                        medioId = alternativa.medio;
                        console.log('Usando medio ID de alternativa.medio:', medioId);
                    } else if (alternativa && alternativa.num_contrato) {
                        // Intentar obtener el medio del contrato seleccionado
                        try {
                            const { data, error } = await supabase
                                .from('Contratos')
                                .select('IdMedios')
                                .eq('id', alternativa.num_contrato)
                                .single();
                            
                            if (!error && data && data.IdMedios) {
                                medioId = data.IdMedios;
                                console.log('Usando medio ID obtenido del contrato seleccionado:', medioId);
                            }
                        } catch (err) {
                            console.error('Error al obtener medio del contrato:', err);
                        }
                    }
                    
                    // Si aún no tenemos el medio ID, intentar obtenerlo de las clasificaciones filtradas
                    if (!medioId && clasificaciones.length > 0 && clasificaciones[0].IdMedios) {
                        medioId = clasificaciones[0].IdMedios;
                        console.log('Usando medio ID de las clasificaciones filtradas:', medioId);
                    }
                    
                    if (!medioId && !editingClasificacion) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo determinar el medio para asociar la clasificación'
                        });
                        setLoadingClasificaciones(false);
                        return;
                    }
                    
                    if (editingClasificacion) {
                        // Actualizar clasificación existente
                        const { error } = await supabase
                            .from('Clasificacion')
                            .update({ 
                                NombreClasificacion: nuevaClasificacion.NombreClasificacion 
                            })
                            .eq('id', editingClasificacion.id);
                            
                        if (error) throw error;
                        
                        // Actualizar la lista local
                        setClasificaciones(prevClasificaciones => 
                            prevClasificaciones.map(c => 
                                c.id === editingClasificacion.id 
                                    ? { ...c, NombreClasificacion: nuevaClasificacion.NombreClasificacion } 
                                    : c
                            )
                        );
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Éxito',
                            text: 'Clasificación actualizada correctamente',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } else {
                        // Crear nueva clasificación CON el ID del medio
                        const { data, error } = await supabase
                            .from('Clasificacion')
                            .insert({ 
                                NombreClasificacion: nuevaClasificacion.NombreClasificacion,
                                IdMedios: medioId // Añadir el ID del medio
                            })
                            .select();
                            
                        if (error) throw error;
                        
                        // Agregar a la lista local
                        setClasificaciones(prev => [...prev, data[0]]);
                        setClasificacionesList(prev => [...prev, data[0]]);
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Éxito',
                            text: 'Clasificación creada correctamente',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                    
                    // Limpiar y cerrar el modal
                    setNuevaClasificacion({ NombreClasificacion: '' });
                    setEditingClasificacion(null);
                    setOpenAddEditClasificacionModal(false);
                    
                } catch (error) {
                    console.error('Error al guardar clasificación:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo guardar la clasificación'
                    });
                } finally {
                    setLoadingClasificaciones(false);
                }
            };
            const handleDeleteClasificacion = async (id) => {
                try {
                    const result = await Swal.fire({
                        title: '¿Estás seguro?',
                        text: "Esta acción no se puede revertir",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar'
                    });
                    
                    if (result.isConfirmed) {
                        setLoadingClasificaciones(true);
                        
                        const { error } = await supabase
                            .from('Clasificacion')
                            .delete()
                            .eq('id', id);
                            
                        if (error) throw error;
                        
                        // Actualizar la lista local
                        setClasificaciones(prev => prev.filter(c => c.id !== id));
                        setClasificacionesList(prev => prev.filter(c => c.id !== id));
                        
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            text: 'Clasificación eliminada correctamente',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    console.error('Error al eliminar clasificación:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo eliminar la clasificación'
                    });
                } finally {
                    setLoadingClasificaciones(false);
                }
            };
            const handleSelectClasificacion = (clasificacion) => {
                // Actualizar el estado de la alternativa con la clasificación seleccionada
                setAlternativa(prev => {
                    const updated = {
                        ...prev,
                        id_clasificacion: clasificacion.id,
                        clasificacion: clasificacion.NombreClasificacion
                    };
                    console.log('Estado de alternativa actualizado:', updated);
                    return updated;
                });
                
                // Cerrar el modal de clasificación
                setOpenClasificacionModal(false);
                console.log('Clasificación seleccionada:', clasificacion);
            };
            const handleSavePrograma = async () => {
                try {
                  setLoading(true);
                  
                  // Validar que los campos requeridos estén completos
                  if (!newPrograma.descripcion) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Campos incompletos',
                      text: 'La descripción del programa es obligatoria'
                    });
                    return;
                  }
                  if (!newPrograma.id_soporte) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Campos incompletos',
                      text: 'Por favor seleccione un soporte'
                    });
                    return;
                  }
                  
                  // Validar que se hayan seleccionado horas y minutos
                  if (!newPrograma.hora_inicio_hora || !newPrograma.hora_inicio_min) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Campos incompletos',
                      text: 'Por favor complete la hora de inicio (hora y minutos)'
                    });
                    return;
                  }
                  
                  if (!newPrograma.hora_fin_hora || !newPrograma.hora_fin_min) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Campos incompletos',
                      text: 'Por favor complete la hora de fin (hora y minutos)'
                    });
                    return;
                  }
                  
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
                  
                  console.log('Próximo código Megatime a usar:', nextCodProgMegatime);
                  
                  // Combinar hora y minutos para formar hora_inicio y hora_fin
                  const hora_inicio = `${newPrograma.hora_inicio_hora}:${newPrograma.hora_inicio_min}`;
                  const hora_fin = `${newPrograma.hora_fin_hora}:${newPrograma.hora_fin_min}`;
                  
                  // Preparar datos del programa
                  const programaData = {
                    descripcion: newPrograma.descripcion,
                    hora_inicio: hora_inicio,
                    hora_fin: hora_fin,
                    codigo_programa: newPrograma.codigo_programa || '',
                    soporte_id: newPrograma.id_soporte, // AQUÍ ESTÁ EL CAMBIO: usar soporte_id en lugar de id_soporte
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
                    id_soporte: ''
                  });
                  setEditingPrograma(null);
                  
                  // Actualizar la lista de programas
                  if (newPrograma.id_soporte) {
                    // Consulta para obtener la lista actualizada
                    const { data: programasActualizados, error: errorProgramas } = await supabase
                      .from('Programas')
                      .select('*')
                      .eq('soporte_id', newPrograma.id_soporte) // AQUÍ TAMBIÉN: usar soporte_id en lugar de id_soporte
                      .eq('estado', true)
                      .order('descripcion', { ascending: true });
                    
                    if (!errorProgramas) {
                      // Procesar los datos para incluir hora_inicio_hora, hora_inicio_min, etc.
                      const programasProcesados = (programasActualizados || []).map(programa => {
                        // Separar hora_inicio en hora y minutos
                        const [hora_inicio_hora = "00", hora_inicio_min = "00"] = (programa.hora_inicio || "00:00").split(":");
                        // Separar hora_fin en hora y minutos
                        const [hora_fin_hora = "00", hora_fin_min = "00"] = (programa.hora_fin || "00:00").split(":");
                        
                        return {
                          ...programa,
                          hora_inicio_hora,
                          hora_inicio_min,
                          hora_fin_hora,
                          hora_fin_min
                        };
                      });
                      
                      setProgramas(programasProcesados);
                      
                      // Actualizar también la lista filtrada
                      if (searchPrograma) {
                        const filtrados = programasProcesados.filter(programa => 
                          programa.descripcion.toLowerCase().includes(searchPrograma.toLowerCase())
                        );
                        setProgramasFiltrados(filtrados);
                      } else {
                        setProgramasFiltrados(programasProcesados);
                      }
                    }
                  }
                  
                } catch (error) {
                  console.error('Error al guardar programa:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Error al guardar el programa: ${error.message || JSON.stringify(error)}`
                  });
                } finally {
                  setLoading(false);
                }
              };
    const handleTemaAdded = (nuevoTema) => {
        fetchTemasFiltrados();
        handleCloseAddTemaModal();
        
        // Seleccionar el nuevo tema si está disponible
        if (nuevoTema) {
            handleSeleccionarTema(nuevoTema);
        }
    };

    // Función auxiliar para formatear duración
    const formatDuracion = (duracion) => {
        if (!duracion) return 'N/A';
        return duracion;
    };
     // Efecto para cargar datos filtrados cuando cambia la alternativa
     useEffect(() => {
        if (alternativa) {
            // Si tenemos un ID de campaña, cargamos los temas asociados
            if (alternativa.id_campania) {
                fetchTemasFiltrados();
            }
            
            // Si tenemos un ID de soporte, cargamos los programas asociados
            if (alternativa.id_soporte) {
                handleSearchPrograma('');
            }
            
            // Si tenemos un ID de contrato, cargamos las clasificaciones asociadas
            if (alternativa.num_contrato) {
                handleSearchClasificacion('');
            }
        }
    }, [alternativa?.id_campania, alternativa?.id_soporte, alternativa?.num_contrato]);
    useEffect(() => {
      fetchCatalogos();
      
      if (isCreatingNew && initialData) {
          // Inicializar con los datos proporcionados para una nueva alternativa
          setAlternativa(initialData);
          
          // Obtener información del plan para el mes y año
          if (initialData.id_orden) {
              fetchPlanInfo(initialData.id_orden);
          }
          
          // Inicializar el calendario si hay datos iniciales
          if (initialData.calendar) {
              try {
                  let calendarArray = [];
                  if (typeof initialData.calendar === 'string') {
                      calendarArray = JSON.parse(initialData.calendar);
                  } else if (Array.isArray(initialData.calendar)) {
                      calendarArray = initialData.calendar;
                  }
                  setCalendarData(calendarArray);
              } catch (error) {
                  console.error('Error al parsear el calendario:', error);
                  setCalendarData([]);
              }
          }
          
          // Si tenemos mes y año, generar los días del mes inmediatamente
          if (initialData.mes && initialData.anio) {
              generateDaysInMonth(initialData.mes, initialData.anio);
          }
      } else if (alternativaId) {
          // Obtener datos de alternativa existente
          fetchAlternativa();
      }
  }, [alternativaId, isCreatingNew, initialData]);

    // Efecto para generar los días del mes cuando se obtiene la información del plan
    useEffect(() => {
        if (planInfo) {
            generateDaysInMonth(planInfo.mes, planInfo.anio);
        }
    }, [planInfo]);

    const fetchCatalogos = async () => {
        try {
            setLoading(true);
            
            // Fetch clasificaciones
            const { data: clasificacionesData } = await supabase
                .from('Clasificacion')
                .select('*')
                .order('NombreClasificacion');
            setClasificaciones(clasificacionesData || []);
            
            // Fetch temas
            const { data: temasData } = await supabase
                .from('Temas')
                .select('*')
                .order('NombreTema');
            setTemas(temasData || []);
            
            // Fetch programas
            const { data: programasData } = await supabase
                .from('Programas')
                .select('*')
                .order('codigo_programa');
            setProgramas(programasData || []);
            
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Modify the fetchPlanInfo function to ensure it works correctly
    const fetchPlanInfo = async () => {
      try {
          // Obtener información de la orden, incluyendo el cliente
          const { data: ordenData, error: ordenError } = await supabase
              .from('OrdenesDePublicidad')
              .select(`
                  id_ordenes_de_comprar,
                  id_plan,
                  id_campania,
                  Campania (
                      id_campania,
                      NombreCampania,
                      id_Cliente,
                      Clientes (
                          id_cliente,
                          nombreCliente
                      )
                  )
              `)
              .eq('id_ordenes_de_comprar', alternativaId ? alternativa.id_orden : ordenId)
              .single();
          
          if (ordenError) {
              console.error('Error fetching orden:', ordenError);
              throw ordenError;
          }
          
          // Obtener información del plan
          if (ordenData?.id_plan) {
              const { data: planData, error: planError } = await supabase
                  .from('plan')
                  .select(`
                      id,
                      nombre_plan,
                      id_campania
                  `)
                  .eq('id', ordenData.id_plan)
                  .single();
              
              if (planError) {
                  console.error('Error fetching plan:', planError);
                  throw planError;
              }
              
              setPlanInfo({
                  id: planData.id,
                  nombre: planData.nombre_plan,
                  campania: ordenData.Campania?.NombreCampania || 'No disponible',
                  cliente: ordenData.Campania?.Clientes?.nombreCliente || 'No disponible',
                  clienteId: ordenData.Campania?.id_Cliente
              });
          }
      } catch (error) {
          console.error('Error al obtener información del plan:', error);
      }
  };
  const calcularValores = (valor, tipoContrato) => {
    if (!valor || isNaN(parseFloat(valor))) return { bruto: 0, neto: 0 };
    
    const valorNumerico = parseFloat(valor);
    
    if (tipoContrato === 1) { // NETO
      // De NETO a BRUTO: NETO dividido por 0.85
      const bruto = Math.round(valorNumerico / 0.85);
      return {
        bruto,
        neto: valorNumerico,
        total: bruto // El total general es el bruto en este caso
      };
    } else { // BRUTO
      // De BRUTO a NETO: BRUTO multiplicado por 0.85
      const neto = Math.round(valorNumerico * 0.85);
      return {
        bruto: valorNumerico,
        neto,
        total: valorNumerico // El total general es el bruto en este caso
      };
    }
  };
  const fetchAlternativa = async () => {
    try {
        setLoading(true);
        console.log("Fetching alternativa with ID:", alternativaId);
        
        // Verificar si es un ID temporal (comienza con "temp_")
        if (alternativaId && alternativaId.toString().startsWith('temp_')) {
            console.log("Buscando alternativa temporal en sessionStorage");
            // Para alternativas temporales, buscar en el estado local o sessionStorage
            const tempAlternativasStr = sessionStorage.getItem('tempAlternativas');
            console.log("Contenido de tempAlternativas en sessionStorage:", tempAlternativasStr);
            
            const tempAlternativas = JSON.parse(tempAlternativasStr || '[]');
            const tempAlternativa = tempAlternativas.find(alt => alt.id === alternativaId);
            
            if (tempAlternativa) {
                console.log("Alternativa temporal encontrada en sessionStorage:", tempAlternativa);
                
                // Parsear el calendario si existe
                if (tempAlternativa.calendar) {
                    try {
                        let calendarArray = [];
                        if (typeof tempAlternativa.calendar === 'string') {
                            calendarArray = JSON.parse(tempAlternativa.calendar);
                        } else if (Array.isArray(tempAlternativa.calendar)) {
                            calendarArray = tempAlternativa.calendar;
                        }
                        
                        // Actualizar el estado de cantidades en el objeto alternativa
                        tempAlternativa.cantidades = calendarArray;
                        
                        // También actualizar el estado separado de calendarData
                        setCalendarData(calendarArray);
                    } catch (error) {
                        console.error('Error al parsear el calendario:', error);
                        tempAlternativa.cantidades = [];
                        setCalendarData([]);
                    }
                } else {
                    tempAlternativa.cantidades = [];
                    setCalendarData([]);
                }
                
                setAlternativa(tempAlternativa);
                
                // Obtener información del plan
                if (tempAlternativa.id_orden) {
                    fetchPlanInfo(tempAlternativa.id_orden);
                }
                
                setLoading(false);
                return;
            } else {
                console.warn("Alternativa temporal no encontrada en sessionStorage");
                
                // Verificar si existe en window.tempAlternativasState
                if (window.tempAlternativasState) {
                    console.log("Buscando en window.tempAlternativasState");
                    const tempAlt = window.tempAlternativasState.find(alt => alt.id === alternativaId);
                    
                    if (tempAlt) {
                        console.log("Alternativa temporal encontrada en window.tempAlternativasState:", tempAlt);
                        
                        // Procesar calendario
                        let calendarArray = [];
                        if (tempAlt.calendar) {
                            try {
                                if (typeof tempAlt.calendar === 'string') {
                                    calendarArray = JSON.parse(tempAlt.calendar);
                                } else if (Array.isArray(tempAlt.calendar)) {
                                    calendarArray = tempAlt.calendar;
                                }
                            } catch (error) {
                                console.error('Error al parsear el calendario:', error);
                            }
                        }
                        
                        tempAlt.cantidades = calendarArray;
                        setCalendarData(calendarArray);
                        setAlternativa(tempAlt);
                        
                        if (tempAlt.id_orden) {
                            fetchPlanInfo(tempAlt.id_orden);
                        }
                        
                        setLoading(false);
                        return;
                    }
                }
                
                // Si no se encuentra en ningún lado, verificar si tenemos initialData
                if (initialData && initialData.id === alternativaId) {
                    console.log("Usando initialData como fuente para la alternativa temporal:", initialData);
                    
                    // Procesar calendario
                    let calendarArray = [];
                    if (initialData.calendar) {
                        try {
                            if (typeof initialData.calendar === 'string') {
                                calendarArray = JSON.parse(initialData.calendar);
                            } else if (Array.isArray(initialData.calendar)) {
                                calendarArray = initialData.calendar;
                            }
                        } catch (error) {
                            console.error('Error al parsear el calendario:', error);
                        }
                    }
                    
                    initialData.cantidades = calendarArray;
                    setCalendarData(calendarArray);
                    setAlternativa(initialData);
                    
                    if (initialData.id_orden) {
                        fetchPlanInfo(initialData.id_orden);
                    }
                    
                    setLoading(false);
                    return;
                }
            }
        }
        
        // Si no es un ID temporal o no se encontró en el almacenamiento local, buscar en la base de datos
        console.log("Buscando alternativa en Supabase");
        const { data, error } = await supabase
            .from('alternativa')
            .select(`
                *,
                Anios(*),
                Meses(*),
                Contratos(*),
                Soportes(*),
                Clasificacion(*),
                Temas(*, Medios(*)),
                Programas(*),
                Medios(*)
            `)
            .eq('id', alternativaId)
            .single();

        if (error) {
            console.error('Error al obtener alternativa de Supabase:', error);
            
            // Si hay error al buscar en la base de datos y es un ID temporal,
            // crear una alternativa vacía con ese ID para permitir la edición
            if (alternativaId && alternativaId.toString().startsWith('temp_')) {
                console.log("Creando alternativa temporal vacía con ID:", alternativaId);
                const emptyTempAlternativa = {
                    id: alternativaId,
                    id_orden: initialData?.id_orden,
                    anio: initialData?.anio,
                    mes: initialData?.mes,
                    cantidades: []
                };
                setAlternativa(emptyTempAlternativa);
                setCalendarData([]);
                
                if (initialData?.id_orden) {
                    fetchPlanInfo(initialData.id_orden);
                }
                
                setLoading(false);
                return;
            }
            
            throw error;
        }
        
        console.log("Alternativa data fetched from Supabase:", data);
        
        // Parsear el calendario si existe
        if (data.calendar) {
            try {
                let calendarArray = [];
                if (typeof data.calendar === 'string') {
                    calendarArray = JSON.parse(data.calendar);
                } else if (Array.isArray(data.calendar)) {
                    calendarArray = data.calendar;
                }
                
                // Actualizar el estado de cantidades en el objeto alternativa
                data.cantidades = calendarArray;
                
                // También actualizar el estado separado de calendarData
                setCalendarData(calendarArray);
                
                console.log("Calendar data loaded:", calendarArray);
            } catch (error) {
                console.error('Error al parsear el calendario:', error);
                data.cantidades = [];
                setCalendarData([]);
            }
        } else {
            data.cantidades = [];
            setCalendarData([]);
        }
        
        // Calcular totales al cargar para poblar Total Orden correctamente
        const valorUnitario = Number(data.valor_unitario) || 0;
        const descuento = Number(data.descuento_pl ?? data.descuento_plan) || 0;
        const recargo = Number(data.recargo_plan) || 0;
        const tipoGeneracionOrden = data.Contratos?.id_GeneraracionOrdenTipo || 1;
        const totalCantidades = (data.cantidades || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
        const multiplicarFlag = Boolean(data.multiplicar_valor ?? data.multiplicar_valor_unitario);
        const multiplicador = multiplicarFlag ? (totalCantidades > 0 ? totalCantidades : 1) : 1;
        let totalBruto = 0;
        let totalNeto = 0;
        if (tipoGeneracionOrden === 1) {
          const totalNetoBase = valorUnitario * multiplicador;
          let totalConDescuento = totalNetoBase;
          if (descuento > 0) totalConDescuento = totalNetoBase - (totalNetoBase * (descuento / 100));
          if (recargo > 0) totalNeto = totalConDescuento + (totalConDescuento * (recargo / 100));
          else totalNeto = totalConDescuento;
          totalBruto = Math.round(totalNeto / 0.85);
        } else {
          const totalBrutoBase = valorUnitario * multiplicador;
          let totalConDescuento = totalBrutoBase;
          if (descuento > 0) totalConDescuento = totalBrutoBase - (totalBrutoBase * (descuento / 100));
          if (recargo > 0) totalBruto = totalConDescuento + (totalConDescuento * (recargo / 100));
          else totalBruto = totalConDescuento;
          totalNeto = Math.round(totalBruto * 0.85);
        }
        const ivaCalc = Math.round(totalNeto * 0.19);
        const totalOrdenCalc = totalNeto + ivaCalc;
        setAlternativa({
          ...data,
          multiplicar_valor_unitario: multiplicarFlag,
          total_bruto: Math.round(totalBruto),
          total_neto: Math.round(totalNeto),
          iva: Math.round(ivaCalc),
          total_orden: Math.round(totalOrdenCalc)
        });
        
        // Obtener información del plan
        if (data.id_orden) {
            fetchPlanInfo(data.id_orden);
        }
    } catch (error) {
        console.error('Error al obtener alternativa:', error);
        // Si hay un error, intentar usar los datos iniciales
        if (initialData) {
            console.log("Usando initialData como fallback:", initialData);
            // Calcular totales también para initialData
            const valorUnitarioInit = Number(initialData.valor_unitario) || 0;
            const descuentoInit = Number(initialData.descuento_pl ?? initialData.descuento_plan) || 0;
            const recargoInit = Number(initialData.recargo_plan) || 0;
            const tipoGeneracionOrdenInit = initialData.Contratos?.id_GeneraracionOrdenTipo || 1;
            const totalCantidadesInit = (initialData.cantidades || []).reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
            const multiplicarFlagInit = Boolean(initialData.multiplicar_valor ?? initialData.multiplicar_valor_unitario);
            const multiplicadorInit = multiplicarFlagInit ? (totalCantidadesInit > 0 ? totalCantidadesInit : 1) : 1;
            let totalBrutoInit = 0;
            let totalNetoInit = 0;
            if (tipoGeneracionOrdenInit === 1) {
              const totalNetoBaseInit = valorUnitarioInit * multiplicadorInit;
              let totalConDescuentoInit = totalNetoBaseInit;
              if (descuentoInit > 0) totalConDescuentoInit = totalNetoBaseInit - (totalNetoBaseInit * (descuentoInit / 100));
              if (recargoInit > 0) totalNetoInit = totalConDescuentoInit + (totalConDescuentoInit * (recargoInit / 100));
              else totalNetoInit = totalConDescuentoInit;
              totalBrutoInit = Math.round(totalNetoInit / 0.85);
            } else {
              const totalBrutoBaseInit = valorUnitarioInit * multiplicadorInit;
              let totalConDescuentoInit = totalBrutoBaseInit;
              if (descuentoInit > 0) totalConDescuentoInit = totalBrutoBaseInit - (totalBrutoBaseInit * (descuentoInit / 100));
              if (recargoInit > 0) totalBrutoInit = totalConDescuentoInit + (totalConDescuentoInit * (recargoInit / 100));
              else totalBrutoInit = totalConDescuentoInit;
              totalNetoInit = Math.round(totalBrutoInit * 0.85);
            }
            const ivaInit = Math.round(totalNetoInit * 0.19);
            const totalOrdenInit = totalNetoInit + ivaInit;
            setAlternativa({
              ...initialData,
              multiplicar_valor_unitario: multiplicarFlagInit,
              total_bruto: Math.round(totalBrutoInit),
              total_neto: Math.round(totalNetoInit),
              iva: Math.round(ivaInit),
              total_orden: Math.round(totalOrdenInit)
            });
            
            if (initialData.calendar) {
                try {
                    let calendarArray = [];
                    if (typeof initialData.calendar === 'string') {
                        calendarArray = JSON.parse(initialData.calendar);
                    } else if (Array.isArray(initialData.calendar)) {
                        calendarArray = initialData.calendar;
                    }
                    initialData.cantidades = calendarArray;
                    setCalendarData(calendarArray);
                } catch (error) {
                    console.error('Error al parsear el calendario de initialData:', error);
                    setCalendarData([]);
                }
            }
            
            if (initialData.id_orden) {
                fetchPlanInfo(initialData.id_orden);
            }
        }
    } finally {
        setLoading(false);
    }
};
   // Obtener el primer día de la semana del mes (0 = domingo, 1 = lunes, ..., 6 = sábado)
   const getFirstDayOfMonth = () => {
    if (!planInfo || !planInfo.mes || !planInfo.anio) return 0;
    
    const monthNumber = parseInt(planInfo.mes);
    const yearNumber = parseInt(planInfo.anio);
    
    // En JavaScript, los meses van de 0 a 11 (enero = 0, diciembre = 11)
    return new Date(yearNumber, monthNumber - 1, 1).getDay();
};

    // Función para obtener los días del mes
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



    // Función para generar los días del mes
    const generateDaysInMonth = (monthId, yearId) => {
        // Obtener el número del mes (1-12) y el año
        const monthNumber = parseInt(monthId);
        const yearNumber = parseInt(yearId);
        
        if (isNaN(monthNumber) || isNaN(yearNumber)) {
            setDaysInMonth([]);
            return;
        }
        
        // Crear un array con los días del mes
        const daysInSelectedMonth = new Date(yearNumber, monthNumber, 0).getDate();
        const days = Array.from({ length: daysInSelectedMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
        setDaysInMonth(days);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAlternativa(prev => ({
            ...prev,
            [name]: value
        }));
    };

   // Update the handleSave function to properly handle boolean values
   const handleSave = async () => {
    try {
        setLoading(true);
        
        // Usar el estado calendarData para el calendario
      const calendarToSave = alternativa.cantidades || calendarData;
      const cantidadesArrayFromRef = Object.keys(cantidadesRef.current).length > 0
        ? Object.entries(cantidadesRef.current)
            .filter(([, c]) => c !== '' && c !== null && c !== undefined)
            .map(([d, c]) => ({ dia: d, cantidad: c }))
        : calendarToSave;
        
        // Preparar los datos de la alternativa con el calendario
      let alternativaData = {
          ...alternativa,
          calendar: JSON.stringify(cantidadesArrayFromRef)
      };
        
        // Eliminar campos que no existen en la tabla alternativa
        if (alternativaData.id_orden) {
            alternativaData.numerorden = alternativaData.id_orden;
            delete alternativaData.id_orden;
        }
        
        // Eliminar el campo cantidades ya que se guarda en calendar
        delete alternativaData.cantidades;
        
        // Eliminar _originalData si existe
        if (alternativaData._originalData) {
            delete alternativaData._originalData;
        }
        
        // Eliminar otros campos temporales o que no existen en la tabla
        if (alternativaData._tempStatus) {
            delete alternativaData._tempStatus;
        }
        
        // Ensure numeric fields are properly formatted as numbers
        if (alternativaData.valor_unitario) alternativaData.valor_unitario = Number(alternativaData.valor_unitario);
        if (alternativaData.total_bruto) alternativaData.total_bruto = Number(alternativaData.total_bruto);
        if (alternativaData.total_general) alternativaData.total_general = Number(alternativaData.total_general);
        if (alternativaData.total_neto) alternativaData.total_neto = Number(alternativaData.total_neto);
        
        // Handle boolean fields that should be integers
        if (typeof alternativaData.anulado !== 'undefined') {
            alternativaData.anulado = alternativaData.anulado === true ? 1 : 0;
        }
        
        // Handle any other boolean fields that might be causing the error
      Object.keys(alternativaData).forEach(key => {
          if (typeof alternativaData[key] === 'boolean') {
              console.log(`Converting boolean field ${key} to number`);
              alternativaData[key] = alternativaData[key] ? 1 : 0;
          }
      });
      alternativaData.multiplicar_valor = alternativa.multiplicar_valor_unitario ? 1 : 0;
        
        console.log("Saving alternativa data:", alternativaData);
        
        // Verificar si es una alternativa temporal (nueva o existente)
        const isTempAlternativa = isCreatingNew || 
            (alternativaData.id && alternativaData.id.toString().startsWith('temp_'));
        
        if (isTempAlternativa) {
            // Para alternativas temporales, generamos un ID temporal si no existe
            const tempId = alternativaData.id || 'temp_' + Date.now();
            const alternativaWithTempId = {
                ...alternativaData,
                id: tempId,
                // Asegurarse de que se guarde el número de orden
                numerorden: alternativaData.numerorden || ordenId
            };
            
            console.log("Guardando alternativa temporal con ID:", tempId);
            
            // Guardar la alternativa temporal en sessionStorage
            const tempAlternativasStr = sessionStorage.getItem('tempAlternativas');
            console.log("Contenido actual de tempAlternativas:", tempAlternativasStr);
            
            const tempAlternativas = JSON.parse(tempAlternativasStr || '[]');
            const existingIndex = tempAlternativas.findIndex(alt => alt.id === tempId);
            
            if (existingIndex >= 0) {
                // Actualizar alternativa existente
                console.log("Reemplazando alternativa existente en sessionStorage");
                tempAlternativas[existingIndex] = alternativaWithTempId;
            } else {
                // Agregar nueva alternativa
                console.log("Agregando nueva alternativa a sessionStorage");
                tempAlternativas.push(alternativaWithTempId);
            }
            
            // Guardar en sessionStorage
            const tempAlternativasJSON = JSON.stringify(tempAlternativas);
            sessionStorage.setItem('tempAlternativas', tempAlternativasJSON);
            console.log("Nuevo contenido de tempAlternativas:", tempAlternativasJSON);
            
            // También guardar en una variable global para acceso entre componentes
            if (!window.tempAlternativasState) {
                window.tempAlternativasState = [];
            }
            
            const globalIndex = window.tempAlternativasState.findIndex(alt => alt.id === tempId);
            if (globalIndex >= 0) {
                window.tempAlternativasState[globalIndex] = alternativaWithTempId;
            } else {
                window.tempAlternativasState.push(alternativaWithTempId);
            }
            
            console.log("window.tempAlternativasState actualizado:", window.tempAlternativasState);
            
            // Llamamos al callback onSave con los datos de la alternativa temporal
            onSave(alternativaWithTempId);
        } else {
            // Para alternativas existentes en la base de datos
            // Llamamos al callback onSave con los datos actualizados
            onSave(alternativaData);
        }
    } catch (error) {
        console.error('Error al guardar alternativa:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo guardar la alternativa'
        });
    } finally {
        setLoading(false);
    }
};

  // Función para manejar cambios en el calendario
  const handleCantidadInput = (dia, valor) => {
    cantidadesRef.current[dia] = valor;
    if (autoFillCantidades) {
      const currentDate = new Date();
      const anio = alternativa?.anio || currentDate.getFullYear();
      const mes = alternativa?.mes || currentDate.getMonth() + 1;
      const dias = getDiasDelMes(anio, mes);
      dias.forEach(({ dia: d }) => {
        cantidadesRef.current[d] = valor;
      });
    }
  };
  const handleActualizar = () => {
    const currentVU = alternativa?.valor_unitario || 0;
    handleMontoChange('valor_unitario', currentVU);
  };

// Componente para el calendario 
const CalendarioAlternativa = ({ anio, mes, cantidades = [], onChange, cantidadesRef, autoFillCantidades, setAutoFillCantidades }) => { 
    // Asegurarse de que anio y mes sean valores válidos 
    const currentDate = new Date(); 
    const validAnio = anio || currentDate.getFullYear(); 
    const validMes = mes || currentDate.getMonth() + 1; 
    
    const dias = getDiasDelMes(validAnio, validMes); 
    
    const inputRefs = React.useRef({});
    const [focusedDia, setFocusedDia] = useState(null);
    
    const getCantidad = (dia) => { 
        const fromRef = cantidadesRef?.current?.[dia]; 
        if (fromRef !== undefined) return String(fromRef ?? ''); 
        const item = cantidades?.find(c => c.dia === dia); 
        return item ? String(item.cantidad ?? '') : ''; 
    }; 

    const calcularTotal = () => { 
        return (cantidades || []).reduce((sum, item) => { 
            const cantidad = parseInt(item.cantidad) || 0; 
            return sum + cantidad; 
        }, 0); 
    }; 
    
    const handleDayInput = (dia, valor) => {
        const v = (valor || '').replace(/[^0-9]/g, '');
        if (autoFillCantidades) {
            dias.forEach(({ dia: d }) => {
                onChange(d, v);
                const el = inputRefs.current[d];
                if (el) el.value = v;
            });
            setFocusedDia(dia);
        } else {
            onChange(dia, v);
        }
    };
    
    // Función para limpiar el calendario
  const handleLimpiarCalendario = () => {
        // Crear un nuevo array de cantidades con valores vacíos para todos los días
        const cantidadesLimpias = dias.map(d => ({ 
            dia: d.dia, 
            cantidad: '' 
        }));
        
        // Llamar al onChange con las cantidades limpias
        onChange(null, '', cantidadesLimpias);
  };

    
    // Si no hay días, mostrar mensaje informativo 
    if (!dias || dias.length === 0) { 
        return ( 
            <Box sx={{ mt: 2 }}> 
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#666' }}> 
                    Calendario de Cantidades
                </Typography> 
                <Alert severity="info"> 
                    No se pueden mostrar los días del calendario. Verifique que el mes y año sean válidos. 
                </Alert> 
            </Box> 
        ); 
    } 
    
    return ( 
        <Box sx={{ mt: 2 }}> 
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}> 
                <Typography variant="subtitle1" sx={{ color: '#666' }}> 
                    Calendario de Cantidades 
                </Typography> 
                <Box sx={{ display: 'flex', alignItems: 'center' }}> 
                    <FormControlLabel 
                        control={ 
                            <Checkbox 
                                checked={autoFillCantidades} 
                                onChange={(e) => setAutoFillCantidades(e.target.checked)} 
                                size="small" 
                            /> 
                        } 
                        label={ 
                            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}> 
                                Rellenar automáticamente 
                            </Typography> 
                        } 
                    /> 
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        onClick={handleLimpiarCalendario} 
                        sx={{ ml: 1, fontSize: '0.75rem', py: 0.5 }} 
                    > 
                        Limpiar 
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
                                onChange={(e) => handleDayInput(dia, e.target.value)}
                                size="small"
                                variant="outlined"
                                InputProps={{
                                  inputRef: (el) => { inputRefs.current[dia] = el; }
                                }}
                                inputProps={{
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
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


    if (loading && !alternativa) {
        return (
            <Box display="flex" justifyContent="center" m={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (!alternativa) {
        return (
            <Box display="flex" justifyContent="center" m={3}>
                <Typography>No se encontró la alternativa</Typography>
            </Box>
        );
    }

    // Agrupar los días en grupos de 7 para mostrar en filas
    const groupedDays = [];
    for (let i = 0; i < 31; i += 7) {
        groupedDays.push(daysInMonth.slice(i, i + 7));
    }

  return (
    <Box>
      <Grid container spacing={2}>
                {/* Primera fila: Contrato y Soporte */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Contrato"
                        value={alternativa.Contratos?.NombreContrato || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <ArticleIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Soporte"
                        value={alternativa.Soportes?.nombreIdentficiador || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AssignmentIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
                
                {/* Segunda fila: Tipo de Item y Clasificación */}
                <Grid item xs={6}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Tipo de Item</InputLabel>
                        <Select
                            name="tipo_item"
                            value={alternativa.tipo_item || ''}
                            onChange={handleChange}
                            label="Tipo de Item"
                            startAdornment={
                                <InputAdornment position="start">
                                    <CategoryIcon color="primary" />
                                </InputAdornment>
                            }
                        >
                            {TIPO_ITEMS.map((tipo, index) => (
                                <MenuItem key={index} value={tipo}>
                                    {tipo}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Clasificación"
                        value={alternativa?.clasificacion || ''}
                        onClick={() => {
                            handleOpenClasificacionModal();
                            handleSearchClasificacion('');
                        }}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <DescriptionIcon color="primary" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenClasificacionModal();
                                            handleSearchClasificacion('');
                                        }}
                                        edge="end"
                                        size="small"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                
                {/* Tercera fila: Detalle */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Detalle"
                        name="detalle"
                        value={alternativa.detalle || ''}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SubjectIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                
                {/* Cuarta fila: Tema y Programa */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Tema"
                        value={alternativa.Temas?.NombreTema ? `${alternativa.Temas.NombreTema}` : ''}
                        onClick={() => {
                            handleOpenTemasModal();
                            fetchTemasFiltrados();
                        }}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <TopicIcon color="primary" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTemasModal();
                                            fetchTemasFiltrados();
                                        }}
                                        edge="end"
                                        size="small"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Medio"
                        value={alternativa.Medios?.NombredelMedio || alternativa.Temas?.Medios?.NombredelMedio || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <TvIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Segundos"
                        value={alternativa.Temas?.Duracion || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <TimerIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Programa"
                        value={alternativa.Programas ? `${alternativa.Programas.descripcion}` : ''}
                        onClick={() => {
                            handleOpenProgramasModal();
                            handleSearchPrograma('');
                        }}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LiveTvIcon color="primary" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenProgramasModal();
                                            handleSearchPrograma('');
                                        }}
                                        edge="end"
                                        size="small"
                                    >
                                        <SearchIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Hora Inicio"
                        value={alternativa.Programas?.hora_inicio || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccessTimeIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Hora Fin"
                        value={alternativa.Programas?.hora_fin || ''}
                        InputProps={{
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AccessTimeIcon color="primary" />
                                </InputAdornment>
                            ),
                        }}
                        disabled
                    />
                </Grid>
        {/* Campos de valores y tarifas */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Valores y Tarifas
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(alternativa?.multiplicar_valor_unitario)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAlternativa(prev => ({ ...prev, multiplicar_valor_unitario: checked }));
                  const currentVU = alternativa?.valor_unitario || 0;
                  handleMontoChange('valor_unitario', currentVU);
                }}
              />
            }
            label="Multiplicar valor unitario"
          />
        </Grid>
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                    <Grid item xs={12} md={2.4}>
            <TextField
                fullWidth
                label="Valor Unitario"
                value={alternativa?.valor_unitario || ''}
                onChange={(e) => handleMontoChange('valor_unitario', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <MonetizationOnIcon />
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
        
        <Grid item xs={12} md={2.4}>
            <TextField
                fullWidth
                label="Descuento (%)"
                value={alternativa?.descuento_pl || ''}
                onChange={(e) => handleMontoChange('descuento_pl', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <RemoveCircleIcon />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            %
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
        
        <Grid item xs={12} md={2.4}>
            <TextField
                fullWidth
                label="Recargo (%)"
                value={alternativa?.recargo_plan || ''}
                onChange={(e) => handleMontoChange('recargo_plan', e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <AddCircleIcon />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            %
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
        
        <Grid item xs={12} md={2.4}>
            <TextField
                fullWidth
                label={alternativa?.Contratos?.id_GeneraracionOrdenTipo === 1 ? "Total Neto" : "Total Bruto"}
                value={alternativa?.Contratos?.id_GeneraracionOrdenTipo === 1 
                    ? (alternativa?.total_neto || 0).toLocaleString() 
                    : (alternativa?.total_bruto || 0).toLocaleString()}
                InputProps={{
                    readOnly: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <AccountBalanceWalletIcon />
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
        
        <Grid item xs={12} md={2.4}>
            <TextField
                fullWidth
                label="Total Orden"
                value={(alternativa?.total_orden || 0).toLocaleString()}
                InputProps={{
                    readOnly: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <ReceiptIcon />
                        </InputAdornment>
                    ),
                }}
            />
        </Grid>
                    </Grid>
                </Grid>
                
                     {/* Calendario de cantidades */}
                     <Grid item xs={12}>
                     <CalendarioAlternativa 
                anio={alternativa.anio} 
                mes={alternativa.mes} 
                cantidades={alternativa.cantidades || []} 
                onChange={handleCantidadInput} 
                cantidadesRef={cantidadesRef}
                autoFillCantidades={autoFillCantidades}
                setAutoFillCantidades={setAutoFillCantidades}
            />
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleActualizar}
                >
                    Actualizar
                </Button>
            </Box>
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
                    <TableCell>Duración</TableCell>
                    <TableCell>Medio</TableCell>
                    <TableCell>Calidad</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Cooperado</TableCell>
                    <TableCell>Rubro</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                {loadingTemas ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : temasFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
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
                        <TableCell>{tema.NombreTema}</TableCell>
                  
                        <TableCell>{formatDuracion(tema.Duracion)}</TableCell>
                        <TableCell>{tema.Medios?.NombredelMedio || 'N/A'}</TableCell>
                        <TableCell>
                          {tema.Calidad?.NombreCalidad || 'N/A'}
                        </TableCell>
                        <TableCell>{tema.color || 'N/A'}</TableCell>
                        <TableCell>{tema.cooperado || 'N/A'}</TableCell>
                        <TableCell>{tema.Rubro || 'N/A'}</TableCell>
                        
                      
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

        <Dialog open={openClasificacionModal} onClose={handleCloseClasificacionModal} maxWidth="md" fullWidth>
    <DialogTitle>
        Seleccionar Clasificación
        <IconButton
            aria-label="close"
            onClick={handleCloseClasificacionModal}
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
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <TextField
                fullWidth
                placeholder="Buscar clasificación"
                value={searchClasificacion}
                onChange={(e) => handleSearchClasificacion(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mr: 2 }}
            />
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddEditClasificacionModal()}
            >
                Nueva
            </Button>
        </Box>
        
        {loadingClasificaciones ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
            </Box>
        ) : (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clasificacionesList.length > 0 ? (
                            clasificacionesList.map((clasificacion) => (
                                <TableRow key={clasificacion.id}>
                                <TableCell>{clasificacion.NombreClasificacion}</TableCell>
                                <TableCell align="right">
                                <IconButton 
    color="primary" 
    onClick={() => handleSelectClasificacion(clasificacion)}
>
    <CheckIcon />
</IconButton>
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => handleOpenAddEditClasificacionModal(clasificacion)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton 
                                        color="error" 
                                        onClick={() => handleDeleteClasificacion(clasificacion.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center">
                                    No se encontraron clasificaciones
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        )}
    </DialogContent>
</Dialog>

{/* Modal para agregar/editar clasificación */}
<Dialog 
    open={openAddEditClasificacionModal} 
    onClose={handleCloseAddEditClasificacionModal}
    maxWidth="sm"
    fullWidth
>
    <DialogTitle>
        {editingClasificacion ? 'Editar Clasificación' : 'Nueva Clasificación'}
        <IconButton
            aria-label="close"
            onClick={handleCloseAddEditClasificacionModal}
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
        <TextField
            fullWidth
            label="Nombre de la Clasificación"
            variant="outlined"
            value={nuevaClasificacion.NombreClasificacion}
            onChange={(e) => setNuevaClasificacion({
                ...nuevaClasificacion,
                NombreClasificacion: e.target.value
            })}
            margin="normal"
            required
        />
    </DialogContent>
    <DialogActions>
        <Button onClick={handleCloseAddEditClasificacionModal}>Cancelar</Button>
        <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveClasificacion}
            disabled={loadingClasificaciones}
        >
            {loadingClasificaciones ? <CircularProgress size={24} /> : 'Guardar'}
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
    clienteNombre={planInfo?.cliente || 'Cliente no disponible'} 
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
                sx={{ mb: 2, mt: 2  }}
              />
             
               {/* Hora de inicio - Reemplazar el campo actual por dos selects */}
      <Grid item xs={12} mt={1}>
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
      <Grid item xs={12} mt={1}>
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
    );
};

export default EditarAlternativaReemplazo;
