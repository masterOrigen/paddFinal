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
    Edit as EditIcon
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

    // ... existing code ...

    // Funciones para manejar modales
    const handleOpenTemasModal = () => {
        fetchTemasFiltrados();
        setOpenTemasModal(true);
    };
    const handleCloseTemasModal = () => setOpenTemasModal(false);
    
    const handleOpenSoportesModal = () => setOpenSoportesModal(true);
    const handleCloseSoportesModal = () => setOpenSoportesModal(false);
    
    const handleOpenProgramasModal = () => {
        handleSearchPrograma('');
        setOpenProgramasModal(true);
    };
    const handleCloseProgramasModal = () => setOpenProgramasModal(false);
    
    const handleOpenClasificacionModal = () => {
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
    
    const handleOpenAddTemaModal = () => setOpenAddTemaModal(true);
    const handleCloseAddTemaModal = () => setOpenAddTemaModal(false);
    const handleOpenAddEditProgramaModal = (programa = null) => {
        if (programa) {
            setEditingPrograma(programa);
            setNewPrograma({
                descripcion: programa.descripcion || '',
                codigo_programa: programa.codigo_programa || '',
                cod_prog_megatime: programa.cod_prog_megatime || '',
                hora_inicio: programa.hora_inicio || '',
                hora_fin: programa.hora_fin || ''
            });
        } else {
            setEditingPrograma(null);
            setNewPrograma({
                descripcion: '',
                codigo_programa: '',
                cod_prog_megatime: '',
                hora_inicio: '',
                hora_fin: ''
            });
        }
        setOpenAddEditProgramaModal(true);
    };
    const handleCloseAddEditProgramaModal = () => setOpenAddEditProgramaModal(false);
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
          numerorden: newOrderId
      };
  });
};
// Add this component for the Anular y Reemplazar modal
const AnularReemplazarModal = ({ open, onClose }) => {
  const [selectedAlternativa, setSelectedAlternativa] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  
  const handleOpenEditModal = (alternativa = null) => {
      setSelectedAlternativa(alternativa);
      setOpenEditModal(true);
  };
  
  const handleCloseEditModal = () => {
      setSelectedAlternativa(null);
      setOpenEditModal(false);
  };
  
  const handleSaveAlternativa = (savedAlternativa) => {
      if (selectedAlternativa) {
          // Editing existing alternative
          handleEditTempAlternativa(savedAlternativa);
      } else {
          // Adding new alternative
          handleAddTempAlternativa(savedAlternativa);
      }
      handleCloseEditModal();
  };
  
  const handleDeleteAlternativa = (alternativaId) => {
      Swal.fire({
          title: '¿Estás seguro?',
          text: "Esta acción no se puede revertir",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
      }).then((result) => {
          if (result.isConfirmed) {
              handleDeleteTempAlternativa(alternativaId);
              Swal.fire(
                  'Eliminado',
                  'La alternativa ha sido eliminada',
                  'success'
              );
          }
      });
  };
  
  // Filter out alternatives marked as deleted
  const visibleAlternativas = tempAlternativas.filter(alt => alt._tempStatus !== 'deleted');
  
  return (
      <Dialog
          open={open}
          onClose={onClose}
          maxWidth="lg"
          fullWidth
      >
          <DialogTitle>
              <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
              }}>
                  <Typography variant="h6">Anular y Reemplazar Orden</Typography>
                  <IconButton onClick={onClose} size="small">
                      <CloseIcon />
                  </IconButton>
              </Box>
          </DialogTitle>
          <DialogContent>
              <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                      Esta acción anulará la orden actual y creará una nueva orden con las alternativas modificadas.
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                      La orden original se marcará como "anulada" y se creará una nueva orden con los cambios realizados.
                  </Alert>
              </Box>
              
              <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
              }}>
                  <Typography variant="h6">Alternativas de la Orden</Typography>
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenEditModal()}
                  >
                      Agregar Alternativa
                  </Button>
              </Box>
              
              <TableContainer component={Paper}>
                  <Table size="small">
                      <TableHead>
                          <TableRow>
                              <TableCell>ID</TableCell>
                              <TableCell>Detalle</TableCell>
                              <TableCell>Tipo Item</TableCell>
                              <TableCell>Tema</TableCell>
                              <TableCell>Programa</TableCell>
                              <TableCell>Valor Unitario</TableCell>
                              <TableCell>Total</TableCell>
                              <TableCell>Estado</TableCell>
                              <TableCell>Acciones</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {visibleAlternativas.length === 0 ? (
                              <TableRow>
                                  <TableCell colSpan={9} align="center">
                                      No hay alternativas disponibles
                                  </TableCell>
                              </TableRow>
                          ) : (
                              visibleAlternativas.map((alt) => (
                                  <TableRow key={alt.id}>
                                      <TableCell>{alt.id.toString().startsWith('temp_') ? 'Nuevo' : alt.id}</TableCell>
                                      <TableCell>{alt.detalle || 'Sin detalle'}</TableCell>
                                      <TableCell>{alt.tipo_item || 'N/A'}</TableCell>
                                      <TableCell>{alt.Temas?.NombreTema || alt.nombre_tema || 'N/A'}</TableCell>
                                      <TableCell>{alt.Programas?.descripcion || alt.nombre_programa || 'N/A'}</TableCell>
                                      <TableCell>{alt.valor_unitario ? `$${alt.valor_unitario.toLocaleString()}` : '$0'}</TableCell>
                                      <TableCell>{alt.total_bruto ? `$${alt.total_bruto.toLocaleString()}` : '$0'}</TableCell>
                                      <TableCell>
                                          <Chip 
                                              label={alt._tempStatus === 'new' ? 'Nuevo' : alt._tempStatus === 'modified' ? 'Modificado' : 'Existente'} 
                                              color={alt._tempStatus === 'new' ? 'success' : alt._tempStatus === 'modified' ? 'warning' : 'default'}
                                              size="small"
                                          />
                                      </TableCell>
                                      <TableCell>
                                          <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={() => handleOpenEditModal(alt)}
                                              title="Editar"
                                          >
                                              <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                              size="small"
                                              color="error"
                                              onClick={() => handleDeleteAlternativa(alt.id)}
                                              title="Eliminar"
                                          >
                                              <DeleteIcon fontSize="small" />
                                          </IconButton>
                                      </TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
              </TableContainer>
          </DialogContent>
          <DialogActions>
              <Button onClick={onClose} color="inherit">
                  Cancelar
              </Button>
              <Button 
                  onClick={handleGuardarYReemplazar} 
                  color="primary" 
                  variant="contained"
                  disabled={loading}
              >
                  {loading ? <CircularProgress size={24} /> : 'Guardar y Reemplazar'}
              </Button>
          </DialogActions>
          
          {/* Modal for editing/adding alternatives */}
          {openEditModal && (
              <Dialog
                  open={openEditModal}
                  onClose={handleCloseEditModal}
                  maxWidth="lg"
                  fullWidth
              >
                  <DialogTitle>
                      <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                      }}>
                          <Typography variant="h6">
                              {selectedAlternativa ? 'Editar Alternativa' : 'Agregar Alternativa'}
                          </Typography>
                          <IconButton onClick={handleCloseEditModal} size="small">
                              <CloseIcon />
                          </IconButton>
                      </Box>
                  </DialogTitle>
                  <DialogContent>
                      <EditarAlternativaReemplazo
                          alternativaId={selectedAlternativa?.id}
                          isCreatingNew={!selectedAlternativa}
                          initialData={selectedAlternativa || {
                              id_orden: alternativa.id_orden,
                              anio: alternativa.anio,
                              mes: alternativa.mes
                          }}
                          onSave={handleSaveAlternativa}
                          onCancel={handleCloseEditModal}
                      />
                  </DialogContent>
              </Dialog>
          )}
      </Dialog>
  );
};
// Add this state for the Anular y Reemplazar modal
const [openAnularReemplazarModal, setOpenAnularReemplazarModal] = useState(false);

