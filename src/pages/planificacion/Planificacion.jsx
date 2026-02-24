import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import {
  Container,
  Paper,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  DialogActions,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Switch,
  FormControlLabel,
  TableSortLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Title as TitleIcon,
  CalendarMonth as CalendarMonthIcon,
  EventNote as EventNoteIcon,
  Flag as FlagIcon,
  Topic as TopicIcon,
  Timer as TimerIcon,
  ColorLens as ColorLensIcon,
  Code as CodeIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

import './Planificacion.css';
import Swal from 'sweetalert2';

const Planificacion = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/');
  };
  const [openClienteModal, setOpenClienteModal] = useState(true);
  const [openCampanaModal, setOpenCampanaModal] = useState(false);
  const [openNuevoPlanModal, setOpenNuevoPlanModal] = useState(false);
  const [openEditPlanModal, setOpenEditPlanModal] = useState(false);
  const [openNuevoTemaModal, setOpenNuevoTemaModal] = useState(false);
  const [openEditTemaModal, setOpenEditTemaModal] = useState(false);
  const [openDuplicatePlanModal, setOpenDuplicatePlanModal] = useState(false);
  const [planToDuplicate, setPlanToDuplicate] = useState(null);
  const [duplicatePlanData, setDuplicatePlanData] = useState({
    nombre_plan: '',
    anio: '',
    mes: ''
  });
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [campanas, setCampanas] = useState([]);
  const [temas, setTemas] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCampana, setSelectedCampana] = useState(null);
  const [tempSelectedCampana, setTempSelectedCampana] = useState(null);
  const [selectedCampanaFromClick, setSelectedCampanaFromClick] = useState(false);
  const [nuevoPlan, setNuevoPlan] = useState({
    nombre_plan: '',
    anio: '',
    mes: '',
    estado: null,
    estado2: null
  });
  const [editingPlan, setEditingPlan] = useState({
    id: null,
    nombre_plan: '',
    anio: '',
    mes: '',
    estado: '',
    estado2: ''
  });
  const [selectedTema, setSelectedTema] = useState(null);
  const [nuevoTema, setNuevoTema] = useState({
    NombreTema: '',
    Duracion: '',
    id_medio: '',
    id_Calidad: '',
    color: '',
    CodigoMegatime: '',
    rubro: '',
    cooperado: ''
  });
  const [anios, setAnios] = useState([]);
  const [meses, setMeses] = useState([]);
  const [medios, setMedios] = useState([]);
  const [calidades, setCalidades] = useState([]);
  const [visibleFields, setVisibleFields] = useState({
    duracion: false,
    color: false,
    codigo_megatime: false,
    calidad: false,
    cooperado: false,
    rubro: false
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('anio');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);

    const sortedCampanas = [...campanas].sort((a, b) => {
      const yearA = Number(a.Anios?.years) || 0;
      const yearB = Number(b.Anios?.years) || 0;
      
      // Secondary sort by name
      const nameA = a.NombreCampania || '';
      const nameB = b.NombreCampania || '';

      if (property === 'anio') {
        if (yearA !== yearB) {
          return newOrder === 'asc' ? yearA - yearB : yearB - yearA;
        }
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    setCampanas(sortedCampanas);
  };

  // Efecto para restaurar el estado desde sessionStorage
  useEffect(() => {
    const savedCliente = sessionStorage.getItem('planificacion_selectedCliente');
    const savedCampana = sessionStorage.getItem('planificacion_selectedCampana');
    
    if (savedCliente) {
      const parsedCliente = JSON.parse(savedCliente);
      setSelectedCliente(parsedCliente);
      fetchCampanas(parsedCliente.id_cliente);
      
      if (savedCampana) {
        const parsedCampana = JSON.parse(savedCampana);
        setSelectedCampana(parsedCampana);
        setTempSelectedCampana(parsedCampana);
        setOpenClienteModal(false);
        setOpenCampanaModal(false);
      }
    }
  }, []);

  // Efecto para guardar el estado en sessionStorage
  useEffect(() => {
    if (selectedCliente) {
      sessionStorage.setItem('planificacion_selectedCliente', JSON.stringify(selectedCliente));
    } else {
      sessionStorage.removeItem('planificacion_selectedCliente');
    }
    
    if (selectedCampana) {
      sessionStorage.setItem('planificacion_selectedCampana', JSON.stringify(selectedCampana));
    } else {
      sessionStorage.removeItem('planificacion_selectedCampana');
    }
  }, [selectedCliente, selectedCampana]);

  useEffect(() => {
    fetchClientes();
    fetchMedios();
    fetchCalidades();
  }, []);

  useEffect(() => {
    if (selectedCampana) {
      fetchTemasForCampana(selectedCampana.id_campania);
      fetchPlanes();
    }
  }, [selectedCampana]);

  useEffect(() => {
    fetchAniosYMeses();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      let query = supabase
        .from('Clientes')
        .select('id_cliente, nombreCliente, RUT, razonSocial')
        .order('nombreCliente');

      if (user?.Perfiles?.NombrePerfil === 'Área Planificación' && user?.Grupos?.id_grupo) {
        query = query.eq('id_grupo', user.Grupos.id_grupo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      if (error.code === '25P02') return;
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los clientes'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampanas = async (clienteId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Campania')
        .select(`
          *,
          Clientes!inner (
            id_cliente,
            nombreCliente
          ),
          Productos!id_Producto (
            id,
            NombreDelProducto
          ),
          Anios!Anio (
            id,
            years
          ),
          Agencias (
            id,
            NombreIdentificador
          )
        `)
        .eq('id_Cliente', clienteId);

      if (error) throw error;

      // Ordenar por año (menor a mayor) y luego por nombre
      const sortedData = (data || []).sort((a, b) => {
        const yearA = Number(a.Anios?.years) || 0;
        const yearB = Number(b.Anios?.years) || 0;
        
        if (yearA !== yearB) {
          return yearA - yearB;
        }
        return a.NombreCampania.localeCompare(b.NombreCampania);
      });

      setCampanas(sortedData);
      setOrder('asc');
      setOrderBy('anio');
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las campañas'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemasForCampana = async (campaniaId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campania_temas')
        .select(`
          id_temas,
          Temas!inner (
            id_tema,
            NombreTema,
            Duracion,
            CodigoMegatime,
            color,
            cooperado,
            rubro,
            estado,
            Medios:id_medio (
              id,
              NombredelMedio
            ),
            Calidad:id_Calidad (
              id,
              NombreCalidad
            )
          )
        `)
        .eq('id_campania', campaniaId);

      if (error) throw error;

      const temasTransformados = data?.map(item => ({
        ...item.Temas,
        id_tema: item.id_temas,
        Calidad: item.Temas.Calidad ? {
          id_calidad: item.Temas.Calidad.id,
          NombreCalidad: item.Temas.Calidad.NombreCalidad
        } : null,
        Medios: item.Temas.Medios ? {
          id_medio: item.Temas.Medios.id,
          NombredelMedio: item.Temas.Medios.NombredelMedio
        } : null
      })) || [];

      setTemas(temasTransformados);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los temas'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plan')
        .select(`
          *,
          Anios (id, years),
          Meses (Id, Nombre),
          plan_alternativas (id_plan)
        `)
        .eq('id_campania', selectedCampana.id_campania);

      if (error) throw error;
      setPlanes(data || []);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los planes'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    // Verificar si el plan tiene alternativas
    if (plan.plan_alternativas && plan.plan_alternativas.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'No se puede eliminar',
        text: 'El plan tiene alternativas asociadas. Elimine las alternativas primero.'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede revertir",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        
        // Eliminar relación campana_planes
        const { error: relError } = await supabase
          .from('campana_planes')
          .delete()
          .eq('id_plan', plan.id);
          
        if (relError) throw relError;

        // Eliminar el plan
        const { error: planError } = await supabase
          .from('plan')
          .delete()
          .eq('id', plan.id);

        if (planError) throw planError;

        await fetchPlanes();

        Swal.fire(
          'Eliminado!',
          'El plan ha sido eliminado.',
          'success'
        );
      } catch (error) {
        console.error('Error al eliminar plan:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el plan'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDuplicatePlan = (plan) => {
    setPlanToDuplicate(plan);
    setDuplicatePlanData({
      nombre_plan: `${plan.nombre_plan} (Copia)`,
      anio: plan.anio,
      mes: plan.mes
    });
    setOpenDuplicatePlanModal(true);
  };

  const handleConfirmDuplicate = async () => {
    try {
      if (!duplicatePlanData.nombre_plan || !duplicatePlanData.anio || !duplicatePlanData.mes) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos incompletos',
          text: 'Por favor complete todos los campos'
        });
        return;
      }

      setLoading(true);
      const plan = planToDuplicate;

      // 1. Crear el nuevo plan con los datos del modal
      const { data: newPlan, error: createPlanError } = await supabase
        .from('plan')
        .insert([{
          nombre_plan: duplicatePlanData.nombre_plan,
          anio: duplicatePlanData.anio,
          mes: duplicatePlanData.mes,
          estado: 'P', // Pendiente por defecto
          estado2: null, // Sin estado de aprobación
          id_campania: plan.id_campania
        }])
        .select()
        .single();

      if (createPlanError) throw createPlanError;

      // Obtener el ID correcto
      const newPlanId = newPlan.id || newPlan.id_plan;

      if (!newPlanId) throw new Error('No se pudo obtener el ID del nuevo plan');

      // 2. Asociar el nuevo plan a la campaña
      const { error: relError } = await supabase
        .from('campana_planes')
        .insert([{
          id_campania: plan.id_campania,
          id_plan: newPlanId
        }]);

      if (relError) throw relError;

      // 3. Obtener las alternativas del plan original
      const { data: planAlternativas, error: fetchAltError } = await supabase
        .from('plan_alternativas')
        .select('id_alternativa')
        .eq('id_plan', plan.id);

      if (fetchAltError) throw fetchAltError;

      if (planAlternativas && planAlternativas.length > 0) {
        const originalAltIds = planAlternativas.map(pa => pa.id_alternativa);
        
        if (originalAltIds.length > 0) {
          // Obtener los detalles completos de las alternativas
          const { data: fullAlternativas, error: fullAltError } = await supabase
            .from('alternativa')
            .select('*')
            .in('id', originalAltIds)
            .or('anulada.is.null,anulada.eq.false');

          if (fullAltError) throw fullAltError;

          if (fullAlternativas && fullAlternativas.length > 0) {
            // Preparar las nuevas alternativas
            // IMPORTANTE: Actualizar el año y mes en las alternativas también para que coincidan con el plan
            const newAlternativasData = fullAlternativas.map(alt => {
              const { id, created_at, numerorden, copia, ...rest } = alt;
              return {
                ...rest,
                anio: duplicatePlanData.anio, // Actualizar con el año seleccionado
                mes: duplicatePlanData.mes,   // Actualizar con el mes seleccionado
                numerorden: null,
                ordencreada: null,
                copia: null
              };
            });

            // Insertar nuevas alternativas
            const { data: createdAlternativas, error: insertAltError } = await supabase
              .from('alternativa')
              .insert(newAlternativasData)
              .select('id');

            if (insertAltError) throw insertAltError;

            // 4. Asociar nuevas alternativas al nuevo plan
            if (createdAlternativas && createdAlternativas.length > 0) {
              const newPlanAlternativasRel = createdAlternativas.map(alt => ({
                id_plan: newPlanId,
                id_alternativa: alt.id
              }));

              const { error: linkError } = await supabase
                .from('plan_alternativas')
                .insert(newPlanAlternativasRel);

              if (linkError) throw linkError;
            }
          }
        }
      }

      await fetchPlanes();
      setOpenDuplicatePlanModal(false);
      setPlanToDuplicate(null);

      Swal.fire({
        icon: 'success',
        title: 'Duplicado!',
        text: 'El plan ha sido duplicado exitosamente.',
        showConfirmButton: false,
        timer: 1500
      });

    } catch (error) {
      console.error('Error al duplicar plan:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo duplicar el plan: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAniosYMeses = async () => {
    try {
      const [aniosResult, mesesResult] = await Promise.all([
        supabase.from('Anios').select('*').order('years'),
        supabase.from('Meses').select('*').order('Id')
      ]);

      if (aniosResult.error) throw aniosResult.error;
      if (mesesResult.error) throw mesesResult.error;

      setAnios(aniosResult.data || []);
      setMeses(mesesResult.data || []);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los años y meses'
      });
    }
  };

  const fetchMedios = async () => {
    try {
      const { data, error } = await supabase
        .from('Medios')
        .select(`
          id,
          NombredelMedio,
          duracion,
          color,
          codigo_megatime,
          calidad,
          cooperado,
          rubro
        `)
        .order('NombredelMedio');

      if (error) throw error;
      
      const mediosConCampos = data.map(medio => ({
        ...medio,
        duracion: Boolean(medio.duracion),
        color: Boolean(medio.color),
        codigo_megatime: Boolean(medio.codigo_megatime),
        calidad: Boolean(medio.calidad),
        cooperado: Boolean(medio.cooperado),
        rubro: Boolean(medio.rubro)
      }));

      setMedios(mediosConCampos || []);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los medios: ' + error.message
      });
    }
  };

  const fetchCalidades = async () => {
    try {
      const { data, error } = await supabase
        .from('Calidad')
        .select('id, NombreCalidad')
        .order('NombreCalidad');

      if (error) throw error;
      setCalidades(data || []);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las calidades'
      });
    }
  };

  const handleClienteSelect = async (cliente) => {
    try {
      setSelectedCliente(cliente);
      await fetchCampanas(cliente.id_cliente);
      setOpenClienteModal(false);
      setOpenCampanaModal(true);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo seleccionar el cliente'
      });
    }
  };

  const handleCampanaClick = async (campana) => {
    setSelectedCampanaFromClick(true);
    setTempSelectedCampana(campana);
    await fetchTemasForCampana(campana.id_campania);
  };

  const handleConfirmSelection = () => {
    setSelectedCampana(tempSelectedCampana);
    setOpenCampanaModal(false);
  };

  const handleCloseCampanaModal = () => {
    setOpenCampanaModal(false);
    setTempSelectedCampana(null);
    setSelectedCampanaFromClick(false);
    // Al cerrar el modal de campaña, volvemos al de seleccionar cliente
    setOpenClienteModal(true);
  };

  const handleCambiarCampana = () => {
    setSelectedCampana(null);
    setTempSelectedCampana(null);
    setOpenCampanaModal(true);
    setOpenClienteModal(false);
  };

  const handleResetSelection = () => {
    setSelectedCliente(null);
    setSelectedCampana(null);
    setTemas([]);
    setPlanes([]);
    setOpenClienteModal(true);
  };

  const handleNuevoPlanChange = (field, value) => {
    setNuevoPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreatePlan = async () => {
    try {
      setLoading(true);

      if (!selectedCampana?.id_campania) {
        throw new Error('No hay una campaña seleccionada');
      }

      // Create the plan
      const { data: planData, error: planError } = await supabase
        .from('plan')
        .insert([{
          nombre_plan: nuevoPlan.nombre_plan,
          anio: nuevoPlan.anio,
          mes: nuevoPlan.mes,
          estado: 'P',
          estado2: null,
          id_campania: selectedCampana.id_campania
        }])
        .select()
        .single();

      if (planError) throw planError;
      if (!planData) throw new Error('No se devolvió el plan creado');

      // Create the campaign-plan relationship
      const { error: relError } = await supabase
        .from('campana_planes')
        .insert([{
          id_campania: selectedCampana.id_campania,
          id_plan: planData.id_plan
        }]);

      if (relError) throw relError;

      // Update plans list
      await fetchPlanes();

      // Close modal and reset form
      setOpenNuevoPlanModal(false);
      setNuevoPlan({
        nombre_plan: '',
        anio: '',
        mes: '',
        estado: null,
        estado2: null
      });

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Plan creado exitosamente',
        showConfirmButton: false,
        timer: 1500
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo crear el plan'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanStatus = async (planId, newStatus) => {
    try {
      const { error } = await supabase
        .from('plan')
        .update({ estado2: newStatus })
        .eq('id', planId);

      if (error) throw error;

      await fetchPlanes();
      
      Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del plan'
      });
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({
      id: plan.id,
      nombre_plan: plan.nombre_plan,
      anio: plan.anio,
      mes: plan.mes,
      estado: plan.estado,
      estado2: plan.estado2
    });
    setOpenEditPlanModal(true);
  };

  const handleUpdatePlan = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('plan')
        .update({
          nombre_plan: editingPlan.nombre_plan,
          anio: editingPlan.anio,
          mes: editingPlan.mes,
          estado: editingPlan.estado,
          estado2: editingPlan.estado2
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      await fetchPlanes();
      setOpenEditPlanModal(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Plan actualizado',
        text: 'El plan se ha actualizado exitosamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el plan'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlanChange = (field) => (event) => {
    setEditingPlan(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDuplicatePlanChange = (field, value) => {
    setDuplicatePlanData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditTemaClick = async (tema) => {
    setIsEditMode(true);
    setSelectedTema(tema);

    // Asegurarse de que los medios estén cargados
    if (medios.length === 0) {
      await fetchMedios();
    }

    // Asegurarse de que las calidades estén cargadas
    if (calidades.length === 0) {
      await fetchCalidades();
    }

    // Obtener el id_medio del objeto Medios anidado
    const medioId = tema.Medios?.id_medio || '';

    setNuevoTema({
      id_tema: tema.id_tema,
      NombreTema: tema.NombreTema || '',
      Duracion: tema.Duracion || '',
      id_medio: medioId.toString(), // Usar el id_medio del objeto Medios
      id_Calidad: tema.id_Calidad?.toString() || '',
      color: tema.color || '',
      CodigoMegatime: tema.CodigoMegatime || '',
      rubro: tema.rubro || '',
      cooperado: tema.cooperado || ''
    });

    // Actualizar los campos visibles según el medio seleccionado
    if (medioId) {
      const medio = medios.find(m => m.id === medioId);
      if (medio) {
        setVisibleFields({
          duracion: medio.duracion,
          color: medio.color,
          codigo_megatime: medio.codigo_megatime,
          calidad: medio.calidad,
          cooperado: medio.cooperado,
          rubro: medio.rubro
        });
      }
    }

    setOpenNuevoTemaModal(true);
  };

  const handleCloseModals = () => {
    setOpenNuevoTemaModal(false);
    setOpenEditTemaModal(false);
    setSelectedTema(null);
    setIsEditMode(false);
    setNuevoTema({
      NombreTema: '',
      Duracion: '',
      id_medio: '',
      id_Calidad: '',
      color: '',
      CodigoMegatime: '',
      rubro: '',
      cooperado: ''
    });
  };

  const handleMedioChange = (event) => {
    const medioId = event.target.value;

    // Encontrar el medio seleccionado
    const selectedMedio = medios.find(m => m.id.toString() === medioId);
    
    if (selectedMedio) {
      // Actualizar los campos visibles según el medio
      setVisibleFields({
        duracion: selectedMedio.duracion,
        color: selectedMedio.color,
        codigo_megatime: selectedMedio.codigo_megatime,
        calidad: selectedMedio.calidad,
        cooperado: selectedMedio.cooperado,
        rubro: selectedMedio.rubro
      });
    }

    // Actualizar el valor del medio en el estado
    setNuevoTema(prev => ({
      ...prev,
      id_medio: medioId,
      // Resetear valores relacionados si el medio cambia
      ...(isEditMode ? {} : {
        id_Calidad: '',
        Duracion: '',
        color: '',
        CodigoMegatime: '',
        rubro: '',
        cooperado: ''
      })
    }));
  };

  const handleNuevoTemaChange = (event) => {
    const { name, value } = event.target;
    setNuevoTema(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardarTema = async () => {
    try {
      setLoading(true);

      if (!tempSelectedCampana?.id_campania) {
        throw new Error('No hay una campaña seleccionada');
      }

      // Convertir el id_medio a número para la base de datos
      const id_medio = nuevoTema.id_medio ? parseInt(nuevoTema.id_medio) : null;

      if (isEditMode) {
        // Actualizar tema existente
        const { error: updateError } = await supabase
          .from('Temas')
          .update({
            NombreTema: nuevoTema.NombreTema,
            Duracion: nuevoTema.Duracion || null,
            CodigoMegatime: nuevoTema.CodigoMegatime || null,
            id_Calidad: nuevoTema.id_Calidad ? parseInt(nuevoTema.id_Calidad) : null,
            color: nuevoTema.color || null,
            cooperado: nuevoTema.cooperado || '',
            rubro: nuevoTema.rubro || null,
            id_medio: id_medio
          })
          .eq('id_tema', selectedTema.id_tema);

        if (updateError) throw updateError;

      } else {
        // Código existente para crear nuevo tema
        const { data: maxIdData, error: maxIdError } = await supabase
          .from('Temas')
          .select('id_tema')
          .order('id_tema', { ascending: false })
          .limit(1);

        if (maxIdError) throw maxIdError;

        const nextId = maxIdData.length > 0 ? maxIdData[0].id_tema + 1 : 1;

        const temaDataToInsert = {
          id_tema: nextId,
          NombreTema: nuevoTema.NombreTema,
          Duracion: nuevoTema.Duracion || null,
          CodigoMegatime: nuevoTema.CodigoMegatime || null,
          id_Calidad: nuevoTema.id_Calidad ? parseInt(nuevoTema.id_Calidad) : null,
          color: nuevoTema.color || null,
          cooperado: nuevoTema.cooperado || '',
          rubro: nuevoTema.rubro || null,
          estado: '1',
          id_medio: id_medio
        };

        const { error: temaError } = await supabase
          .from('Temas')
          .insert([temaDataToInsert]);

        if (temaError) throw temaError;

        const { error: campaniaTemasError } = await supabase
          .from('campania_temas')
          .insert([{
            id_campania: tempSelectedCampana.id_campania,
            id_temas: nextId
          }]);

        if (campaniaTemasError) throw campaniaTemasError;
      }

      // Actualizar la lista de temas
      await fetchTemasForCampana(tempSelectedCampana.id_campania);

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: isEditMode ? 'Tema actualizado correctamente' : 'Tema agregado correctamente'
      });

      handleCloseModals();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo ${isEditMode ? 'actualizar' : 'agregar'} el tema: ` + (error.message || 'Error desconocido')
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCliente || !selectedCampana) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        {/* Modal de Selección de Cliente */}
        <Dialog 
          open={openClienteModal} 
          maxWidth="md" 
          fullWidth
          onClose={handleClose}
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ textAlign: 'left' }}>
            Seleccionar Cliente
            </Typography>
            <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'black',
            }}
            >
            <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mt: 2 }}
            InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
          </DialogTitle>
          <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" m={3}>
            <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
            <Table>
              <TableHead>
              <TableRow>
                <TableCell>Nombre del Cliente</TableCell>
                <TableCell>Razón Social</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Acción</TableCell>
              </TableRow>
              </TableHead>
              <TableBody>
              {clientes
                .filter(cliente =>
                cliente.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cliente.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((cliente) => (
                <TableRow key={cliente.id_cliente}>
                  <TableCell>{cliente.nombreCliente}</TableCell>
                  <TableCell>{cliente.razonSocial}</TableCell>
                  <TableCell>{cliente.RUT}</TableCell>
                  <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleClienteSelect(cliente)}
                  >
                    Seleccionar
                  </Button>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
            </TableContainer>
          )}
          </DialogContent>
        </Dialog>

        {/* Modal de Selección de Campaña */}
        <Dialog 
          open={openCampanaModal} 
          maxWidth={false}
          fullWidth
          onClose={handleCloseCampanaModal}
          PaperProps={{
          sx: {
            minHeight: '90vh',
            maxHeight: '90vh',
            width: '95%',
            margin: '16px'
          }
          }}
        >
          <DialogTitle sx={{ 
          textAlign: 'center', 
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          position: 'relative'
          }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
            <Typography variant="h6">
              Seleccionar Campaña
            </Typography>
            <Typography variant="subtitle2" color="primary">
              Cliente: {selectedCliente?.nombreCliente}
            </Typography>
            </Box>
            <IconButton
            aria-label="close"
            onClick={handleCloseCampanaModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'black',
            }}
            >
            <CloseIcon />
            </IconButton>
          </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" className="campaign-card" sx={{ height: 'calc(75vh - 100px)' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>
                      Campañas Disponibles
                    </Typography>
                    <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Campaña</TableCell>
                            <TableCell>
                              <TableSortLabel
                                active={orderBy === 'anio'}
                                direction={orderBy === 'anio' ? order : 'asc'}
                                onClick={() => handleRequestSort('anio')}
                              >
                                Año
                              </TableSortLabel>
                            </TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell>Agencia</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {campanas.map((campana) => (
                            <TableRow
                              key={campana.id_campania}
                              onClick={() => handleCampanaClick(campana)}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: tempSelectedCampana?.id_campania === campana.id_campania && selectedCampanaFromClick ? '#e3f2fd' : 'inherit',
                                '&:hover': {
                                  backgroundColor: '#f5f5f5',
                                },
                              }}
                            >
                              <TableCell>{campana.NombreCampania}</TableCell>
                              <TableCell>{campana.Anios?.years}</TableCell>
                              <TableCell>{campana.Clientes?.nombreCliente}</TableCell>
                              <TableCell>{campana.Productos?.NombreDelProducto}</TableCell>
                              <TableCell>{campana.Agencias?.NombreIdentificador || 'No especificada'}</TableCell>
                            </TableRow>
                          ))}
                          {campanas.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                No hay campañas disponibles
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" className="themes-card" sx={{ height: 'calc(75vh - 100px)' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Temas de la Campaña
                      </Typography>
                      {tempSelectedCampana && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenNuevoTemaModal(true)}
                          >
                            Agregar Tema
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => selectedTema && handleEditTemaClick(selectedTema)}
                            disabled={!selectedTema}
                          >
                            Editar Tema
                          </Button>
                        </Box>
                      )}
                    </Box>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                        <CircularProgress />
                      </Box>
                    ) : temas.length > 0 ? (
                      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>TEMA-AVISO</TableCell>
                              <TableCell>Duración</TableCell>
                              <TableCell>Medio</TableCell>
                              <TableCell>Calidad</TableCell>
                              <TableCell>Color</TableCell>
                              <TableCell>Código Megatime</TableCell>
                              <TableCell>Rubro</TableCell>
                              <TableCell>Cooperado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {temas.map((tema) => (
                              <TableRow
                                key={tema.id_tema}
                                hover
                                selected={selectedTema?.id_tema === tema.id_tema}
                                onClick={() => setSelectedTema(tema)}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&.Mui-selected': {
                                    backgroundColor: 'primary.lighter'
                                  }
                                }}
                              >
                                <TableCell>{tema.NombreTema}</TableCell>
                                <TableCell>{tema.Duracion}</TableCell>
                                <TableCell>{tema.Medios?.NombredelMedio}</TableCell>
                                <TableCell>{tema.Calidad?.NombreCalidad}</TableCell>
                                <TableCell>{tema.color}</TableCell>
                                <TableCell>{tema.CodigoMegatime}</TableCell>
                                <TableCell>{tema.rubro}</TableCell>
                                <TableCell>{tema.cooperado ? 'Sí' : 'No'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexGrow: 1,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        p: 2
                      }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                          {tempSelectedCampana ? 
                            "No hay temas disponibles para esta campaña" : 
                            "Seleccione una campaña para ver sus temas"}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={() => {
                setOpenCampanaModal(false);
                setOpenClienteModal(true);
              }}
              variant="outlined"
            >
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSelection}
              disabled={!tempSelectedCampana}
              size="large"
            >
              Confirmar Selección
            </Button>
          </DialogActions>

          {/* Modal de Nuevo Tema (anidado dentro del modal de campañas) */}
          <Dialog 
            open={openNuevoTemaModal} 
            onClose={handleCloseModals}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Agregar Nuevo Tema</Typography>
                <IconButton onClick={handleCloseModals}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Medio</InputLabel>
                    <Select
                      value={nuevoTema.id_medio || ''}
                      onChange={handleMedioChange}
                      name="id_medio"
                      label="Medio"
                      required
                    >
                      <MenuItem value="">
                        <em>Seleccione un medio</em>
                      </MenuItem>
                      {medios.map((medio) => (
                        <MenuItem key={medio.id} value={medio.id}>
                          {medio.NombredelMedio}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del Tema"
                    name="NombreTema"
                    value={nuevoTema.NombreTema}
                    onChange={handleNuevoTemaChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TopicIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                {visibleFields.duracion && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Duración"
                      name="Duracion"
                      value={nuevoTema.Duracion}
                      onChange={handleNuevoTemaChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimerIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                {visibleFields.color && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Color"
                      name="color"
                      value={nuevoTema.color}
                      onChange={handleNuevoTemaChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ColorLensIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                {visibleFields.codigo_megatime && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Código Megatime"
                      name="CodigoMegatime"
                      value={nuevoTema.CodigoMegatime}
                      onChange={handleNuevoTemaChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CodeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
                {visibleFields.calidad && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Calidad</InputLabel>
                      <Select
                        value={nuevoTema.id_Calidad || ''}
                        onChange={handleNuevoTemaChange}
                        name="id_Calidad"
                        label="Calidad"
                      >
                        <MenuItem value="">
                          <em>Seleccione una calidad</em>
                        </MenuItem>
                        {calidades.map((calidad) => (
                          <MenuItem key={calidad.id} value={calidad.id}>
                            {calidad.NombreCalidad}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {visibleFields.cooperado && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Cooperado</InputLabel>
                      <Select
                        value={nuevoTema.cooperado}
                        onChange={handleNuevoTemaChange}
                        name="cooperado"
                        label="Cooperado"
                      >
                        <MenuItem value="">No</MenuItem>
                        <MenuItem value="Sí">Sí</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {visibleFields.rubro && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rubro"
                      name="rubro"
                      value={nuevoTema.rubro}
                      onChange={handleNuevoTemaChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CategoryIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModals}>Cancelar</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGuardarTema}
                disabled={loading || !nuevoTema.NombreTema || !nuevoTema.id_medio}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Dialog>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Planificación de Medios
            </Typography>
            <Typography variant="subtitle1" color="primary">
              {selectedCliente?.nombreCliente} - {selectedCampana?.NombreCampania} - {selectedCampana?.Agencias?.NombreIdentificador || 'Sin Agencia'}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              onClick={handleCambiarCampana}
              sx={{ mr: 2 }}
            >
              Cambiar Campaña
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetSelection}
            >
              Cambiar Selección
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Planes de la Campaña
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenNuevoPlanModal(true)}
                  >
                    Nuevo Plan
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nombre del Plan</TableCell>
                        <TableCell>Campaña</TableCell>
                        <TableCell>Año</TableCell>
                        <TableCell>Mes</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Estado 2</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                        <TableCell align="center">Alternativas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {planes.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>{plan.nombre_plan}</TableCell>
                          <TableCell>{selectedCampana?.NombreCampania}</TableCell>
                          <TableCell>{plan.Anios?.years}</TableCell>
                          <TableCell>{plan.Meses?.Nombre}</TableCell>
                          <TableCell>
                            <Box sx={{ 
                              color: plan.estado === 'P' ? 'warning.main' : 'success.main',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              <Typography variant="body2">
                                {plan.estado === 'P' ? 'Pendiente' : 'Cerrado'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={
                              plan.estado2 === 'aprobado' ? 'success.main' :
                              plan.estado2 === 'cancelado' ? 'error.main' :
                              'text.secondary'
                            }>
                              {plan.estado2 ? plan.estado2.charAt(0).toUpperCase() + plan.estado2.slice(1) : 'Sin estado'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                color="primary"
                                onClick={() => handleEditPlan(plan)}
                                size="small"
                                title="Editar plan"
                                disabled={plan.estado2 === 'aprobado'}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                color="success"
                                onClick={() => handleUpdatePlanStatus(plan.id, 'aprobado')}
                                size="small"
                                title="Aprobar"
                                disabled={plan.estado2 === 'aprobado'}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleUpdatePlanStatus(plan.id, 'cancelado')}
                                size="small"
                                title="Cancelar"
                                disabled={plan.estado2 === 'cancelado'}
                              >
                                <CancelIcon />
                              </IconButton>
                              <IconButton
                                color="primary"
                                onClick={() => handleDuplicatePlan(plan)}
                                size="small"
                                title="Duplicar plan"
                              >
                                <ContentCopyIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDeletePlan(plan)}
                                size="small"
                                title="Eliminar plan"
                                disabled={plan.estado2 === 'aprobado' || (plan.plan_alternativas && plan.plan_alternativas.length > 0)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const planId = plan?.id;
                                if (!planId) {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'No se encontró el ID del plan'
                                  });
                                  return;
                                }
                                navigate(`/planificacion/alternativas/${planId}`);
                              }}
                            >
                              Alternativas
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {planes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            No hay planes disponibles para esta campaña
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

        {/* Modal de Nuevo Plan */}
        <Dialog
        open={openNuevoPlanModal}
        onClose={() => setOpenNuevoPlanModal(false)}
        maxWidth="sm"
        fullWidth
        >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
          <AddIcon />
          Nuevo Plan
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
            label="Nombre del Plan"
            fullWidth
            value={nuevoPlan.nombre_plan}
            onChange={(e) => handleNuevoPlanChange('nombre_plan', e.target.value)}
            InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <TitleIcon />
              </InputAdornment>
              ),
            }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
            <InputLabel>Año</InputLabel>
            <Select
              value={nuevoPlan.anio}
              onChange={(e) => handleNuevoPlanChange('anio', e.target.value)}
              label="Año"
              startAdornment={
              <InputAdornment position="start">
                <CalendarMonthIcon />
              </InputAdornment>
              }
            >
              {anios.map((anio) => (
              <MenuItem key={anio.id} value={anio.id}>
                {anio.years}
              </MenuItem>
              ))}
            </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
            <InputLabel>Mes</InputLabel>
            <Select
              value={nuevoPlan.mes}
              onChange={(e) => handleNuevoPlanChange('mes', e.target.value)}
              label="Mes"
              startAdornment={
              <InputAdornment position="start">
                <EventNoteIcon />
              </InputAdornment>
              }
            >
              {meses.map((mes) => (
              <MenuItem key={mes.Id} value={mes.Id}>
                {mes.Nombre}
              </MenuItem>
              ))}
            </Select>
            </FormControl>
          </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
          onClick={() => setOpenNuevoPlanModal(false)}
          startIcon={<CancelIcon />}
          >
          Cancelar
          </Button>
          <Button
          variant="contained"
          onClick={handleCreatePlan}
          disabled={loading || !nuevoPlan.nombre_plan || !nuevoPlan.anio || !nuevoPlan.mes}
          startIcon={<AddIcon />}
          >
          {loading ? <CircularProgress size={24} /> : 'Crear Plan'}
          </Button>
        </DialogActions>
        </Dialog>

        {/* Modal de Edición de Plan */}
        <Dialog 
        open={openEditPlanModal} 
        onClose={() => setOpenEditPlanModal(false)}
        maxWidth="sm"
        fullWidth
        >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
          <EditIcon />
          Editar Plan
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
            <TextField
              label="Nombre del Plan"
              fullWidth
              value={editingPlan.nombre_plan}
              onChange={handleEditPlanChange('nombre_plan')}
              InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <TitleIcon />
              </InputAdornment>
              ),
              }}
            />
            </Grid>
            <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Año</InputLabel>
              <Select
              value={editingPlan.anio}
              onChange={handleEditPlanChange('anio')}
              label="Año"
              startAdornment={
              <InputAdornment position="start">
                <CalendarMonthIcon />
              </InputAdornment>
              }
              >
              {anios.map((anio) => (
              <MenuItem key={anio.id} value={anio.id}>
                {anio.years}
              </MenuItem>
              ))}
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Mes</InputLabel>
              <Select
              value={editingPlan.mes}
              onChange={handleEditPlanChange('mes')}
              label="Mes"
              startAdornment={
              <InputAdornment position="start">
                <EventNoteIcon />
              </InputAdornment>
              }
              >
              {meses.map((mes) => (
              <MenuItem key={mes.Id} value={mes.Id}>
                {mes.Nombre}
              </MenuItem>
              ))}
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
              value={editingPlan.estado}
              onChange={handleEditPlanChange('estado')}
              label="Estado"
              startAdornment={
              <InputAdornment position="start">
                <FlagIcon />
              </InputAdornment>
              }
              >
              <MenuItem value="P">Pendiente</MenuItem>
              <MenuItem value="C">Cerrado</MenuItem>
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
              <InputLabel>Estado 2</InputLabel>
              <Select
                value={editingPlan.estado2}
                onChange={handleEditPlanChange('estado2')}
                label="Estado 2"
                startAdornment={
                <InputAdornment position="start">
                  <FlagIcon />
                </InputAdornment>
                }
              >
                <MenuItem value="">Sin estado</MenuItem>
                <MenuItem value="aprobado">Aprobado</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
              </FormControl>
            </Grid>
          </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
          onClick={() => setOpenEditPlanModal(false)}
          color="inherit"
          startIcon={<CancelIcon />}
          >
          Cancelar
          </Button>
          <Button
          variant="contained"
          onClick={handleUpdatePlan}
          disabled={loading}
          startIcon={<CheckCircleIcon />}
          >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
        </Dialog>

        {/* Modal de Nuevo Tema */}
        <Dialog 
          open={openNuevoTemaModal} 
          onClose={handleCloseModals}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Agregar Nuevo Tema</Typography>
              <IconButton onClick={handleCloseModals}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Medio</InputLabel>
                  <Select
                    value={nuevoTema.id_medio || ''}
                    onChange={handleMedioChange}
                    name="id_medio"
                    label="Medio"
                    required
                  >
                    <MenuItem value="">
                      <em>Seleccione un medio</em>
                    </MenuItem>
                    {medios.map((medio) => (
                      <MenuItem key={medio.id} value={medio.id}>
                        {medio.NombredelMedio}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Tema"
                  name="NombreTema"
                  value={nuevoTema.NombreTema}
                  onChange={handleNuevoTemaChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TopicIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {visibleFields.duracion && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duración"
                    name="Duracion"
                    value={nuevoTema.Duracion}
                    onChange={handleNuevoTemaChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimerIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
              {visibleFields.color && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    name="color"
                    value={nuevoTema.color}
                    onChange={handleNuevoTemaChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ColorLensIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
              {visibleFields.codigo_megatime && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Código Megatime"
                    name="CodigoMegatime"
                    value={nuevoTema.CodigoMegatime}
                    onChange={handleNuevoTemaChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
              {visibleFields.calidad && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Calidad</InputLabel>
                    <Select
                      value={nuevoTema.id_Calidad || ''}
                      onChange={handleNuevoTemaChange}
                      name="id_Calidad"
                      label="Calidad"
                    >
                      <MenuItem value="">
                        <em>Seleccione una calidad</em>
                      </MenuItem>
                      {calidades.map((calidad) => (
                        <MenuItem key={calidad.id} value={calidad.id}>
                          {calidad.NombreCalidad}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {visibleFields.cooperado && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cooperado</InputLabel>
                    <Select
                      value={nuevoTema.cooperado}
                      onChange={handleNuevoTemaChange}
                      name="cooperado"
                      label="Cooperado"
                    >
                      <MenuItem value="">No</MenuItem>
                      <MenuItem value="Sí">Sí</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {visibleFields.rubro && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rubro"
                    name="rubro"
                    value={nuevoTema.rubro}
                    onChange={handleNuevoTemaChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModals}>Cancelar</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGuardarTema}
              disabled={loading || !nuevoTema.NombreTema || !nuevoTema.id_medio}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Duplicar Plan */}
        <Dialog 
          open={openDuplicatePlanModal} 
          onClose={() => setOpenDuplicatePlanModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Duplicar Plan
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Nuevo Plan"
                  value={duplicatePlanData.nombre_plan}
                  onChange={(e) => handleDuplicatePlanChange('nombre_plan', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={duplicatePlanData.anio}
                    label="Año"
                    onChange={(e) => handleDuplicatePlanChange('anio', e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <CalendarMonthIcon />
                      </InputAdornment>
                    }
                  >
                    {anios.map((anio) => (
                      <MenuItem key={anio.id} value={anio.id}>
                        {anio.years}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={duplicatePlanData.mes}
                    label="Mes"
                    onChange={(e) => handleDuplicatePlanChange('mes', e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <EventNoteIcon />
                      </InputAdornment>
                    }
                  >
                    {meses.map((mes) => (
                      <MenuItem key={mes.Id} value={mes.Id}>
                        {mes.Nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDuplicatePlanModal(false)}>Cancelar</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirmDuplicate}
              disabled={loading}
            >
              {loading ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Editar Tema */}
        <Dialog 
          open={openEditTemaModal} 
          onClose={handleCloseModals}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Editar Tema
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Tema"
                  value={selectedTema?.NombreTema || ''}
                  onChange={(e) => setSelectedTema({ ...selectedTema, NombreTema: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duración"
                  value={selectedTema?.Duracion || ''}
                  onChange={(e) => setSelectedTema({ ...selectedTema, Duracion: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Color"
                  value={selectedTema?.color || ''}
                  onChange={(e) => setSelectedTema({ ...selectedTema, color: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Código Megatime"
                  value={selectedTema?.CodigoMegatime || ''}
                  onChange={(e) => setSelectedTema({ ...selectedTema, CodigoMegatime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Rubro"
                  value={selectedTema?.rubro || ''}
                  onChange={(e) => setSelectedTema({ ...selectedTema, rubro: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTema?.cooperado || false}
                      onChange={(e) => setSelectedTema({ ...selectedTema, cooperado: e.target.checked })}
                    />
                  }
                  label="Cooperado"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModals}>Cancelar</Button>
            <Button variant="contained" color="primary" onClick={() => {
              // Aquí irá la lógica para actualizar el tema
              handleCloseModals();
            }}>
              Guardar Cambios
            </Button>
          </DialogActions>
        </Dialog>

    </Container>
  );
};

export default Planificacion;