// Add these functions to handle the modal
const handleOpenAnularReemplazarModal = () => {
    setIsAnularReemplazarMode(true);
    setOpenAnularReemplazarModal(true);
};

const handleCloseAnularReemplazarModal = () => {
    setIsAnularReemplazarMode(false);
    setOpenAnularReemplazarModal(false);
    setTempAlternativas([]);
};
// Function to handle the "Guardar y Reemplazar" action
// Function to handle the "Guardar y Reemplazar" action
const handleGuardarYReemplazar = async () => {
  try {
      setLoading(true);
      
      // 1. Get the original order data
      const { data: ordenOriginal, error: errorOrden } = await supabase
          .from('orden')
          .select('*')
          .eq('id', alternativa.id_orden || alternativa.numerorden)
          .single();
      
      if (errorOrden) throw errorOrden;
      
      console.log("Orden original:", ordenOriginal);
      
      // 2. Determine the "copia" value for the new order
      let copiaValue = 2; // Default starting value if empty
      if (ordenOriginal.copia) {
          // If the original order already has a copia value, increment it
          copiaValue = parseInt(ordenOriginal.copia) + 1;
      }
      
      console.log("Valor de copia para la nueva orden:", copiaValue);
      
      // 3. Create the new order with the correct fields for OrdenesDePublicidad
      const nuevaOrden = {
          numero_correlativo: ordenOriginal.numero_correlativo,
          id_plan: ordenOriginal.id_plan,
          id_campania: ordenOriginal.id_campania,
          id_soporte: ordenOriginal.id_soporte,
          id_contrato: ordenOriginal.id_contrato,
          orden_reemplaza: ordenOriginal.id,
          estado: 'activa',
          copia: copiaValue.toString(),
          fecha_registro: new Date().toISOString()
      };
      
      console.log("Nueva orden a crear:", nuevaOrden);
      
      const { data: nuevaOrdenData, error: errorNuevaOrden } = await supabase
          .from('orden')
          .insert(nuevaOrden)
          .select()
          .single();
      
      if (errorNuevaOrden) {
          console.error("Error al crear nueva orden:", errorNuevaOrden);
          throw errorNuevaOrden;
      }
      
      console.log("Nueva orden creada:", nuevaOrdenData);
      
      // 4. Update the original order status to "anulada"
      const { error: errorUpdateOrden } = await supabase
          .from('orden')
          .update({ estado: 'anulada' })
          .eq('id', ordenOriginal.id);
      
      if (errorUpdateOrden) {
          console.error("Error al anular orden original:", errorUpdateOrden);
          throw errorUpdateOrden;
      }
      
      // 5. Get plan info to extract anio and mes
      const { data: planData, error: errorPlan } = await supabase
          .from('plan')
          .select('anio, mes')
          .eq('id', ordenOriginal.id_plan)
          .single();
          
      if (errorPlan) {
          console.error("Error al obtener información del plan:", errorPlan);
          throw errorPlan;
      }
      
      // 6. Prepare and save the alternatives with correct fields
      let alternativasToSave = tempAlternativas.filter(alt => alt._tempStatus !== 'deleted');
      
      // Transform alternatives to match the database schema
      alternativasToSave = alternativasToSave.map(alt => {
          // Extract only the fields that exist in the alternativa table
          const { 
              _tempStatus, 
              _originalData, 
              id_orden,
              id_contrato,
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
          
          // Remove temporary ID
          if (cleanAlt.id && cleanAlt.id.toString().startsWith('temp_')) {
              delete cleanAlt.id;
          }
          
          // Ensure calendar is properly formatted
          if (cleanAlt.cantidades && Array.isArray(cleanAlt.cantidades)) {
              cleanAlt.calendar = JSON.stringify(cleanAlt.cantidades);
              delete cleanAlt.cantidades;
          } else if (cleanAlt.calendar && typeof cleanAlt.calendar !== 'string') {
              cleanAlt.calendar = JSON.stringify(cleanAlt.calendar);
          }
          
          // Use the correct field names
          const alternativaData = {
              ...cleanAlt,
              numerorden: nuevaOrdenData.id,
              anio: planData.anio,
              mes: planData.mes,
              id_campania: ordenOriginal.id_campania
          };
          
          // Map id_contrato to num_contrato if it exists
          if (id_contrato) {
              alternativaData.num_contrato = id_contrato;
          }
          
          return alternativaData;
      });
      
      console.log("Alternativas preparadas para guardar:", alternativasToSave);
      
      // 7. Insert the alternatives
      const { data: nuevasAlternativas, error: errorAlternativas } = await supabase
          .from('alternativa')
          .insert(alternativasToSave)
          .select();
      
      if (errorAlternativas) {
          console.error("Error al insertar alternativas:", errorAlternativas);
          throw errorAlternativas;
      }
      
      console.log("Nuevas alternativas creadas:", nuevasAlternativas);
      
      // 8. Extract the IDs of the newly created alternatives
      const alternativasIds = nuevasAlternativas.map(alt => alt.id);
      console.log("IDs de alternativas creadas:", alternativasIds);
      
      // 9. Create entries in plan_alternativas table
      const planAlternativasEntries = nuevasAlternativas.map(alt => ({
          id_plan: ordenOriginal.id_plan,
          id_alternativa: alt.id
      }));
      
      console.log("Entradas plan_alternativas a crear:", planAlternativasEntries);
      
      const { error: errorPlanAlternativas } = await supabase
          .from('plan_alternativas')
          .insert(planAlternativasEntries);
      
      if (errorPlanAlternativas) {
          console.error("Error al crear entradas en plan_alternativas:", errorPlanAlternativas);
          throw errorPlanAlternativas;
      }
      
      // 10. Update the alternativas_plan_orden field in the new order with the array of IDs
      console.log("Actualizando alternativas_plan_orden en la orden con:", alternativasIds);
      
      const { error: errorUpdateNuevaOrden } = await supabase
          .from('orden')
          .update({ alternativas_plan_orden: alternativasIds })
          .eq('id', nuevaOrdenData.id);
      
      if (errorUpdateNuevaOrden) {
          console.error("Error al actualizar nueva orden con alternativas:", errorUpdateNuevaOrden);
          throw errorUpdateNuevaOrden;
      }
      
      // Success message
      Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Orden anulada y reemplazada correctamente'
      });
      
      // Close the modal and refresh data
      onCancel();
      
  } catch (error) {
      console.error('Error al anular y reemplazar orden:', error);
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo anular y reemplazar la orden: ' + (error.message || 'Error desconocido')
      });
  } finally {
      setLoading(false);
  }
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
                  .select('id_temas') // Cambiado de 'id_tema' a 'id_temas' según el error
                  .eq('id_campania', alternativa.id_campania);
              
              if (errorRelaciones) throw errorRelaciones;
              
              if (relacionesTemas && relacionesTemas.length > 0) {
                  temasIds = relacionesTemas.map(rel => rel.id_temas); // Cambiado de 'id_tema' a 'id_temas'
              }
          }
          
          // Ahora construimos la consulta para obtener los temas
          let query = supabase
              .from('Temas')
              .select(`
                  *,
                  Calidad(*),
                  Medios(id, NombredelMedio)
              `)
              .order('NombreTema');
          
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
          
          console.log("Temas filtrados:", data); // Para depuración
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
          const valorUnitarioBase = campo === 'valor_unitario' ? valor : prev.valor_unitario;
          const descuento = campo === 'descuento_plan' ? valor : prev.descuento_plan;
          const recargo = campo === 'recargo_plan' ? valor : prev.recargo_plan;
          
          // Obtener el total de cantidades
          const totalCantidades = (prev.cantidades || []).reduce((sum, item) => {
              return sum + (Number(item.cantidad) || 0);
          }, 0);
      
          // Verificar si el medio es TV CABLE o RADIO
          const medioId = prev.id_medio;
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
              total_neto: Math.round(totalNeto),
              total_general: Math.round(totalBruto)
          };
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
    const handleSearchClasificacion = async (search = '') => {
      setLoadingClasificaciones(true);
      try {
          let query = supabase
              .from('Clasificacion')
              .select('*')
              .order('NombreClasificacion');
          
          // Si tenemos un contrato seleccionado, filtramos por ese contrato
          if (alternativa.num_contrato) {
              query = query.eq('id_contrato', alternativa.num_contrato);
          }
          
          if (search) {
              query = query.ilike('NombreClasificacion', `%${search}%`);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          setClasificacionesList(data || []);
      } catch (error) {
          console.error('Error al buscar clasificaciones:', error);
      } finally {
          setLoadingClasificaciones(false);
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
        try {
            if (!nuevaClasificacion.NombreClasificacion) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'El nombre de la clasificación es obligatorio'
                });
                return;
            }
            
            if (editingClasificacion) {
                // Actualizar clasificación existente
                const { error } = await supabase
                    .from('Clasificacion')
                    .update({ NombreClasificacion: nuevaClasificacion.NombreClasificacion })
                    .eq('id', editingClasificacion.id);
                
                if (error) throw error;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Clasificación actualizada correctamente'
                });
            } else {
                // Crear nueva clasificación
                const { data, error } = await supabase
                    .from('Clasificacion')
                    .insert({ NombreClasificacion: nuevaClasificacion.NombreClasificacion })
                    .select();
                
                if (error) throw error;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Clasificación creada correctamente'
                });
                
                // Seleccionar la nueva clasificación
                if (data && data.length > 0) {
                    handleSeleccionarClasificacion(data[0]);
                }
            }
            
            // Cerrar modal y actualizar lista
            handleCloseAddEditClasificacionModal();
            handleSearchClasificacion(searchClasificacion);
        } catch (error) {
            console.error('Error al guardar clasificación:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar la clasificación'
            });
        }
    };
    const handleSavePrograma = async () => {
        try {
            if (!newPrograma.descripcion) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La descripción del programa es obligatoria'
                });
                return;
            }
            
            if (editingPrograma) {
                // Actualizar programa existente
                const { error } = await supabase
                    .from('Programas')
                    .update(newPrograma)
                    .eq('id', editingPrograma.id);
                
                if (error) throw error;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Programa actualizado correctamente'
                });
            } else {
                // Crear nuevo programa
                const { data, error } = await supabase
                    .from('Programas')
                    .insert(newPrograma)
                    .select();
                
                if (error) throw error;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: 'Programa creado correctamente'
                });
                
                // Seleccionar el nuevo programa
                if (data && data.length > 0) {
                    handleSeleccionarPrograma(data[0]);
                }
            }
            
            // Cerrar modal y actualizar lista
            handleCloseAddEditProgramaModal();
            handleSearchPrograma(searchPrograma);
        } catch (error) {
            console.error('Error al guardar programa:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo guardar el programa'
            });
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
        
        setAlternativa(data);
        
        // Obtener información del plan
        if (data.id_orden) {
            fetchPlanInfo(data.id_orden);
        }
    } catch (error) {
        console.error('Error al obtener alternativa:', error);
        // Si hay un error, intentar usar los datos iniciales
        if (initialData) {
            console.log("Usando initialData como fallback:", initialData);
            setAlternativa(initialData);
            
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

    // Función para manejar cambios en el calendario
    const handleCalendarChange = (day, value) => {
        const cantidad = value === '' ? '' : parseInt(value);
        
        setCalendarData(prev => {
            // Buscar si ya existe una entrada para este día
            const existingIndex = prev.findIndex(item => item.dia === day);
            
            if (cantidad === '' || isNaN(cantidad) || cantidad === 0) {
                // Si el valor es vacío, no es un número o es cero, eliminar la entrada
                if (existingIndex >= 0) {
                    return prev.filter(item => item.dia !== day);
                }
                return prev;
            } else {
                // Actualizar o agregar el valor
                if (existingIndex >= 0) {
                    const newData = [...prev];
                    newData[existingIndex] = { dia: day, cantidad };
                    return newData;
                } else {
                    return [...prev, { dia: day, cantidad }];
                }
            }
        });
    };

    // Función para incrementar o decrementar el valor del calendario
    const handleCalendarIncrement = (day, increment) => {
        setCalendarData(prev => {
            // Buscar si ya existe una entrada para este día
            const existingIndex = prev.findIndex(item => item.dia === day);
            
            if (existingIndex >= 0) {
                // Si existe, actualizar el valor
                const currentValue = prev[existingIndex].cantidad;
                const newValue = currentValue + increment;
                
                // No permitir valores negativos
                if (newValue <= 0) {
                    // Si el nuevo valor es cero o negativo, eliminar la entrada
                    return prev.filter(item => item.dia !== day);
                } else {
                    // Actualizar el valor
                    const newData = [...prev];
                    newData[existingIndex] = { dia: day, cantidad: newValue };
                    return newData;
                }
            } else if (increment > 0) {
                // Si no existe y estamos incrementando, crear una nueva entrada
                return [...prev, { dia: day, cantidad: increment }];
            }
            
            // Si no existe y estamos decrementando, no hacer nada
            return prev;
        });
    };

    // Obtener la cantidad para un día específico
    const getDayQuantity = (day) => {
        const dayEntry = calendarData.find(item => item.dia === day);
        return dayEntry ? dayEntry.cantidad : '';
    };

   // Update the handleSave function to properly handle boolean values
   const handleSave = async () => {
    try {
        setLoading(true);
        
        // Usar el estado calendarData para el calendario
        const calendarToSave = alternativa.cantidades || calendarData;
        
        // Preparar los datos de la alternativa con el calendario
        let alternativaData = {
            ...alternativa,
            calendar: JSON.stringify(calendarToSave)
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

    // Componente para el calendario
    const CalendarioAlternativa = ({ anio, mes, cantidades = [], onChange }) => {
      // Asegurarse de que anio y mes sean valores válidos
      const currentDate = new Date();
      const validAnio = anio || currentDate.getFullYear();
      const validMes = mes || currentDate.getMonth() + 1;
      
      const dias = getDiasDelMes(validAnio, validMes);
      
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
    // Calcular el total de cantidades en el calendario
    const calculateTotalQuantity = () => {
        return calendarData.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    };

    // Generar encabezados para el calendario (días de la semana)
    const generateWeekDayHeaders = () => {
        // Orden: Lunes, Martes, ..., Domingo
        const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
        return weekDays.map((day, index) => (
            <TableCell key={index} align="center" sx={{fontSize:'10px', padding: '4px', minWidth: '40px' }}>
                {day}
            </TableCell>
        ));
    };

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
                        value={alternativa.Clasificacion?.NombreClasificacion || ''}
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
                    <Grid container spacing={2}>
                        <Grid item xs={2.4}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Valor Unitario"
                                type="number"
                                value={alternativa.valor_unitario || ''}
                                onChange={(e) => handleMontoChange('valor_unitario', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MonetizationOnIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={2.4}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Descuento (%)"
                                type="number"
                                value={alternativa.descuento_plan || ''}
                                onChange={(e) => handleMontoChange('descuento_plan', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <RemoveCircleIcon color="error" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={2.4}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Recargo (%)"
                                type="number"
                                value={alternativa.recargo_plan || ''}
                                onChange={(e) => handleMontoChange('recargo_plan', e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AddCircleIcon color="success" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={2.4}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Total Bruto"
                                value={alternativa.total_bruto || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <AccountBalanceWalletIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled
                            />
                        </Grid>
                        <Grid item xs={2.4}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Total Neto"
                                value={alternativa.total_neto || ''}
                                InputProps={{
                                    readOnly: true,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ReceiptIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                disabled
                            />
                        </Grid>
                    </Grid>
                </Grid>
                
                     {/* Calendario de cantidades */}
                     <Grid item xs={12}>
                    <CalendarioAlternativa 
                        anio={alternativa.anio || (planInfo && planInfo.anio)} 
                        mes={alternativa.mes || (planInfo && planInfo.mes)} 
                        cantidades={alternativa.cantidades || []} 
                        onChange={handleCantidadChange}
                    />
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={onCancel}
                    sx={{ mr: 1 }}
                >
                    Cancelar
                </Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Guardar'}
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
    );
};

export default EditarAlternativaReemplazo;
